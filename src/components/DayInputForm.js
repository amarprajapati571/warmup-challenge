import { sanitizePlannerInput, validatePlannerInputData } from "../utils/userInput.js";

export function DayInputForm() {
  return `
    <form id="day-input-form" class="day-form" novalidate>
      <div class="form-heading">
        <p class="eyebrow">Your day</p>
        <h2 id="planner-form-title">Plan inputs</h2>
        <p>Tell CookDay what your day looks like so the plan can match your time, meals, pantry, and budget.</p>
      </div>

      <div id="form-errors" class="form-errors" role="alert" aria-live="assertive" tabindex="-1" hidden></div>

      <div class="form-grid">
        <div class="field">
          <label for="day-type">Day type</label>
          <select id="day-type" name="dayType">
            <option value="busy-workday">Busy workday</option>
            <option value="relaxed">Relaxed day</option>
            <option value="workout">Workout day</option>
            <option value="study">Study day</option>
            <option value="travel">Travel day</option>
            <option value="family">Family day</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div class="field">
          <label for="custom-day-type">Custom day details</label>
          <input
            id="custom-day-type"
            name="customDayType"
            type="text"
            maxlength="80"
            placeholder="Late shift, errands, date night"
          />
          <p class="field-hint">Optional. Use this when your day does not fit the list.</p>
        </div>

        <div class="field">
          <label for="cooking-time">Available cooking time</label>
          <select id="cooking-time" name="availableCookingTime">
            <option value="10">Under 15 minutes</option>
            <option value="25" selected>15-30 minutes</option>
            <option value="45">30-60 minutes</option>
            <option value="75">More than 60 minutes</option>
          </select>
        </div>

        <fieldset class="field fieldset">
          <legend>Meals needed</legend>
          <div class="choice-grid">
            <label class="choice">
              <input type="checkbox" name="mealsNeeded" value="breakfast" checked />
              Breakfast
            </label>
            <label class="choice">
              <input type="checkbox" name="mealsNeeded" value="lunch" checked />
              Lunch
            </label>
            <label class="choice">
              <input type="checkbox" name="mealsNeeded" value="dinner" checked />
              Dinner
            </label>
          </div>
        </fieldset>

        <div class="field">
          <label for="diet">Dietary preference</label>
          <select id="diet" name="dietaryPreference">
            <option value="none">None</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="high-protein">High protein</option>
            <option value="low-carb">Low carb</option>
            <option value="gluten-free">Gluten free</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div class="field">
          <label for="custom-diet">Custom dietary preference</label>
          <input
            id="custom-diet"
            name="customDietaryPreference"
            type="text"
            maxlength="80"
            placeholder="Low sodium, Jain, halal"
          />
          <p class="field-hint">Optional. Use this for a custom diet or food rule.</p>
        </div>

        <div class="field">
          <label for="allergies">Allergies or restrictions</label>
          <input
            id="allergies"
            name="allergies"
            type="text"
            maxlength="140"
            placeholder="Peanuts, dairy, shellfish"
          />
        </div>

        <div class="field">
          <label for="pantry">Ingredients already available</label>
          <textarea
            id="pantry"
            name="pantry"
            rows="3"
            maxlength="260"
            placeholder="Rice, eggs, spinach, oats"
          ></textarea>
          <p class="field-hint">Separate items with commas.</p>
        </div>

        <div class="field">
          <label for="budget">Budget</label>
          <input id="budget" name="budget" type="number" min="1" step="1" value="35" inputmode="decimal" />
        </div>

        <div class="field">
          <label for="servings">Number of servings</label>
          <input id="servings" name="servings" type="number" min="1" max="12" step="1" value="2" />
        </div>

        <div class="field">
          <label for="cuisine">Cuisine or mood</label>
          <input
            id="cuisine"
            name="cuisineMood"
            type="text"
            maxlength="80"
            value="comfort food"
            placeholder="Indian, Italian, comfort food, healthy, quick, spicy"
          />
        </div>
      </div>

      <button id="generate-button" class="primary-button" type="submit">Generate Plan</button>
    </form>
  `;
}

export function getFormData(form) {
  const formData = new FormData(form);

  return sanitizePlannerInput({
    dayType: formData.get("dayType"),
    customDayType: formData.get("customDayType"),
    availableCookingTime: Number(formData.get("availableCookingTime")),
    mealsNeeded: formData.getAll("mealsNeeded"),
    dietaryPreference: formData.get("dietaryPreference"),
    customDietaryPreference: formData.get("customDietaryPreference"),
    allergies: splitList(formData.get("allergies")),
    pantry: splitList(formData.get("pantry")),
    budget: Number(formData.get("budget")),
    servings: Number(formData.get("servings")),
    cuisineMood: formData.get("cuisineMood"),
  });
}

export function validatePlannerInput(input) {
  return validatePlannerInputData(input);
}

export function showFormErrors(form, errors) {
  const errorContainer = form.querySelector("#form-errors");

  if (!errorContainer) {
    return;
  }

  if (errors.length === 0) {
    errorContainer.hidden = true;
    errorContainer.innerHTML = "";
    return;
  }

  errorContainer.hidden = false;
  errorContainer.innerHTML = `
    <strong>Please fix ${errors.length === 1 ? "this detail" : "these details"}</strong>
    <ul>
      ${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}
    </ul>
  `;
  errorContainer.focus();
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

function escapeHtml(value) {
  const htmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return String(value).replace(/[&<>"']/g, (character) => htmlEntities[character]);
}
