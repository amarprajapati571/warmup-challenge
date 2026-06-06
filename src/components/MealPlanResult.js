import { BudgetSummary } from "./BudgetSummary.js";
import { GroceryList } from "./GroceryList.js";
import { SubstitutionList } from "./SubstitutionList.js";
import { TodoList } from "./TodoList.js";
import { escapeHtml } from "../utils/escapeHtml.js";

export function MealPlanResult(plan, completedTaskIds = new Set(), checkedGroceryItemIds = new Set()) {
  return `
    <div class="result-stack">
      ${BudgetSummary(plan.budget)}

      <section class="result-card" aria-labelledby="meal-plan-title">
        <div class="section-heading">
          <p class="eyebrow">Personalized plan</p>
          <h3 id="meal-plan-title">Meal plan</h3>
          <p>${escapeHtml(plan.summary)}</p>
        </div>
        <div class="meal-grid">
          ${plan.meals
            .map(
              (meal) => `
                <article class="meal-card">
                  <div>
                    <p class="meal-type">${escapeHtml(meal.mealType)}</p>
                    <h4>${escapeHtml(meal.name)}</h4>
                  </div>
                  <p>${escapeHtml(meal.reason)}</p>
                  <dl class="meal-meta">
                    <div>
                      <dt>Prep</dt>
                      <dd>${escapeHtml(meal.prepTime)}</dd>
                    </div>
                    <div>
                      <dt>Cook</dt>
                      <dd>${escapeHtml(meal.cookTime)}</dd>
                    </div>
                  </dl>
                  <details>
                    <summary>Ingredients and steps</summary>
                    <ul class="ingredient-list">
                      ${meal.ingredients
                        .map(
                          (ingredient) => `
                            <li>
                              ${escapeHtml(ingredient.quantity)} ${escapeHtml(ingredient.name)}
                              ${ingredient.alreadyAvailable ? "<span>At home</span>" : ""}
                            </li>
                          `
                        )
                        .join("")}
                    </ul>
                    <ol class="meal-steps">
                      ${meal.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
                    </ol>
                  </details>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      ${TodoList(plan.todoList, completedTaskIds)}
      ${GroceryList(plan.groceryList, plan.groceryTotalCost, checkedGroceryItemIds)}
      ${SubstitutionList(plan.substitutions)}
    </div>
  `;
}
