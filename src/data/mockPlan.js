const mealOptions = {
  breakfast: {
    mealType: "Breakfast",
    name: "Savory oat bowl with eggs and spinach",
    reason: "It is quick, filling, and uses pantry-friendly staples for a packed day.",
    prepTime: "5 min",
    cookTime: "10 min",
    ingredients: [
      { name: "Rolled oats", quantity: "1 cup", estimatedCost: 1.5 },
      { name: "Eggs", quantity: "2", estimatedCost: 1.2 },
      { name: "Spinach", quantity: "2 cups", estimatedCost: 2 },
      { name: "Plain yogurt", quantity: "1/2 cup", estimatedCost: 1.25 },
    ],
    steps: ["Cook oats with water and a pinch of salt.", "Saute spinach while the oats thicken.", "Top oats with eggs, spinach, and yogurt."],
  },
  lunch: {
    mealType: "Lunch",
    name: "Chickpea rice bowl with cucumber salad",
    reason: "It packs well, keeps costs low, and can use rice or vegetables already at home.",
    prepTime: "10 min",
    cookTime: "15 min",
    ingredients: [
      { name: "Rice", quantity: "1 cup dry", estimatedCost: 1.4 },
      { name: "Chickpeas", quantity: "1 can", estimatedCost: 1.5 },
      { name: "Cucumber", quantity: "1", estimatedCost: 1.25 },
      { name: "Lemon", quantity: "1", estimatedCost: 0.75 },
    ],
    steps: ["Warm cooked rice or make a fresh pot.", "Rinse chickpeas and season with cumin and lemon.", "Chop cucumber and assemble the bowl."],
  },
  dinner: {
    mealType: "Dinner",
    name: "Sheet-pan paneer and vegetable wraps",
    reason: "Dinner is mostly hands-off and flexible for family, workout, or relaxed evenings.",
    prepTime: "12 min",
    cookTime: "25 min",
    ingredients: [
      { name: "Paneer", quantity: "8 oz", estimatedCost: 5 },
      { name: "Bell peppers", quantity: "2", estimatedCost: 2.5 },
      { name: "Red onion", quantity: "1", estimatedCost: 0.9 },
      { name: "Whole wheat wraps", quantity: "4", estimatedCost: 2.5 },
    ],
    steps: ["Slice vegetables and paneer.", "Roast with spices until browned.", "Fill wraps with roasted paneer and sauce."],
  },
};

const groceries = [
  {
    category: "Produce",
    items: [
      { name: "Spinach", quantity: "2 cups", estimatedCost: 2 },
      { name: "Cucumber", quantity: "1", estimatedCost: 1.25 },
      { name: "Bell peppers", quantity: "2", estimatedCost: 2.5 },
      { name: "Red onion", quantity: "1", estimatedCost: 0.9 },
      { name: "Lemons", quantity: "2", estimatedCost: 1.5 },
      { name: "Cilantro", quantity: "1 bunch", estimatedCost: 1.25 },
    ],
  },
  {
    category: "Protein",
    items: [
      { name: "Eggs", quantity: "2", estimatedCost: 1.2 },
      { name: "Chickpeas", quantity: "1 can", estimatedCost: 1.5 },
      { name: "Paneer", quantity: "8 oz", estimatedCost: 5 },
    ],
  },
  {
    category: "Grains",
    items: [
      { name: "Rolled oats", quantity: "1 cup", estimatedCost: 1.5 },
      { name: "Rice", quantity: "1 cup dry", estimatedCost: 1.4 },
      { name: "Whole wheat wraps", quantity: "4", estimatedCost: 2.5 },
    ],
  },
  {
    category: "Dairy",
    items: [{ name: "Plain yogurt", quantity: "1/2 cup", estimatedCost: 1.25 }],
  },
  {
    category: "Spices",
    items: [
      { name: "Olive oil", quantity: "2 tbsp", estimatedCost: 0.5 },
      { name: "Cumin", quantity: "1 tsp", estimatedCost: 0.25 },
      { name: "Paprika", quantity: "1 tsp", estimatedCost: 0.25 },
      { name: "Salt", quantity: "to taste", estimatedCost: 0.05 },
      { name: "Black pepper", quantity: "to taste", estimatedCost: 0.05 },
    ],
  },
];

const substitutions = [
  {
    original: "Paneer",
    substitute: "Tofu or chickpeas",
    reason: "Lower cost and vegan-friendly.",
    estimatedSaving: 2.5,
  },
  {
    original: "Eggs",
    substitute: "Scrambled tofu",
    reason: "Useful for egg allergies or vegan days.",
    estimatedSaving: 0,
  },
  {
    original: "Plain yogurt",
    substitute: "Coconut yogurt or tahini lemon sauce",
    reason: "Works for dairy-free restrictions.",
    estimatedSaving: 0,
  },
  {
    original: "Whole wheat wraps",
    substitute: "Rice bowls",
    reason: "Keeps the meal gluten free.",
    estimatedSaving: 1,
  },
];

const dayLabels = {
  "busy-workday": "Quick workday plan",
  relaxed: "Flexible day plan",
  workout: "Protein-aware day plan",
  study: "Focus-friendly day plan",
  travel: "Portable day plan",
  family: "Family-style day plan",
  custom: "Custom day plan",
};

export function createMockPlan(input) {
  const meals = input.mealsNeeded.map((meal) => mealOptions[meal]).filter(Boolean);
  const estimatedCost = calculateEstimatedCost(input);

  return {
    summary: `${dayLabels[input.dayType] || "Balanced day plan"} built around ${input.servings} serving${input.servings === 1 ? "" : "s"}, ${input.availableCookingTime} minutes, and a ${input.budget} budget.`,
    meals: markAvailableIngredients(meals, input.pantry),
    todoList: createTodos(input, meals),
    groceryList: filterPantryItems(groceries, input.pantry),
    substitutions: personalizeSubstitutions(input),
    budget: createBudgetSummary(input.budget, estimatedCost),
  };
}

function createTodos(input, meals) {
  const mealTypes = new Set(meals.map((meal) => meal.mealType));
  const hasBreakfast = mealTypes.has("Breakfast");
  const hasLunch = mealTypes.has("Lunch");
  const hasDinner = mealTypes.has("Dinner");
  const isBusyDay = input.dayType === "busy-workday" || input.dayType === "travel" || input.availableCookingTime < 15;
  const isBatchFriendly = hasLunch && hasDinner;
  const tasks = [
    {
      task: isBusyDay
        ? "Set out a cutting board, one pan, containers, and the fastest ingredients first."
        : "Wash and chop vegetables for the selected meals.",
      mealType: "General",
      priority: "High",
      estimatedTime: isBusyDay ? "3 min" : "10 min",
    },
  ];

  if (isBatchFriendly) {
    tasks.push({
      task: "Boil rice for lunch and dinner together.",
      mealType: "Lunch/Dinner",
      priority: "Medium",
      estimatedTime: "20 min",
    });
  } else {
    tasks.push({
      task: "Start the grain or oat base before chopping vegetables.",
      mealType: "General",
      priority: "High",
      estimatedTime: "10 min",
    });
  }

  if (hasBreakfast) {
    tasks.push({
      task: "Cook the breakfast oat bowl and portion toppings while it thickens.",
      mealType: "Breakfast",
      priority: isBusyDay ? "High" : "Medium",
      estimatedTime: "15 min",
    });
  }

  if (hasLunch) {
    tasks.push(
      {
        task: "Rinse chickpeas and season them while the rice warms.",
        mealType: "Lunch",
        priority: "Medium",
        estimatedTime: "5 min",
      },
      {
        task: "Pack lunch before leaving and keep dressing separate.",
        mealType: "Lunch",
        priority: isBusyDay || input.dayType === "travel" ? "High" : "Medium",
        estimatedTime: "5 min",
      }
    );
  }

  if (hasDinner) {
    tasks.push({
      task: "Roast paneer and vegetables on one sheet pan.",
      mealType: "Dinner",
      priority: "Medium",
      estimatedTime: "25 min",
    });
  }

  if (isBusyDay) {
    tasks.push({
      task: "Pre-pack snacks, utensils, and napkins with any travel or office meal.",
      mealType: "General",
      priority: "Medium",
      estimatedTime: "4 min",
    });
  }

  if (input.servings > 2 || input.dayType === "family" || isBatchFriendly) {
    tasks.push({
      task: "Batch-prep extra chopped vegetables for tomorrow.",
      mealType: "General",
      priority: "Low",
      estimatedTime: "8 min",
    });
  }

  tasks.push(
    {
      task: `Portion leftovers for ${input.servings} serving${input.servings === 1 ? "" : "s"} and label containers.`,
      mealType: "General",
      priority: "Low",
      estimatedTime: "5 min",
    },
    {
      task: "Wipe counters, rinse the cutting board, and load used dishes.",
      mealType: "General",
      priority: "Low",
      estimatedTime: "7 min",
    }
  );

  return tasks;
}

function filterPantryItems(groups, pantry) {
  const pantrySet = new Set(pantry.map((item) => item.toLowerCase()));

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !pantrySet.has(item.name.toLowerCase())),
    }))
    .filter((group) => group.items.length > 0);
}

function markAvailableIngredients(meals, pantry) {
  const pantrySet = new Set(pantry.map((item) => item.toLowerCase()));

  return meals.map((meal) => ({
    ...meal,
    ingredients: meal.ingredients.map((ingredient) => ({
      ...ingredient,
      alreadyAvailable: pantrySet.has(ingredient.name.toLowerCase()),
    })),
  }));
}

function personalizeSubstitutions(input) {
  const allergyText = input.allergies.join(", ").toLowerCase();
  const personalized = [...substitutions];

  if (
    input.dietaryPreference === "vegetarian" ||
    input.dietaryPreference === "vegan" ||
    input.dietaryPreference === "custom"
  ) {
    personalized.unshift({
      original: "Any meat add-on",
      substitute: "Lentils, tofu, paneer, or chickpeas",
      reason: "Keeps protein high without meat.",
      estimatedSaving: 1.5,
    });
  }

  if (input.dietaryPreference === "low-carb") {
    personalized.unshift({
      original: "Rice or wraps",
      substitute: "Cauliflower rice or extra greens",
      reason: "Keeps the meal lower in carbohydrates.",
      estimatedSaving: 0,
    });
  }

  if (allergyText.includes("peanut") || allergyText.includes("nut")) {
    personalized.unshift({
      original: "Nut toppings",
      substitute: "Roasted seeds or crispy chickpeas",
      reason: "Avoids common nut allergens.",
      estimatedSaving: 0.5,
    });
  }

  return personalized.slice(0, 5);
}

function calculateEstimatedCost(input) {
  const baseByMeal = {
    breakfast: 7,
    lunch: 12,
    dinner: 16,
  };
  const mealBase = input.mealsNeeded.reduce((total, meal) => total + (baseByMeal[meal] || 0), 0);
  const pantryDiscount = Math.min(input.pantry.length * 1.5, mealBase * 0.3);
  const servingMultiplier = Math.max(input.servings, 1) / 2;

  return Math.max(5, Math.round((mealBase * servingMultiplier - pantryDiscount) * 100) / 100);
}

function createBudgetSummary(limit, estimatedCost) {
  const ratio = estimatedCost / limit;

  if (ratio <= 0.85) {
    return {
      status: "Within budget",
      userBudget: limit,
      estimatedTotal: estimatedCost,
      message: "This plan leaves room for pantry staples or an extra snack.",
      savingSuggestions: [],
    };
  }

  if (ratio <= 1) {
    return {
      status: "Near limit",
      userBudget: limit,
      estimatedTotal: estimatedCost,
      message: "The plan fits, but the margin is tight.",
      savingSuggestions: ["Use pantry grains before buying wraps.", "Choose seasonal vegetables."],
    };
  }

  return {
    status: "Over budget",
    userBudget: limit,
    estimatedTotal: estimatedCost,
    message: "A few swaps can bring the plan back under budget.",
    savingSuggestions: [
      "Replace paneer with chickpeas or tofu.",
      "Use one grain base across lunch and dinner.",
      "Skip fresh herbs and lean on dried spices.",
    ],
  };
}
