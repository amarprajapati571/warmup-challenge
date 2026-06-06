import { escapeHtml } from "../utils/escapeHtml.js";
import { formatCurrency } from "../utils/formatCurrency.js";

export function SubstitutionList(substitutions) {
  const safeSubstitutions = normalizeSubstitutions(substitutions);

  return `
    <section class="result-card" aria-labelledby="substitution-list-title">
      <div class="section-heading substitution-heading">
        <div>
          <p class="eyebrow">Flex options</p>
          <h3 id="substitution-list-title">Substitutions</h3>
        </div>
        <button class="secondary-button" type="button" aria-pressed="false" data-show-cheaper-swaps>Show cheaper swaps</button>
      </div>
      <ul class="substitution-list">
        ${safeSubstitutions
          .map(
            (substitution) => `
              <li class="${substitution.tags.includes("budget") ? "is-budget-swap" : ""}" data-substitution-item>
                <span>${escapeHtml(substitution.original)}</span>
                <strong>${escapeHtml(substitution.substitute)}</strong>
                <small>${escapeHtml(substitution.reason)}</small>
                ${
                  substitution.estimatedSaving > 0
                    ? `<em>Estimated saving: ${formatCurrency(substitution.estimatedSaving)}</em>`
                    : ""
                }
              </li>
            `
          )
          .join("")}
      </ul>
    </section>
  `;
}

export function setupSubstitutionList(container) {
  const button = container.querySelector("[data-show-cheaper-swaps]");
  const items = [...container.querySelectorAll("[data-substitution-item]")];

  button?.addEventListener("click", () => {
    const isActive = button.getAttribute("aria-pressed") === "true";
    const nextActive = !isActive;

    button.setAttribute("aria-pressed", String(nextActive));
    button.textContent = nextActive ? "Show all swaps" : "Show cheaper swaps";

    items.forEach((item) => {
      const isBudgetSwap = item.classList.contains("is-budget-swap");

      item.classList.toggle("is-highlighted", nextActive && isBudgetSwap);
      item.hidden = nextActive && !isBudgetSwap;
    });
  });
}

function normalizeSubstitutions(substitutions) {
  if (!Array.isArray(substitutions)) {
    return [];
  }

  return substitutions
    .filter((substitution) => substitution?.original && substitution?.substitute && substitution?.reason)
    .map((substitution) => ({
      original: String(substitution.original),
      substitute: String(substitution.substitute),
      reason: String(substitution.reason),
      estimatedSaving: Number(substitution.estimatedSaving) || 0,
      tags: Array.isArray(substitution.tags) ? substitution.tags : [],
    }));
}
