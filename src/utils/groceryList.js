const categoryOrder = ["Produce", "Dairy", "Protein", "Grains", "Spices", "Pantry", "Other"];

const categoryKeywords = {
  Produce: ["apple", "avocado", "bell pepper", "cilantro", "cucumber", "greens", "lemon", "lime", "onion", "pepper", "spinach", "tomato", "vegetable"],
  Dairy: ["butter", "cheese", "cream", "milk", "paneer", "yogurt"],
  Protein: ["beans", "chicken", "chickpea", "egg", "fish", "lentil", "meat", "paneer", "tofu", "turkey"],
  Grains: ["bread", "oat", "pasta", "quinoa", "rice", "roti", "tortilla", "wrap"],
  Spices: ["cumin", "masala", "paprika", "pepper", "salt", "spice", "turmeric"],
  Pantry: ["flour", "honey", "oil", "sauce", "stock", "sugar", "vinegar"],
};

export function cleanGroceryList(plan, userInput) {
  const pantrySet = new Set((userInput.pantry || []).map(normalizeName));
  const itemMap = new Map();

  collectMealIngredients(plan.meals, pantrySet).forEach((item) => mergeGroceryItem(itemMap, item));
  collectAiGroceryItems(plan.groceryList, pantrySet).forEach((item) => mergeGroceryItem(itemMap, item));

  const groupedItems = categoryOrder.map((category) => ({
    category,
    items: [...itemMap.values()]
      .filter((item) => item.category === category)
      .sort((first, second) => Number(first.alreadyAvailable) - Number(second.alreadyAvailable) || first.name.localeCompare(second.name)),
  }));

  const groceryList = groupedItems.filter((group) => group.items.length > 0);
  const groceryTotalCost = roundMoney(
    groceryList.reduce(
      (groupTotal, group) =>
        groupTotal +
        group.items.reduce((itemTotal, item) => itemTotal + (item.alreadyAvailable ? 0 : item.estimatedCost), 0),
      0
    )
  );

  return {
    groceryList,
    groceryTotalCost,
  };
}

export function buildGroceryCopyText(groups, totalLabel) {
  const lines = ["CookDay grocery list"];

  (Array.isArray(groups) ? groups : []).forEach((group) => {
    if (!group || !Array.isArray(group.items)) {
      return;
    }

    lines.push("", group.category);

    group.items.forEach((item) => {
      if (!item?.name) {
        return;
      }

      const status = item.alreadyAvailable ? "already at home" : "buy";
      lines.push(`- ${item.name} — ${item.quantity || "as needed"} — ${status}`);
    });
  });

  lines.push("", `Estimated shopping total: ${totalLabel}`);

  return lines.join("\n");
}

function collectMealIngredients(meals, pantrySet) {
  if (!Array.isArray(meals)) {
    return [];
  }

  return meals.flatMap((meal) => {
    if (!Array.isArray(meal.ingredients)) {
      return [];
    }

    return meal.ingredients.map((ingredient) => toCleanItem(ingredient, null, pantrySet, "meal")).filter(Boolean);
  });
}

function collectAiGroceryItems(groups, pantrySet) {
  if (!Array.isArray(groups)) {
    return [];
  }

  return groups.flatMap((group) => {
    if (!group || !Array.isArray(group.items)) {
      return [];
    }

    const category = categoryOrder.includes(group.category) ? group.category : null;
    return group.items.map((item) => toCleanItem(item, category, pantrySet, "ai")).filter(Boolean);
  });
}

function toCleanItem(item, category, pantrySet, source) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const name = cleanText(item.name, 70);

  if (!name) {
    return null;
  }

  const key = normalizeName(name);

  return {
    key,
    name,
    quantity: cleanText(item.quantity, 70) || "as needed",
    category: category || categorizeIngredient(name),
    alreadyAvailable: Boolean(item.alreadyAvailable) || pantrySet.has(key),
    estimatedCost: roundMoney(Number(item.estimatedCost) || 0),
    source,
  };
}

function mergeGroceryItem(itemMap, item) {
  const existing = itemMap.get(item.key);

  if (!existing) {
    itemMap.set(item.key, item);
    return;
  }

  existing.alreadyAvailable = existing.alreadyAvailable || item.alreadyAvailable;
  existing.quantity = existing.source === item.source ? mergeQuantity(existing.quantity, item.quantity) : existing.quantity;
  existing.estimatedCost =
    existing.source === item.source
      ? roundMoney(existing.estimatedCost + item.estimatedCost)
      : Math.max(existing.estimatedCost, item.estimatedCost);

  if (existing.category === "Other" && item.category !== "Other") {
    existing.category = item.category;
  }
}

function mergeQuantity(currentQuantity, nextQuantity) {
  if (!nextQuantity || currentQuantity === nextQuantity) {
    return currentQuantity;
  }

  if (!currentQuantity) {
    return nextQuantity;
  }

  return `${currentQuantity} + ${nextQuantity}`;
}

function categorizeIngredient(name) {
  const normalizedName = normalizeName(name);

  return (
    categoryOrder.find((category) =>
      (categoryKeywords[category] || []).some((keyword) => normalizedName.includes(keyword))
    ) || "Other"
  );
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ");
}

function cleanText(value, maxLength) {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function roundMoney(value) {
  return Math.round(Math.max(Number(value) || 0, 0) * 100) / 100;
}
