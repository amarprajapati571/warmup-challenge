import test from "node:test";
import assert from "node:assert/strict";

import { validatePlannerInput } from "../src/components/DayInputForm.js";
import { createMockPlan } from "../src/data/mockPlan.js";
import { validateCookingPlan } from "../src/services/generateCookingPlan.js";
import { cleanGroceryList } from "../src/utils/groceryList.js";
import { cleanSubstitutions } from "../src/utils/substitutions.js";

const baseInput = {
  dayType: "busy-workday",
  customDayType: "",
  availableCookingTime: 25,
  mealsNeeded: ["breakfast", "lunch", "dinner"],
  dietaryPreference: "vegan",
  customDietaryPreference: "",
  allergies: ["dairy"],
  pantry: ["rice", "chickpeas"],
  budget: 35,
  servings: 2,
  cuisineMood: "comfort food",
};

test("accepts a complete planner input", () => {
  assert.deepEqual(validatePlannerInput(baseInput), []);
});

test("rejects missing meals and invalid budget", () => {
  const errors = validatePlannerInput({ ...baseInput, mealsNeeded: [], budget: 0 });

  assert.match(errors.join(" "), /Choose at least one meal/);
  assert.match(errors.join(" "), /budget greater than 0/);
});

test("creates fallback plan with groceries and practical substitutions", () => {
  const fallbackPlan = createMockPlan(baseInput);
  const grocery = cleanGroceryList(fallbackPlan, baseInput);
  const substitutions = cleanSubstitutions({ ...fallbackPlan, ...grocery }, baseInput);

  assert.equal(fallbackPlan.meals.length, 3);
  assert.ok(grocery.groceryList.length > 0);
  assert.ok(substitutions.some((swap) => swap.tags.includes("budget") || swap.tags.includes("preference")));
});

test("validates and normalizes a complete cooking plan", () => {
  const fallbackPlan = createMockPlan(baseInput);
  const grocery = cleanGroceryList(fallbackPlan, baseInput);
  const substitutions = cleanSubstitutions({ ...fallbackPlan, ...grocery }, baseInput);
  const validation = validateCookingPlan({ ...fallbackPlan, ...grocery, substitutions }, baseInput);

  assert.equal(validation.valid, true);
  assert.equal(validation.plan.meals.length, 3);
  assert.ok(validation.plan.groceryTotalCost <= validation.plan.budget.estimatedTotal);
});
