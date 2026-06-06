import test from "node:test";
import assert from "node:assert/strict";

import { calculateBudgetStatus } from "../src/utils/budget.js";

test("returns within budget when total is at or below 85 percent", () => {
  const result = calculateBudgetStatus(
    [
      { name: "Rice", estimatedCost: 10 },
      { name: "Eggs", estimatedCost: 7 },
    ],
    20
  );

  assert.equal(result.estimatedTotal, 17);
  assert.equal(result.userBudget, 20);
  assert.equal(result.difference, 3);
  assert.equal(result.percentageUsed, 85);
  assert.equal(result.status, "Within budget");
  assert.equal(result.message, "Great, this plan fits your budget.");
  assert.deepEqual(result.savingSuggestions, []);
});

test("returns near limit when total is above 85 percent and within budget", () => {
  const result = calculateBudgetStatus([{ name: "Paneer", estimatedCost: 18 }], 20);

  assert.equal(result.status, "Near limit");
  assert.equal(result.difference, 2);
  assert.equal(result.percentageUsed, 90);
  assert.equal(result.message, "This plan is close to your budget limit.");
  assert.ok(result.savingSuggestions.includes("Use pantry ingredients first."));
});

test("returns over budget when total exceeds budget", () => {
  const result = calculateBudgetStatus([{ name: "Specialty grain", estimatedCost: 24 }], 20);

  assert.equal(result.status, "Over budget");
  assert.equal(result.difference, -4);
  assert.equal(result.percentageUsed, 120);
  assert.equal(result.message, "This plan is over budget. Try the suggested substitutions.");
  assert.ok(result.savingSuggestions.includes("Reduce specialty ingredients."));
});

test("does not count already available pantry items", () => {
  const result = calculateBudgetStatus(
    [
      { name: "Rice", estimatedCost: 8, alreadyAvailable: true },
      { name: "Spinach", estimatedCost: 4 },
    ],
    10
  );

  assert.equal(result.estimatedTotal, 4);
  assert.equal(result.difference, 6);
  assert.equal(result.status, "Within budget");
});

test("handles an empty grocery list", () => {
  const result = calculateBudgetStatus([], 20);

  assert.equal(result.estimatedTotal, 0);
  assert.equal(result.userBudget, 20);
  assert.equal(result.difference, 20);
  assert.equal(result.percentageUsed, 0);
  assert.equal(result.status, "Within budget");
});

test("treats invalid budget as over budget", () => {
  const result = calculateBudgetStatus([{ name: "Rice", estimatedCost: 4 }], 0);

  assert.equal(result.estimatedTotal, 4);
  assert.equal(result.userBudget, 0);
  assert.equal(result.difference, -4);
  assert.equal(result.percentageUsed, 0);
  assert.equal(result.status, "Over budget");
});
