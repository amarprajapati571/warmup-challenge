import { escapeHtml } from "../utils/escapeHtml.js";

export function ErrorMessage(message) {
  return `
    <div class="error-message" role="alert">
      <strong>Plan needs one more detail</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}
