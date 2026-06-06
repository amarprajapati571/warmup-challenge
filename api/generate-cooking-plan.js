import { buildCookingPlanPrompt, validateCookingPlan } from "../src/services/generateCookingPlan.js";
import { sanitizePlannerInput, validatePlannerInputData } from "../src/utils/userInput.js";

const aiTimeoutMs = 15000;

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

  const safeInput = sanitizePlannerInput(userInput);
  const inputErrors = validatePlannerInputData(safeInput);

  if (inputErrors.length > 0) {
    response.status(400).json({ error: "Invalid user input.", details: inputErrors });
    return;
  }

  let aiResponse;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), aiTimeoutMs);
    aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: buildCookingPlanPrompt(safeInput),
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error) {
    response.status(error?.name === "AbortError" ? 504 : 502).json({
      error: error?.name === "AbortError" ? "AI provider request timed out." : "AI provider request failed.",
    });
    return;
  }

  if (!aiResponse.ok) {
    response.status(502).json({ error: "AI provider request failed." });
    return;
  }

  let payload;

  try {
    payload = await aiResponse.json();
  } catch {
    response.status(502).json({ error: "AI provider returned malformed JSON." });
    return;
  }

  const rawText = payload.output_text || payload.output?.[0]?.content?.[0]?.text || "";

  if (!rawText.trim()) {
    response.status(422).json({ error: "AI returned an empty response." });
    return;
  }

  let candidatePlan;

  try {
    candidatePlan = JSON.parse(rawText);
  } catch {
    response.status(422).json({ error: "AI returned non-JSON content." });
    return;
  }

  // Model output is untrusted data, so validate and normalize it before any UI renders it.
  const validation = validateCookingPlan(candidatePlan, safeInput);

  if (!validation.valid) {
    response.status(422).json({ error: "AI returned invalid plan JSON.", details: validation.errors });
    return;
  }

  response.status(200).json(validation.plan);
}
