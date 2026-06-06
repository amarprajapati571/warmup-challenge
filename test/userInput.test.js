import test from "node:test";
import assert from "node:assert/strict";

import { sanitizePlannerInput, validatePlannerInputData } from "../src/utils/userInput.js";

test("sanitizes text length, controls, meals, and numeric limits", () => {
  const input = sanitizePlannerInput({
    dayType: "invalid",
    customDayType: "Late\u0000shift ".repeat(20),
    availableCookingTime: 999,
    mealsNeeded: ["breakfast", "snack", "dinner"],
    dietaryPreference: "unknown",
    allergies: "peanuts, dairy, ".repeat(20),
    pantry: ["Rice", "Rice", "Eggs"],
    budget: 50000,
    servings: 99,
    cuisineMood: "quick ".repeat(40),
  });

  assert.equal(input.dayType, "busy-workday");
  assert.equal(input.availableCookingTime, 25);
  assert.deepEqual(input.mealsNeeded, ["breakfast", "dinner"]);
  assert.equal(input.dietaryPreference, "none");
  assert.equal(input.customDayType.length <= 80, true);
  assert.equal(input.pantry.length, 2);
  assert.equal(input.budget, 10000);
  assert.equal(input.servings, 12);
  assert.equal(input.cuisineMood.length <= 80, true);
});

test("validates required custom fields and positive budget", () => {
  const input = sanitizePlannerInput({
    dayType: "custom",
    availableCookingTime: 25,
    mealsNeeded: [],
    dietaryPreference: "custom",
    budget: 0,
    servings: 0,
  });

  const errors = validatePlannerInputData(input);

  assert.ok(errors.includes("Choose at least one meal: breakfast, lunch, or dinner."));
  assert.ok(errors.includes("Enter a budget greater than 0."));
  assert.ok(errors.includes("Enter at least 1 serving."));
  assert.ok(errors.includes("Add a short custom day description, or choose a listed day type."));
  assert.ok(errors.includes("Add a short custom dietary preference, or choose a listed option."));
});

test("requires budget, servings, and at least one meal", () => {
  const errors = validatePlannerInputData({
    dayType: "busy-workday",
    customDayType: "",
    availableCookingTime: 25,
    mealsNeeded: [],
    dietaryPreference: "none",
    customDietaryPreference: "",
    allergies: [],
    pantry: [],
    budget: 0,
    servings: 0,
    cuisineMood: "quick",
  });

  assert.ok(errors.includes("Enter a budget greater than 0."));
  assert.ok(errors.includes("Enter at least 1 serving."));
  assert.ok(errors.includes("Choose at least one meal: breakfast, lunch, or dinner."));
});

test("rejects invalid text length", () => {
  const errors = validatePlannerInputData({
    dayType: "busy-workday",
    customDayType: "a".repeat(81),
    availableCookingTime: 25,
    mealsNeeded: ["breakfast"],
    dietaryPreference: "none",
    customDietaryPreference: "",
    allergies: ["a".repeat(141)],
    pantry: ["p".repeat(261)],
    budget: 20,
    servings: 1,
    cuisineMood: "c".repeat(81),
  });

  assert.ok(errors.includes("Keep custom day details under 80 characters."));
  assert.ok(errors.includes("Keep allergies and restrictions under 140 characters."));
  assert.ok(errors.includes("Keep available ingredients under 260 characters."));
  assert.ok(errors.includes("Keep cuisine or mood under 80 characters."));
});
