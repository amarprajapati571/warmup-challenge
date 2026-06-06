# CookDay Planner

A responsive single-page cooking planner micro-app for the warmup challenge.

## Chosen vertical

Food and daily-life productivity: CookDay Planner is a practical cooking assistant for people who need meals, prep tasks, substitutions, and grocery planning that match the shape of their day.

## Approach and logic

The app uses the user's context to make decisions about meal complexity, prep flow, budget pressure, pantry reuse, and substitutions. It collects day type, available cooking time, meals needed, dietary preference, allergies, pantry ingredients, budget, servings, and cuisine mood.

It returns:

- Personalized breakfast, lunch, and/or dinner ideas
- A cooking to-do list based on time and meal flow
- A grouped grocery list with pantry-aware shopping totals
- Budget status with saving suggestions
- Substitutions for cost, dietary conflicts, allergy conflicts, availability, and pantry swaps

AI generation is requested through `/api/generate-cooking-plan` when a backend is configured. The model is asked for JSON only, and every response is validated and normalized before rendering. If the backend is unavailable, invalid, or not configured, the browser uses a deterministic mock planner with the same shape so the solution remains usable.

## Project flow

1. `src/components/DayInputForm.js` collects and validates user context.
2. `src/services/generateCookingPlan.js` builds the AI prompt, calls the backend, validates the response, and falls back safely when needed.
3. `src/utils/groceryList.js` merges ingredients, marks pantry items, groups groceries, and calculates shopping total.
4. `src/utils/substitutions.js` adds practical rule-based swaps.
5. `src/components/*` renders accessible result panels for meals, budget, tasks, groceries, and substitutions.

## Running locally

Open `index.html` directly in a browser, or run a local server:

```sh
npm run dev
```

Then visit `http://localhost:8000`.

AI generation is called through `/api/generate-cooking-plan` when a backend is available. Keep provider keys server-side only:

```sh
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

When the backend is unavailable, the browser uses a safe mock fallback with the same validated JSON shape.

## Testing

Run syntax checks and logic tests:

```sh
npm run check
npm test
```

The tests cover budget calculation, form validation, fallback plan generation, grocery cleaning, substitution tagging, and AI-response normalization.

## Assumptions

- Prices are estimates and use USD for a compact challenge demo.
- The mock fallback is deterministic so the project works without an API key.
- The repository is dependency-free to stay small and easy to review.
- AI output is treated as untrusted data and must pass validation before display.
