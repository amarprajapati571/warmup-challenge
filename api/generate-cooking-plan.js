import { buildCookingPlanPrompt, validateCookingPlan } from "../src/services/generateCookingPlan.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    response.status(503).json({ error: "AI backend is not configured." });
    return;
  }

  const { userInput } = request.body || {};

  if (!userInput) {
    response.status(400).json({ error: "Missing user input." });
    return;
  }

  let aiResponse;

  try {
    aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: buildCookingPlanPrompt(userInput),
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });
  } catch {
    response.status(502).json({ error: "AI provider request failed." });
    return;
  }

  if (!aiResponse.ok) {
    response.status(502).json({ error: "AI provider request failed." });
    return;
  }

  const payload = await aiResponse.json();
  const rawText = payload.output_text || payload.output?.[0]?.content?.[0]?.text || "";
  let candidatePlan;

  try {
    candidatePlan = JSON.parse(rawText);
  } catch {
    response.status(422).json({ error: "AI returned non-JSON content." });
    return;
  }

  // Model output is untrusted data, so validate and normalize it before any UI renders it.
  const validation = validateCookingPlan(candidatePlan, userInput);

  if (!validation.valid) {
    response.status(422).json({ error: "AI returned invalid plan JSON.", details: validation.errors });
    return;
  }

  response.status(200).json(validation.plan);
}
