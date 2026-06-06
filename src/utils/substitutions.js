const expensiveSwaps = {
  paneer: { substitute: "tofu or chickpeas", saving: 2.5, reason: "budget and availability" },
  quinoa: { substitute: "rice", saving: 2, reason: "budget" },
  "almond milk": { substitute: "regular milk", saving: 1.5, reason: "budget" },
  "fresh herbs": { substitute: "dried herbs", saving: 1.25, reason: "availability and budget" },
  "whole wheat wraps": { substitute: "rice bowls", saving: 1, reason: "budget and pantry flexibility" },
};

const veganConflicts = {
  paneer: "tofu",
  eggs: "scrambled tofu",
  "plain yogurt": "coconut yogurt or tahini lemon sauce",
  milk: "oat milk",
  butter: "olive oil",
};

const glutenFreeConflicts = {
  "whole wheat wraps": "rice bowls",
  bread: "rice cakes or corn tortillas",
  pasta: "rice noodles",
};

const lowCarbConflicts = {
  rice: "cauliflower rice or extra greens",
  oats: "egg scramble or tofu scramble",
  "whole wheat wraps": "lettuce wraps",
};

const availabilitySwaps = {
  paneer: "firm tofu",
  cilantro: "parsley or dried coriander",
  lemons: "vinegar or bottled lemon juice",
  "fresh herbs": "dried herbs",
};

export function cleanSubstitutions(plan, userInput) {
  const pantryItems = userInput.pantry || [];
  const pantrySet = new Set(pantryItems.map(normalizeName));
  const allergyText = (userInput.allergies || []).join(" ").toLowerCase();
  const substitutions = [];
  const ingredients = collectIngredients(plan);

  collectAiSubstitutions(plan.substitutions).forEach((substitution) => substitutions.push(substitution));

  ingredients.forEach((ingredient) => {
    const key = normalizeName(ingredient.name);
    const lowerName = ingredient.name.toLowerCase();

    if (expensiveSwaps[key] || ingredient.estimatedCost >= 3) {
      const swap = expensiveSwaps[key] || findPantrySwap(pantryItems, ingredient.name) || { substitute: "beans, lentils, or pantry grains", saving: 1.5, reason: "budget" };
      substitutions.push({
        original: ingredient.name,
        substitute: swap.substitute,
        reason: `Budget-friendly swap for ${ingredient.name}.`,
        estimatedSaving: swap.saving || 1,
        tags: ["budget"],
      });
    }

    if (userInput.dietaryPreference === "vegan" && veganConflicts[key]) {
      substitutions.push({
        original: ingredient.name,
        substitute: veganConflicts[key],
        reason: "Fits vegan preference.",
        estimatedSaving: key === "paneer" ? 2.5 : 0,
        tags: ["preference", key === "paneer" ? "budget" : ""].filter(Boolean),
      });
    }

    if (userInput.dietaryPreference === "gluten-free" && glutenFreeConflicts[key]) {
      substitutions.push({
        original: ingredient.name,
        substitute: glutenFreeConflicts[key],
        reason: "Avoids gluten while keeping the meal simple.",
        estimatedSaving: key === "whole wheat wraps" ? 1 : 0,
        tags: ["preference", key === "whole wheat wraps" ? "budget" : ""].filter(Boolean),
      });
    }

    if (userInput.dietaryPreference === "low-carb" && (lowCarbConflicts[key] || lowerName.includes("rice"))) {
      substitutions.push({
        original: ingredient.name,
        substitute: lowCarbConflicts[key] || "cauliflower rice or extra greens",
        reason: "Keeps the plan lower in carbohydrates.",
        estimatedSaving: 0,
        tags: ["preference"],
      });
    }

    if (conflictsWithAllergies(lowerName, allergyText)) {
      substitutions.push({
        original: ingredient.name,
        substitute: allergySafeSwap(lowerName),
        reason: "Avoids listed allergy or restriction.",
        estimatedSaving: 0,
        tags: ["allergy"],
      });
    }

    if (availabilitySwaps[key]) {
      substitutions.push({
        original: ingredient.name,
        substitute: availabilitySwaps[key],
        reason: "Easier to find in a regular grocery run.",
        estimatedSaving: key === "fresh herbs" ? 1.25 : 0,
        tags: ["availability", key === "fresh herbs" ? "budget" : ""].filter(Boolean),
      });
    }

    const pantrySwap = findPantrySwap(pantryItems, ingredient.name);

    if (!ingredient.alreadyAvailable && pantrySwap) {
      substitutions.push({
        original: ingredient.name,
        substitute: pantrySwap.substitute,
        reason: "Uses an ingredient you already have at home.",
        estimatedSaving: Math.max(ingredient.estimatedCost, pantrySwap.saving || 0),
        tags: ["pantry", "budget"],
      });
    }
  });

  if ((plan.budget?.status || "").toLowerCase().includes("over") || plan.groceryTotalCost > userInput.budget * 0.85) {
    substitutions.push(
      {
        original: "Fresh herbs",
        substitute: "Dried herbs",
        reason: "Cuts cost and avoids buying a full bunch for one meal.",
        estimatedSaving: 1.25,
        tags: ["budget", "availability"],
      },
      {
        original: "Quinoa or specialty grains",
        substitute: "Rice",
        reason: "Rice is cheaper and often already stocked at home.",
        estimatedSaving: 2,
        tags: ["budget", "pantry"],
      }
    );
  }

  return dedupeSubstitutions(substitutions).slice(0, 12);
}

function collectIngredients(plan) {
  const fromMeals = Array.isArray(plan.meals)
    ? plan.meals.flatMap((meal) => (Array.isArray(meal.ingredients) ? meal.ingredients : []))
    : [];
  const fromGroceries = Array.isArray(plan.groceryList)
    ? plan.groceryList.flatMap((group) => (Array.isArray(group.items) ? group.items : []))
    : [];

  return [...fromMeals, ...fromGroceries]
    .filter((item) => item && item.name)
    .map((item) => ({
      name: cleanText(item.name, 70),
      estimatedCost: Number(item.estimatedCost) || 0,
      alreadyAvailable: Boolean(item.alreadyAvailable),
    }));
}

function collectAiSubstitutions(substitutions) {
  if (!Array.isArray(substitutions)) {
    return [];
  }

  return substitutions
    .filter((substitution) => substitution?.original && substitution?.substitute && substitution?.reason)
    .map((substitution) => ({
      original: cleanText(substitution.original, 70),
      substitute: cleanText(substitution.substitute, 90),
      reason: cleanText(substitution.reason, 180),
      estimatedSaving: roundMoney(substitution.estimatedSaving),
      tags: inferTags(substitution.reason, substitution.estimatedSaving),
    }));
}

function findPantrySwap(pantryItems, originalName) {
  const original = normalizeName(originalName);

  if (pantryItems.length === 0) {
    return null;
  }

  const rice = pantryItems.find((item) => normalizeName(item).includes("rice"));
  const chickpeas = pantryItems.find((item) => normalizeName(item).includes("chickpea"));
  const eggs = pantryItems.find((item) => normalizeName(item).includes("egg"));

  if ((original.includes("quinoa") || original.includes("wrap") || original.includes("oat")) && rice) {
    return { substitute: rice, saving: 1.5 };
  }

  if ((original.includes("paneer") || original.includes("tofu")) && chickpeas) {
    return { substitute: chickpeas, saving: 2 };
  }

  if ((original.includes("tofu") || original.includes("paneer")) && eggs) {
    return { substitute: eggs, saving: 1.5 };
  }

  return null;
}

function conflictsWithAllergies(ingredientName, allergyText) {
  if (!allergyText) {
    return false;
  }

  return allergyText
    .split(/[, ]+/)
    .filter(Boolean)
    .some((allergy) => ingredientName.includes(allergy));
}

function allergySafeSwap(ingredientName) {
  if (ingredientName.includes("egg")) {
    return "scrambled tofu";
  }

  if (ingredientName.includes("milk") || ingredientName.includes("yogurt") || ingredientName.includes("paneer")) {
    return "dairy-free yogurt, tofu, or tahini sauce";
  }

  if (ingredientName.includes("nut") || ingredientName.includes("almond")) {
    return "roasted seeds";
  }

  return "safe pantry alternative";
}

function dedupeSubstitutions(substitutions) {
  const seen = new Set();

  return substitutions
    .filter((substitution) => substitution.original && substitution.substitute)
    .map((substitution) => ({
      ...substitution,
      estimatedSaving: roundMoney(substitution.estimatedSaving),
      tags: Array.isArray(substitution.tags) ? substitution.tags.filter(Boolean) : inferTags(substitution.reason, substitution.estimatedSaving),
    }))
    .filter((substitution) => {
      const key = `${normalizeName(substitution.original)}-${normalizeName(substitution.substitute)}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((first, second) => {
      const firstBudget = first.tags.includes("budget") ? 1 : 0;
      const secondBudget = second.tags.includes("budget") ? 1 : 0;

      return secondBudget - firstBudget || second.estimatedSaving - first.estimatedSaving;
    });
}

function inferTags(reason, estimatedSaving) {
  const text = String(reason || "").toLowerCase();
  const tags = [];

  if (text.includes("budget") || text.includes("cost") || Number(estimatedSaving) > 0) {
    tags.push("budget");
  }

  if (text.includes("allerg")) {
    tags.push("allergy");
  }

  if (text.includes("vegan") || text.includes("diet") || text.includes("preference") || text.includes("gluten")) {
    tags.push("preference");
  }

  if (text.includes("find") || text.includes("availability")) {
    tags.push("availability");
  }

  return tags;
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
