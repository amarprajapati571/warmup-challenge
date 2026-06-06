import { escapeHtml } from "../utils/escapeHtml.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { buildGroceryCopyText } from "../utils/groceryList.js";

export function GroceryList(groups, totalCost = 0, checkedGroceryItemIds = new Set()) {
  const safeGroups = normalizeGroups(groups);
  const safeTotalCost = Number(totalCost) || 0;
  const copyText = buildGroceryCopyText(safeGroups, formatCurrency(safeTotalCost));

  return `
    <section class="result-card" aria-labelledby="grocery-list-title">
      <div class="section-heading grocery-heading">
        <div>
          <p class="eyebrow">Shopping</p>
          <h3 id="grocery-list-title">Grocery list</h3>
          <p>Estimated shopping total: <strong>${formatCurrency(safeTotalCost)}</strong></p>
        </div>
        <button class="secondary-button" type="button" data-copy-grocery-list>Copy grocery list</button>
      </div>
      <textarea class="copy-buffer" data-grocery-copy-text tabindex="-1" readonly>${escapeHtml(copyText)}</textarea>
      <p class="copy-status" data-copy-status aria-live="polite"></p>
      <div class="grocery-grid">
        ${safeGroups
          .map(
            (group) => `
              <div class="grocery-group">
                <h4>${escapeHtml(group.category)}</h4>
                <ul class="grocery-items">
                  ${group.items
                    .map((item, index) => {
                      const itemId = getGroceryItemId(group.category, item, index);
                      const isChecked = checkedGroceryItemIds.has(itemId);

                      return `
                        <li class="grocery-item${isChecked ? " is-complete" : ""}${item.alreadyAvailable ? " is-available" : ""}">
                          <input
                            id="${itemId}"
                            class="grocery-checkbox"
                            type="checkbox"
                            value="${itemId}"
                            data-grocery-checkbox
                            ${isChecked ? "checked" : ""}
                          />
                          <label for="${itemId}" class="grocery-content">
                            <span>${escapeHtml(item.name)}</span>
                            <small>
                              ${escapeHtml(item.quantity)} · ${formatCurrency(item.estimatedCost)}
                              ${item.alreadyAvailable ? " · Already at home" : ""}
                            </small>
                          </label>
                        </li>
                      `;
                    })
                    .join("")}
                </ul>
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function normalizeGroups(groups) {
  if (!Array.isArray(groups)) {
    return [];
  }

  return groups
    .filter((group) => group && Array.isArray(group.items))
    .map((group) => ({
      category: String(group.category || "Other"),
      items: group.items
        .filter((item) => item && item.name)
        .map((item) => ({
          name: String(item.name || "Unknown item"),
          quantity: String(item.quantity || "as needed"),
          estimatedCost: Number(item.estimatedCost) || 0,
          alreadyAvailable: Boolean(item.alreadyAvailable),
        })),
    }))
    .filter((group) => group.items.length > 0);
}

export function setupGroceryList(container, checkedGroceryItemIds) {
  const checkboxes = [...container.querySelectorAll("[data-grocery-checkbox]")];
  const copyButton = container.querySelector("[data-copy-grocery-list]");
  const copyTextArea = container.querySelector("[data-grocery-copy-text]");
  const copyStatus = container.querySelector("[data-copy-status]");

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const item = checkbox.closest(".grocery-item");

      if (checkbox.checked) {
        checkedGroceryItemIds.add(checkbox.value);
        item?.classList.add("is-complete");
      } else {
        checkedGroceryItemIds.delete(checkbox.value);
        item?.classList.remove("is-complete");
      }
    });
  });

  copyButton?.addEventListener("click", async () => {
    const text = copyTextArea?.value || "";

    try {
      await copyToClipboard(text, copyTextArea);

      if (copyStatus) {
        copyStatus.textContent = "Grocery list copied.";
      }
    } catch {
      if (copyStatus) {
        copyStatus.textContent = "Could not copy automatically. Select the list text and copy it manually.";
      }
    }
  });
}

async function copyToClipboard(text, fallbackTextArea) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  fallbackTextArea?.removeAttribute("readonly");
  fallbackTextArea?.select();
  document.execCommand("copy");
  fallbackTextArea?.setAttribute("readonly", "");
}

function getGroceryItemId(category, item, index) {
  const text = `${category}-${item.name}-${item.quantity}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

  return `grocery-${index}-${text || "item"}`;
}
