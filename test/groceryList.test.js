import test from "node:test";
import assert from "node:assert/strict";

import { cleanGroceryList } from "../src/utils/groceryList.js";

const baseInput = {
  pantry: ["Rice"],
};

test("combines duplicate ingredients from meals and grocery list", () => {
  const result = cleanGroceryList(
    {
      meals: [
        {
          ingredients: [
            { name: "Spinach", quantity: "1 cup", estimatedCost: 2 },
            { name: "Spinach", quantity: "2 cups", estimatedCost: 3 },
          ],
        },
      ],
      groceryList: [
        {
          category: "Produce",
          items: [{ name: "Spinach", quantity: "1 bunch", estimatedCost: 4 }],
        },
      ],
    },
    baseInput
  );

  const produceItems = result.groceryList.find((group) => group.category === "Produce").items;

  assert.equal(produceItems.length, 1);
  assert.equal(produceItems[0].name, "Spinach");
  assert.equal(produceItems[0].quantity, "1 cup + 2 cups");
});

test("marks already available ingredients and excludes them from total", () => {
  const result = cleanGroceryList(
    {
      meals: [
        {
          ingredients: [
            { name: "Rice", quantity: "1 cup", estimatedCost: 5 },
            { name: "Paneer", quantity: "8 oz", estimatedCost: 6 },
          ],
        },
      ],
      groceryList: [],
    },
    baseInput
  );

  const items = result.groceryList.flatMap((group) => group.items);

  assert.equal(items.find((item) => item.name === "Rice").alreadyAvailable, true);
  assert.equal(result.groceryTotalCost, 6);
});

test("groups items by category", () => {
  const result = cleanGroceryList(
    {
      meals: [
        {
          ingredients: [
            { name: "Spinach", quantity: "2 cups", estimatedCost: 2 },
            { name: "Yogurt", quantity: "1 cup", estimatedCost: 3 },
            { name: "Chickpeas", quantity: "1 can", estimatedCost: 2 },
            { name: "Rice", quantity: "1 cup", estimatedCost: 1 },
            { name: "Cumin", quantity: "1 tsp", estimatedCost: 0.5 },
          ],
        },
      ],
      groceryList: [],
    },
    { pantry: [] }
  );

  const categories = result.groceryList.map((group) => group.category);

  assert.deepEqual(categories, ["Produce", "Dairy", "Protein", "Grains", "Spices"]);
});
