import { getFormData, DayInputForm, showFormErrors, validatePlannerInput } from "./DayInputForm.js";
import { ErrorMessage } from "./ErrorMessage.js";
import { Header } from "./Header.js";
import { LoadingState } from "./LoadingState.js";
import { MealPlanResult } from "./MealPlanResult.js";
import { setupGroceryList } from "./GroceryList.js";
import { setupSubstitutionList } from "./SubstitutionList.js";
import { setupTodoList } from "./TodoList.js";
import { generateCookingPlan } from "../services/generateCookingPlan.js";

const emptyResult = `
  <section class="empty-state" aria-label="Plan preview">
    <p class="eyebrow">Ready when you are</p>
    <h2>Your cooking plan will appear here</h2>
    <p>Choose the shape of your day, then generate a breakfast, lunch, dinner, grocery, substitution, and budget plan.</p>
  </section>
`;

export function App(root) {
  if (!root) {
    return;
  }

  const completedTaskIds = new Set();
  const checkedGroceryItemIds = new Set();

  root.innerHTML = `
    ${Header()}
    <main class="app-shell">
      <section class="form-panel" aria-labelledby="planner-form-title">
        ${DayInputForm()}
      </section>
      <section class="result-panel" aria-labelledby="planner-results-title" tabindex="-1">
        <div class="result-heading">
          <p class="eyebrow">Generated plan</p>
          <h2 id="planner-results-title">Today's cooking list</h2>
        </div>
        <div id="result-area" aria-live="polite" aria-atomic="false">
          ${emptyResult}
        </div>
      </section>
    </main>
  `;

  const form = root.querySelector("#day-input-form");
  const resultArea = root.querySelector("#result-area");
  const resultPanel = root.querySelector(".result-panel");
  const generateButton = root.querySelector("#generate-button");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (generateButton?.disabled) {
      return;
    }

    const input = getFormData(form);
    const errors = validatePlannerInput(input);

    showFormErrors(form, errors);

    if (errors.length > 0) {
      resultArea.innerHTML = ErrorMessage("Once the highlighted form details are fixed, your plan will generate here.");
      return;
    }

    setGenerateLoading(generateButton, true);
    resultArea.innerHTML = LoadingState();

    try {
      const plan = await generateCookingPlan(input);
      resultArea.innerHTML = MealPlanResult(plan, completedTaskIds, checkedGroceryItemIds);
      setupTodoList(resultArea, completedTaskIds);
      setupGroceryList(resultArea, checkedGroceryItemIds);
      setupSubstitutionList(resultArea);
      resultPanel?.focus({ preventScroll: false });
    } catch (error) {
      resultArea.innerHTML = ErrorMessage("Something went wrong while generating your plan. Please try again.");
    } finally {
      setGenerateLoading(generateButton, false);
    }
  });
}

function setGenerateLoading(button, isLoading) {
  if (!button) {
    return;
  }

  button.disabled = isLoading;
  button.setAttribute("aria-busy", String(isLoading));
  button.textContent = isLoading ? "Generating..." : "Generate Plan";
}
