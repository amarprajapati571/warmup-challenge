const savingSuggestions = [
  "Replace expensive proteins with cheaper alternatives.",
  "Use pantry ingredients first.",
  "Choose seasonal vegetables.",
  "Batch cook grains.",
  "Reduce specialty ingredients.",
];

export function calculateBudgetStatus(groceryItems, userBudget) {
  const safeBudget = roundMoney(userBudget);
  const estimatedTotal = roundMoney(sumGroceryCosts(groceryItems));
  const difference = roundMoney(safeBudget - estimatedTotal);
  const percentageUsed = safeBudget > 0 ? roundMoney((estimatedTotal / safeBudget) * 100) : 0;
  const status = getBudgetStatus(estimatedTotal, safeBudget);

  return {
    estimatedTotal,
    userBudget: safeBudget,
    difference,
    percentageUsed,
    status,
    message: getBudgetMessage(status),
    savingSuggestions: status === "Within budget" ? [] : savingSuggestions,
  };
}

export function flattenGroceryItems(groups) {
  if (!Array.isArray(groups)) {
    return [];
  }

  return groups.flatMap((group) => {
    if (!group || !Array.isArray(group.items)) {
      return [];
    }

    return group.items;
  });
}

function sumGroceryCosts(groceryItems) {
  if (!Array.isArray(groceryItems)) {
    return 0;
  }

  return groceryItems.reduce((total, item) => {
    if (!item || item.alreadyAvailable) {
      return total;
    }

    return total + Math.max(Number(item.estimatedCost) || 0, 0);
  }, 0);
}

function getBudgetStatus(estimatedTotal, userBudget) {
  if (userBudget <= 0 || estimatedTotal > userBudget) {
    return "Over budget";
  }

  if (estimatedTotal > userBudget * 0.85) {
    return "Near limit";
  }

  return "Within budget";
}

function getBudgetMessage(status) {
  if (status === "Within budget") {
    return "Great, this plan fits your budget.";
  }

  if (status === "Near limit") {
    return "This plan is close to your budget limit.";
  }

  return "This plan is over budget. Try the suggested substitutions.";
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
