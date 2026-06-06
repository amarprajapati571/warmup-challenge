import { escapeHtml } from "../utils/escapeHtml.js";
import { formatCurrency } from "../utils/formatCurrency.js";

export function BudgetSummary(budget) {
  const budgetClass = budget.status.toLowerCase().includes("within")
    ? "within"
    : budget.status.toLowerCase().includes("near")
      ? "near"
      : "over";

  return `
    <section class="budget-summary budget-${budgetClass}" aria-labelledby="budget-summary-title">
      <div>
        <p class="eyebrow">Budget feasibility</p>
        <h3 id="budget-summary-title">
          <span class="status-badge">${escapeHtml(budget.status)}</span>
        </h3>
      </div>
      <dl>
        <div>
          <dt>Budget</dt>
          <dd>${formatCurrency(budget.userBudget)}</dd>
        </div>
        <div>
          <dt>Estimated total</dt>
          <dd>${formatCurrency(budget.estimatedTotal)}</dd>
        </div>
        <div>
          <dt>${budget.difference >= 0 ? "Remaining" : "Over by"}</dt>
          <dd>${formatCurrency(Math.abs(budget.difference))}</dd>
        </div>
        <div>
          <dt>Used</dt>
          <dd>${escapeHtml(budget.percentageUsed)}%</dd>
        </div>
      </dl>
      <p>${escapeHtml(budget.message)}</p>
      ${
        budget.savingSuggestions.length > 0
          ? `<ul>${budget.savingSuggestions.map((saving) => `<li>${escapeHtml(saving)}</li>`).join("")}</ul>`
          : ""
      }
    </section>
  `;
}
