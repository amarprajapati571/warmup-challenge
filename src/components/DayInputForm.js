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
          <select id="day-type" name="dayType" aria-describedby="day-type-error">
            <option value="busy-workday">Busy workday</option>
            <option value="relaxed">Relaxed day</option>
            <option value="workout">Workout day</option>
            <option value="study">Study day</option>
            <option value="travel">Travel day</option>
            <option value="family">Family day</option>
            <option value="custom">Custom</option>
          </select>
          <p id="day-type-error" class="field-error" data-error-for="dayType" aria-live="polite"></p>
        </div>

        <div class="field">
          <label for="custom-day-type">Custom day details</label>
          <input
            id="custom-day-type"
            name="customDayType"
            type="text"
            maxlength="80"
            placeholder="Late shift, errands, date night"
            aria-describedby="custom-day-type-hint custom-day-type-error"
          />
          <p id="custom-day-type-hint" class="field-hint">Optional. Use this when your day does not fit the list.</p>
          <p id="custom-day-type-error" class="field-error" data-error-for="customDayType" aria-live="polite"></p>
        </div>

        <div class="field">
          <label for="cooking-time">Available cooking time</label>
          <select id="cooking-time" name="availableCookingTime" aria-describedby="cooking-time-error">
            <option value="10">Under 15 minutes</option>
            <option value="25" selected>15-30 minutes</option>
            <option value="45">30-60 minutes</option>
            <option value="75">More than 60 minutes</option>
          </select>
          <p id="cooking-time-error" class="field-error" data-error-for="availableCookingTime" aria-live="polite"></p>
        </div>

        <fieldset class="field fieldset" aria-describedby="meals-needed-error">
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
          <p id="meals-needed-error" class="field-error" data-error-for="mealsNeeded" aria-live="polite"></p>
        </fieldset>

        <div class="field">
          <label for="diet">Dietary preference</label>
          <select id="diet" name="dietaryPreference" aria-describedby="diet-error">
            <option value="none">None</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="high-protein">High protein</option>
            <option value="low-carb">Low carb</option>
            <option value="gluten-free">Gluten free</option>
            <option value="custom">Custom</option>
          </select>
          <p id="diet-error" class="field-error" data-error-for="dietaryPreference" aria-live="polite"></p>
        </div>

        <div class="field">
          <label for="custom-diet">Custom dietary preference</label>
          <input
            id="custom-diet"
            name="customDietaryPreference"
            type="text"
            maxlength="80"
            placeholder="Low sodium, Jain, halal"
            aria-describedby="custom-diet-hint custom-diet-error"
          />
          <p id="custom-diet-hint" class="field-hint">Optional. Use this for a custom diet or food rule.</p>
          <p id="custom-diet-error" class="field-error" data-error-for="customDietaryPreference" aria-live="polite"></p>
        </div>

        <div class="field">
          <label for="allergies">Allergies or restrictions</label>
          <input
            id="allergies"
            name="allergies"
            type="text"
            maxlength="140"
            placeholder="Peanuts, dairy, shellfish"
            aria-describedby="allergies-error"
          />
          <p id="allergies-error" class="field-error" data-error-for="allergies" aria-live="polite"></p>
        </div>

        <div class="field">
          <label for="pantry">Ingredients already available</label>
          <textarea
            id="pantry"
            name="pantry"
            rows="3"
            maxlength="260"
            placeholder="Rice, eggs, spinach, oats"
            aria-describedby="pantry-hint pantry-error"
          ></textarea>
          <p id="pantry-hint" class="field-hint">Separate items with commas.</p>
          <p id="pantry-error" class="field-error" data-error-for="pantry" aria-live="polite"></p>
        </div>

        <div class="field">
          <label for="budget">Budget</label>
          <input id="budget" name="budget" type="number" min="1" step="1" value="35" inputmode="decimal" aria-describedby="budget-error" />
          <p id="budget-error" class="field-error" data-error-for="budget" aria-live="polite"></p>
        </div>

        <div class="field">
          <label for="servings">Number of servings</label>
          <input id="servings" name="servings" type="number" min="1" max="12" step="1" value="2" aria-describedby="servings-error" />
          <p id="servings-error" class="field-error" data-error-for="servings" aria-live="polite"></p>
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
            aria-describedby="cuisine-error"
          />
          <p id="cuisine-error" class="field-error" data-error-for="cuisineMood" aria-live="polite"></p>
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

  clearFieldErrors(form);

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
  showFieldErrors(form, errors);
  errorContainer.focus();
}

function clearFieldErrors(form) {
  form.querySelectorAll("[aria-invalid='true']").forEach((element) => {
    element.removeAttribute("aria-invalid");
  });

  form.querySelectorAll("[data-error-for]").forEach((element) => {
    element.textContent = "";
  });
}

function showFieldErrors(form, errors) {
  const fieldErrors = mapErrorsToFields(errors);

  Object.entries(fieldErrors).forEach(([fieldName, message]) => {
    const errorElement = form.querySelector(`[data-error-for="${fieldName}"]`);

    if (errorElement) {
      errorElement.textContent = message;
    }

    if (fieldName === "mealsNeeded") {
      form.querySelectorAll('[name="mealsNeeded"]').forEach((input) => {
        input.setAttribute("aria-invalid", "true");
      });
      return;
    }

    const input = form.querySelector(`[name="${fieldName}"]`);

    if (input) {
      input.setAttribute("aria-invalid", "true");
    }
  });
}

function mapErrorsToFields(errors) {
  const fieldErrors = {};

  errors.forEach((error) => {
    if (error.includes("custom day")) {
      fieldErrors.customDayType = error;
    } else if (error.includes("day type")) {
      fieldErrors.dayType = error;
    } else if (error.includes("cooking time")) {
      fieldErrors.availableCookingTime = error;
    } else if (error.includes("meal")) {
      fieldErrors.mealsNeeded = error;
    } else if (error.includes("custom dietary preference")) {
      fieldErrors.customDietaryPreference = error;
    } else if (error.includes("dietary")) {
      fieldErrors.dietaryPreference = error;
    } else if (error.includes("budget")) {
      fieldErrors.budget = error;
    } else if (error.includes("serving")) {
      fieldErrors.servings = error;
    } else if (error.includes("allergies")) {
      fieldErrors.allergies = error;
    } else if (error.includes("ingredients")) {
      fieldErrors.pantry = error;
    } else if (error.includes("cuisine")) {
      fieldErrors.cuisineMood = error;
    }
  });

  return fieldErrors;
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
