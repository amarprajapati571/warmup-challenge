import test from "node:test";
import assert from "node:assert/strict";

import { validateCookingPlan } from "../src/services/generateCookingPlan.js";

const baseInput = {
  dayType: "busy-workday",
  customDayType: "",
  availableCookingTime: 25,
  mealsNeeded: ["breakfast"],
  dietaryPreference: "none",
  customDietaryPreference: "",
  allergies: [],
  pantry: [],
  budget: 20,
  servings: 1,
  cuisineMood: "quick",
};

const validResponse = {
  summary: "A quick breakfast plan.",
  meals: [
    {
      mealType: "Breakfast",
      name: "Egg rice bowl",
      reason: "Fast and filling.",
      prepTime: "5 min",
      cookTime: "10 min",
      ingredients: [
        {
          name: "Eggs",
          quantity: "2",
          alreadyAvailable: false,
          estimatedCost: 2,
        },
      ],
      steps: ["Cook eggs.", "Serve warm."],
    },
  ],
  todoList: [
    {
      task: "Cook eggs",
      mealType: "Breakfast",
      priority: "High",
      estimatedTime: "10 min",
    },
  ],
  groceryList: [
    {
      category: "Protein",
      items: [
        {
          name: "Eggs",
          quantity: "2",
          estimatedCost: 2,
          alreadyAvailable: false,
        },
      ],
    },
  ],
  substitutions: [
    {
      original: "Eggs",
      substitute: "Tofu",
      reason: "Preference-friendly alternative.",
      estimatedSaving: 0,
    },
  ],
  budget: {
    userBudget: 20,
    estimatedTotal: 2,
    status: "Within budget",
    message: "Fits the budget.",
    savingSuggestions: [],
  },
};

test("accepts valid AI response", () => {
  const validation = validateCookingPlan(validResponse, baseInput);

  assert.equal(validation.valid, true);
  assert.equal(validation.plan.meals.length, 1);
  assert.equal(validation.plan.budget.status, "Within budget");
});

test("rejects malformed AI response", () => {
  const validation = validateCookingPlan("not an object", baseInput);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes("Response must be an object."));
});

test("handles missing fields safely", () => {
  const validation = validateCookingPlan({ summary: "Missing core fields" }, baseInput);

  assert.equal(validation.valid, false);
  assert.equal(validation.plan, null);
  assert.ok(validation.errors.includes("Missing meals."));
  assert.ok(validation.errors.includes("Missing todoList."));
  assert.ok(validation.errors.includes("Missing groceryList."));
});
