# CookDay Planner

CookDay Planner is a responsive AI micro-app that helps a user turn the shape of their day into a practical cooking plan. It generates meal ideas, a cooking to-do checklist, a grouped grocery list, substitutions, and budget feasibility.

## Features

- Breakfast, lunch, and dinner planning based on selected meals
- Personal cooking to-do list with checkboxes, priorities, meal types, and time estimates
- Grocery list grouped by Produce, Dairy, Protein, Grains, Spices, Pantry, and Other
- Pantry-aware grocery cleanup that combines duplicates and marks items already at home
- Budget feasibility logic calculated in code, not only AI text
- Substitutions for budget, dietary preferences, allergies, availability, and pantry swaps
- Safe mock fallback when the AI API is unavailable
- Accessible form labels, live regions, keyboard-friendly controls, and focused results

## Setup

This project is dependency-free. The default dev server runs the static app and the local API route, so GPT generation can work with a server-side key.

```sh
npm run dev
```

Open:

```text
http://localhost:8000
```

You can also open `index.html` directly in a browser.

## Environment Variables

AI generation is called through `/api/generate-cooking-plan` when a backend is available. Keep GPT keys server-side only. For local development, add a `.env` file using `.env.example` as the template:

```sh
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

The app also supports these aliases:

```sh
GPT_API_KEY=your_key_here
GPT_MODEL=gpt-4.1-mini
```

Use `OPENAI_API_KEY` for deployment platforms such as Vercel. Do not place the key in `index.html`, frontend JavaScript, or any committed file.

If the backend is missing, unconfigured, slow, or returns invalid JSON, the app automatically uses the deterministic mock planner.

## Testing

```sh
npm run check
npm test
```

Tests cover:

- Budget status calculation
- Grocery aggregation and pantry handling
- Input validation
- AI response validation
- Fallback plan generation

## Demo Scenario

Try this sample input:

- Day type: Busy workday
- Meals needed: Breakfast, Lunch, Dinner
- Cooking time: 15-30 minutes
- Dietary preference: Vegetarian
- Allergies/restrictions: peanuts
- Ingredients already available: rice, chickpeas, eggs
- Budget: 25
- Servings: 2
- Cuisine/mood: quick Indian comfort food

Expected demo outcome:

- A simple three-meal plan
- A prioritized cooking checklist with packing and cleanup tasks
- A grocery list that marks rice, chickpeas, and eggs as already available
- Budget status calculated from the cleaned grocery list
- Cheaper swaps such as paneer to tofu/chickpeas and specialty grains to rice

## Security and Reliability Notes

- API keys are never placed in frontend code.
- User input is sanitized and validated before generation.
- AI output is treated as untrusted and must match the expected JSON schema.
- Rendered user and AI text is escaped before display.
- The app does not call AI on keystrokes; it only generates after the user clicks `Generate Plan`.
