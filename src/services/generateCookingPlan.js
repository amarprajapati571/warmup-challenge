import { createMockPlan } from "../data/mockPlan.js";
import { calculateBudgetStatus, flattenGroceryItems } from "../utils/budget.js";
import { cleanGroceryList } from "../utils/groceryList.js";
import { cleanSubstitutions } from "../utils/substitutions.js";

const endpoint = "/api/generate-cooking-plan";
const allowedMealTypes = ["Breakfast", "Lunch", "Dinner"];
const allowedTodoMealTypes = [...allowedMealTypes, "Lunch/Dinner", "General"];
const allowedPriorities = ["High", "Medium", "Low"];
const allowedCategories = ["Produce", "Dairy", "Protein", "Grains", "Spices", "Pantry", "Other"];
const allowedBudgetStatuses = ["Within budget", "Near limit", "Over budget"];

export async function generateCookingPlan(userInput) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userInput,
        prompt: buildCookingPlanPrompt(userInput),
        schema: cookingPlanSchema,
      }),
    });

    if (!response.ok) {
      throw new Error("Cooking plan API unavailable.");
    }

    const candidatePlan = await response.json();
    const validation = validateCookingPlan(candidatePlan, userInput);

    if (!validation.valid) {
      throw new Error(`Invalid cooking plan response: ${validation.errors.join(", ")}`);
    }

    return validation.plan;
  } catch {
    console.info("Using safe fallback cooking plan.");
    const fallbackPlan = createMockPlan(userInput);
    const grocery = cleanGroceryList(fallbackPlan, userInput);
    const planWithGrocery = {
      ...fallbackPlan,
      ...grocery,
    };
    const budget = calculateBudgetStatus(flattenGroceryItems(planWithGrocery.groceryList), userInput.budget);

    return {
      ...planWithGrocery,
      budget,
      substitutions: cleanSubstitutions(planWithGrocery, userInput),
    };
  }
}

export function buildCookingPlanPrompt(userInput) {
  return `
You are a practical meal-planning assistant.

Return valid JSON only.
Do not include markdown.
Do not include extra explanation.
Respect allergies and restrictions.
Prefer ingredients the user already has.
Keep meals realistic and simple.
Keep total cost close to the user's budget.
Create the todoList as a personal cooking task list, not a recipe summary.
Include prep tasks, cooking tasks, packing or storage tasks when useful, cleanup reminders, time-saving tasks for busy days, and batch-prep suggestions when appropriate.
Each todoList item must have task, mealType, priority, and estimatedTime.
Create substitutions for expensive ingredients, dietary conflicts, allergy conflicts, hard-to-find ingredients, and swaps that use the user's available pantry items.
Each substitution must include original, substitute, reason, and estimatedSaving when budget-related.

Personalize the plan using this user input:
${JSON.stringify(userInput, null, 2)}

Return exactly this JSON shape:
${JSON.stringify(cookingPlanSchema, null, 2)}
`;
}

export function validateCookingPlan(candidatePlan, userInput) {
  const errors = [];

  if (!isPlainObject(candidatePlan)) {
    return { valid: false, errors: ["Response must be an object."], plan: null };
  }

  if (!isNonEmptyString(candidatePlan.summary)) {
    errors.push("Missing summary.");
  }

  if (!Array.isArray(candidatePlan.meals) || candidatePlan.meals.length === 0) {
    errors.push("Missing meals.");
  }

  if (!Array.isArray(candidatePlan.todoList) || candidatePlan.todoList.length === 0) {
    errors.push("Missing todoList.");
  }

  if (!Array.isArray(candidatePlan.groceryList)) {
    errors.push("Missing groceryList.");
  }

  if (!Array.isArray(candidatePlan.substitutions)) {
    errors.push("Missing substitutions.");
  }

  if (!isPlainObject(candidatePlan.budget)) {
    errors.push("Missing budget.");
  }

  if (errors.length > 0) {
    return { valid: false, errors, plan: null };
  }

  const requestedMealTypes = userInput.mealsNeeded.map(toDisplayMealType);
  const meals = candidatePlan.meals
    .filter((meal) => isValidMeal(meal, requestedMealTypes))
    .map((meal) => ({
      mealType: meal.mealType,
      name: limitText(meal.name, 90),
      reason: limitText(meal.reason, 180),
      prepTime: limitText(meal.prepTime, 40),
      cookTime: limitText(meal.cookTime, 40),
      ingredients: meal.ingredients.slice(0, 16).map((ingredient) => ({
        name: limitText(ingredient.name, 70),
        quantity: limitText(ingredient.quantity, 50),
        alreadyAvailable: Boolean(ingredient.alreadyAvailable),
        estimatedCost: toSafeCost(ingredient.estimatedCost),
      })),
      steps: meal.steps.slice(0, 8).map((step) => limitText(step, 180)),
    }));

  if (meals.length === 0) {
    errors.push("No valid requested meals were returned.");
  }

  const todoList = candidatePlan.todoList
    .filter(isValidTodo)
    .slice(0, 14)
    .map((todo) => ({
      task: limitText(todo.task, 160),
      mealType: todo.mealType,
      priority: todo.priority,
      estimatedTime: limitText(todo.estimatedTime, 40),
    }));

  if (todoList.length === 0) {
    errors.push("No valid to-do tasks were returned.");
  }

  const aiGroceryList = candidatePlan.groceryList
    .filter(isValidGroceryGroup)
    .map((group) => ({
      category: group.category,
      items: group.items.slice(0, 20).map((item) => ({
        name: limitText(item.name, 70),
        quantity: limitText(item.quantity, 50),
        estimatedCost: toSafeCost(item.estimatedCost),
        alreadyAvailable: Boolean(item.alreadyAvailable),
      })),
    }))
    .filter((group) => group.items.length > 0);

  const substitutions = candidatePlan.substitutions
    .filter(isValidSubstitution)
    .slice(0, 10)
    .map((substitution) => ({
      original: limitText(substitution.original, 70),
      substitute: limitText(substitution.substitute, 90),
      reason: limitText(substitution.reason, 180),
      estimatedSaving: toSafeCost(substitution.estimatedSaving),
    }));

  const budget = validateBudget(candidatePlan.budget, userInput);

  if (!budget) {
    errors.push("Budget response is invalid.");
  }

  const normalizedPlan = {
    summary: limitText(candidatePlan.summary, 220),
    meals,
    todoList,
    groceryList: aiGroceryList,
    substitutions,
    budget,
  };
  const grocery = cleanGroceryList(normalizedPlan, userInput);
  const planWithGrocery = {
    ...normalizedPlan,
    ...grocery,
  };
  const calculatedBudget = calculateBudgetStatus(flattenGroceryItems(planWithGrocery.groceryList), userInput.budget);

  return {
    valid: errors.length === 0,
    errors,
    plan: {
      ...planWithGrocery,
      budget: calculatedBudget,
      substitutions: cleanSubstitutions(planWithGrocery, userInput),
    },
  };
}

function isValidMeal(meal, requestedMealTypes) {
  return (
    isPlainObject(meal) &&
    requestedMealTypes.includes(meal.mealType) &&
    isNonEmptyString(meal.name) &&
    isNonEmptyString(meal.reason) &&
    isNonEmptyString(meal.prepTime) &&
    isNonEmptyString(meal.cookTime) &&
    Array.isArray(meal.ingredients) &&
    meal.ingredients.every(isValidIngredient) &&
    Array.isArray(meal.steps) &&
    meal.steps.every(isNonEmptyString)
  );
}

function isValidIngredient(ingredient) {
  return (
    isPlainObject(ingredient) &&
    isNonEmptyString(ingredient.name) &&
    isNonEmptyString(ingredient.quantity) &&
    typeof ingredient.alreadyAvailable === "boolean" &&
    isSafeNumber(ingredient.estimatedCost)
  );
}

function isValidTodo(todo) {
  return (
    isPlainObject(todo) &&
    isNonEmptyString(todo.task) &&
    allowedTodoMealTypes.includes(todo.mealType) &&
    allowedPriorities.includes(todo.priority) &&
    isNonEmptyString(todo.estimatedTime)
  );
}

function isValidGroceryGroup(group) {
  return (
    isPlainObject(group) &&
    allowedCategories.includes(group.category) &&
    Array.isArray(group.items) &&
    group.items.every(
      (item) =>
        isPlainObject(item) &&
        isNonEmptyString(item.name) &&
        isNonEmptyString(item.quantity) &&
        isSafeNumber(item.estimatedCost) &&
        (item.alreadyAvailable === undefined || typeof item.alreadyAvailable === "boolean")
    )
  );
}

function isValidSubstitution(substitution) {
  return (
    isPlainObject(substitution) &&
    isNonEmptyString(substitution.original) &&
    isNonEmptyString(substitution.substitute) &&
    isNonEmptyString(substitution.reason) &&
    (substitution.estimatedSaving === undefined || isSafeNumber(substitution.estimatedSaving))
  );
}

function validateBudget(budget, userInput) {
  if (
    !isPlainObject(budget) ||
    !isSafeNumber(budget.userBudget) ||
    !isSafeNumber(budget.estimatedTotal) ||
    !allowedBudgetStatuses.includes(budget.status) ||
    !isNonEmptyString(budget.message) ||
    !Array.isArray(budget.savingSuggestions)
  ) {
    return null;
  }

  return {
    userBudget: userInput.budget,
    estimatedTotal: toSafeCost(budget.estimatedTotal),
    status: budget.status,
    message: limitText(budget.message, 180),
    savingSuggestions: budget.savingSuggestions.filter(isNonEmptyString).slice(0, 5).map((suggestion) => limitText(suggestion, 160)),
  };
}

function toDisplayMealType(mealType) {
  return `${mealType.charAt(0).toUpperCase()}${mealType.slice(1)}`;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isSafeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function toSafeCost(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function limitText(value, maxLength) {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

const cookingPlanSchema = {
  summary: "short personalized summary",
  meals: [
    {
      mealType: "Breakfast | Lunch | Dinner",
      name: "meal name",
      reason: "why this meal fits the user's day",
      prepTime: "estimated prep time",
      cookTime: "estimated cook time",
      ingredients: [
        {
          name: "ingredient name",
          quantity: "quantity for selected servings",
          alreadyAvailable: true,
          estimatedCost: 0,
        },
      ],
      steps: ["step 1", "step 2", "step 3"],
    },
  ],
  todoList: [
    {
      task: "task description",
      mealType: "Breakfast | Lunch | Dinner | Lunch/Dinner | General",
      priority: "High | Medium | Low",
      estimatedTime: "time estimate",
    },
  ],
  groceryList: [
    {
      category: "Produce | Dairy | Protein | Grains | Spices | Pantry | Other",
      items: [
        {
          name: "item name",
          quantity: "quantity",
          estimatedCost: 0,
          alreadyAvailable: false,
        },
      ],
    },
  ],
  substitutions: [
    {
      original: "ingredient",
      substitute: "alternative ingredient",
      reason: "budget, allergy, availability, or preference reason",
      estimatedSaving: 0,
    },
  ],
  budget: {
    userBudget: 0,
    estimatedTotal: 0,
    status: "Within budget | Near limit | Over budget",
    message: "short explanation",
    savingSuggestions: ["suggestion 1", "suggestion 2"],
  },
};
