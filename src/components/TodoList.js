import { escapeHtml } from "../utils/escapeHtml.js";

export function TodoList(todos, completedTaskIds = new Set()) {
  const completedCount = todos.filter((todo, index) => completedTaskIds.has(getTodoId(todo, index))).length;

  return `
    <section class="result-card" aria-labelledby="todo-list-title">
      <div class="section-heading todo-heading">
        <div>
          <p class="eyebrow">Kitchen flow</p>
          <h3 id="todo-list-title">Cooking to-do list</h3>
        </div>
        <p id="todo-progress" class="todo-progress" aria-live="polite">
          ${completedCount} of ${todos.length} tasks completed
        </p>
      </div>
      <ul class="todo-list">
        ${todos
          .map((todo, index) => {
            const todoId = getTodoId(todo, index);
            const isChecked = completedTaskIds.has(todoId);

            return `
              <li class="todo-item${isChecked ? " is-complete" : ""}">
                <input
                  id="${todoId}"
                  class="todo-checkbox"
                  type="checkbox"
                  value="${todoId}"
                  data-todo-checkbox
                  ${isChecked ? "checked" : ""}
                />
                <label for="${todoId}" class="todo-content">
                  <span>${escapeHtml(todo.task)}</span>
                  <small>${escapeHtml(todo.mealType)} · ${escapeHtml(todo.priority)} · ${escapeHtml(todo.estimatedTime)}</small>
                </label>
              </li>
            `;
          })
          .join("")}
      </ul>
    </section>
  `;
}

export function setupTodoList(container, completedTaskIds) {
  const checkboxes = [...container.querySelectorAll("[data-todo-checkbox]")];
  const progress = container.querySelector("#todo-progress");

  const updateProgress = () => {
    const completedCount = checkboxes.filter((checkbox) => checkbox.checked).length;

    if (progress) {
      progress.textContent = `${completedCount} of ${checkboxes.length} tasks completed`;
    }
  };

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const item = checkbox.closest(".todo-item");

      if (checkbox.checked) {
        completedTaskIds.add(checkbox.value);
        item?.classList.add("is-complete");
      } else {
        completedTaskIds.delete(checkbox.value);
        item?.classList.remove("is-complete");
      }

      updateProgress();
    });
  });

  updateProgress();
}

function getTodoId(todo, index) {
  const text = `${todo.task}-${todo.mealType}-${todo.priority}-${todo.estimatedTime}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

  return `todo-${index}-${text || "task"}`;
}
