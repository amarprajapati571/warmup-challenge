export function LoadingState() {
  return `
    <div class="loading-state" role="status" aria-live="polite" aria-atomic="true">
      <span class="loader" aria-hidden="true"></span>
      <p>Generating your cooking plan...</p>
    </div>
  `;
}
