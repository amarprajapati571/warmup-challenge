const allowedDayTypes = new Set(["busy-workday", "relaxed", "workout", "study", "travel", "family", "custom"]);
const allowedMeals = new Set(["breakfast", "lunch", "dinner"]);
const allowedCookingTimes = new Set([10, 25, 45, 75]);
const allowedDietaryPreferences = new Set(["none", "vegetarian", "vegan", "high-protein", "low-carb", "gluten-free", "custom"]);

const textLimits = {
  customDayType: 80,
  customDietaryPreference: 80,
  allergies: 140,
  pantry: 260,
  cuisineMood: 80,
};

export function sanitizePlannerInput(input = {}) {
  const mealsNeeded = Array.isArray(input.mealsNeeded)
    ? input.mealsNeeded.filter((meal) => allowedMeals.has(meal)).slice(0, 3)
    : [];
  const availableCookingTime = Number(input.availableCookingTime);
  const budget = Number(input.budget);
  const servings = Number(input.servings);

  return {
    dayType: allowedDayTypes.has(input.dayType) ? input.dayType : "busy-workday",
    customDayType: cleanText(input.customDayType, textLimits.customDayType),
    availableCookingTime: allowedCookingTimes.has(availableCookingTime) ? availableCookingTime : 25,
    mealsNeeded,
    dietaryPreference: allowedDietaryPreferences.has(input.dietaryPreference) ? input.dietaryPreference : "none",
    customDietaryPreference: cleanText(input.customDietaryPreference, textLimits.customDietaryPreference),
    allergies: cleanList(input.allergies, textLimits.allergies),
    pantry: cleanList(input.pantry, textLimits.pantry),
    budget: Number.isFinite(budget) ? Math.min(Math.max(budget, 0), 10000) : 0,
    servings: Number.isFinite(servings) ? Math.min(Math.max(Math.floor(servings), 0), 12) : 0,
    cuisineMood: cleanText(input.cuisineMood, textLimits.cuisineMood),
  };
}

export function validatePlannerInputData(input) {
  const errors = [];

  if (!allowedDayTypes.has(input.dayType)) {
    errors.push("Choose a valid day type.");
  }

  if (!allowedCookingTimes.has(input.availableCookingTime)) {
    errors.push("Choose a valid cooking time.");
  }

  if (input.mealsNeeded.length === 0) {
    errors.push("Choose at least one meal: breakfast, lunch, or dinner.");
  }

  if (!input.mealsNeeded.every((meal) => allowedMeals.has(meal))) {
    errors.push("Choose valid meals only.");
  }

  if (!allowedDietaryPreferences.has(input.dietaryPreference)) {
    errors.push("Choose a valid dietary preference.");
  }

  if (!Number.isFinite(input.budget) || input.budget <= 0) {
    errors.push("Enter a budget greater than 0.");
  }

  if (!Number.isFinite(input.servings) || input.servings < 1) {
    errors.push("Enter at least 1 serving.");
  }

  if (input.servings > 12) {
    errors.push("Keep servings at 12 or fewer.");
  }

  if (input.dayType === "custom" && input.customDayType.length === 0) {
    errors.push("Add a short custom day description, or choose a listed day type.");
  }

  if (input.dietaryPreference === "custom" && input.customDietaryPreference.length === 0) {
    errors.push("Add a short custom dietary preference, or choose a listed option.");
  }

  if (input.customDayType.length > textLimits.customDayType) {
    errors.push("Keep custom day details under 80 characters.");
  }

  if (input.customDietaryPreference.length > textLimits.customDietaryPreference) {
    errors.push("Keep custom dietary preference under 80 characters.");
  }

  if (input.allergies.join(", ").length > textLimits.allergies) {
    errors.push("Keep allergies and restrictions under 140 characters.");
  }

  if (input.pantry.join(", ").length > textLimits.pantry) {
    errors.push("Keep available ingredients under 260 characters.");
  }

  if (input.cuisineMood.length > textLimits.cuisineMood) {
    errors.push("Keep cuisine or mood under 80 characters.");
  }

  return errors;
}

function cleanList(value, maxLength) {
  const items = Array.isArray(value) ? value : splitList(value);
  const cleanedItems = [];
  let usedLength = 0;

  items.forEach((item) => {
    const cleaned = cleanText(item, 48);

    if (!cleaned || cleanedItems.includes(cleaned)) {
      return;
    }

    usedLength += cleaned.length + (cleanedItems.length > 0 ? 2 : 0);

    if (usedLength <= maxLength && cleanedItems.length < 20) {
      cleanedItems.push(cleaned);
    }
  });

  return cleanedItems;
}

function splitList(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
