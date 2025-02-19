// Task Management
class TaskManager {
  constructor() {
    this.tasks = [];
    this.loadTasks();
    this.setupEventListeners();
    this.currentEditingId = null;
  }

  // Generate unique ID for tasks
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Load tasks from localStorage
  loadTasks() {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
      this.tasks = JSON.parse(savedTasks);
    }
    this.renderTasks();
  }

  // Save tasks to localStorage
  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  // Add new task (with priority)
  addTask(title, date, priority) {
    const task = {
      id: this.generateId(),
      title: title,
      date: date,
      status: false,
      priority: priority
    };
    this.tasks.push(task);
    this.saveTasks();
    this.renderTasks();
    this.showNotification("Task added successfully");
  }

  // Delete task
  deleteTask(id) {
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (taskElement) {
      taskElement.classList.add("deleting");
      setTimeout(() => {
        this.tasks = this.tasks.filter((task) => task.id !== id);
        this.saveTasks();
        this.renderTasks();
      }, 300);
    }
    this.showNotification("Task deleted");
  }

  // Edit task (updates title, date, and priority)
  editTask(id, title, date, priority) {
    const taskIndex = this.tasks.findIndex((task) => task.id === id);
    if (taskIndex !== -1) {
      this.tasks[taskIndex].title = title;
      this.tasks[taskIndex].date = date;
      this.tasks[taskIndex].priority = priority;
      this.saveTasks();
      this.renderTasks();
      this.showNotification("Task updated successfully");
    }
  }

  // Toggle task completion
  toggleTaskComplete(id) {
    const task = this.tasks.find((task) => task.id === id);
    if (task) {
      task.status = !task.status;
      this.saveTasks();
      this.renderTasks();
      this.showNotification(task.status ? "Task completed" : "Task reopened");
    }
  }

  // Format date for display
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Filter and sort tasks
  getFilteredAndSortedTasks() {
    const filterType = document
      .querySelector(".filter-btn.active")
      .id.replace("filter-", "");
    const sortBy = document.getElementById("sort-by").value;

    let filteredTasks = [...this.tasks];

    // Apply filter
    if (filterType === "completed") {
      filteredTasks = filteredTasks.filter((task) => task.status);
    } else if (filterType === "incomplete") {
      filteredTasks = filteredTasks.filter((task) => !task.status);
    }

    // Apply sort if not custom
    if (sortBy === "date") {
      filteredTasks.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === "title") {
      filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
    }
    // If sortBy is "custom", leave tasks in the order stored

    return filteredTasks;
  }

  // Render tasks to DOM with improved drag-and-drop support
  renderTasks() {
    const tasksContainer = document.getElementById("tasks");
    const filteredTasks = this.getFilteredAndSortedTasks();
    tasksContainer.innerHTML = "";
    const sortBy = document.getElementById("sort-by").value;

    filteredTasks.forEach((task) => {
      const taskElement = document.createElement("div");
      taskElement.className = `task${task.status ? " done" : ""}`;
      taskElement.setAttribute("data-task-id", task.id);

      // Always show the drag handle icon
      const dragHandleHTML = `<span class="material-symbols-outlined drag-handle">drag_indicator</span>`;

      // Enable drag only in "Custom Order" mode
      if (sortBy === "custom") {
        taskElement.setAttribute("draggable", true);
        taskElement.addEventListener("dragstart", (e) => {
          e.dataTransfer.effectAllowed = "move";
          taskElement.classList.add("dragging");
        });
        taskElement.addEventListener("dragend", () => {
          taskElement.classList.remove("dragging");
          this.updateTasksOrderFromDOM();
        });
      }

      taskElement.innerHTML = `
        <div class="task-info">
          ${dragHandleHTML}
          <h3>
            ${task.title} 
            <span class="task-priority ${task.priority}">
              ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          </h3>
          <div class="task-date">
            <span class="material-symbols-outlined" aria-hidden="true">calendar_month</span>
            <span>${this.formatDate(task.date)}</span>
          </div>
        </div>
        <div class="actions">
          <button class="delete" aria-label="Delete task">
            <span class="material-symbols-outlined" aria-hidden="true">delete</span>
          </button>
          <button class="edit" aria-label="Edit task">
            <span class="material-symbols-outlined" aria-hidden="true">edit</span>
          </button>
          <button class="complete" aria-label="${task.status ? "Mark as incomplete" : "Mark as complete"}">
            <span class="material-symbols-outlined" aria-hidden="true">check</span>
          </button>
        </div>
      `;
      tasksContainer.appendChild(taskElement);
    });
  }

  // Update tasks array order based on the current DOM order
  updateTasksOrderFromDOM() {
    const tasksContainer = document.getElementById("tasks");
    const newOrder = [];
    tasksContainer.querySelectorAll(".task").forEach((taskEl) => {
      const id = taskEl.getAttribute("data-task-id");
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        newOrder.push(task);
      }
    });
    this.tasks = newOrder;
    this.saveTasks();
  }

  // Compute the element after which the dragged element should be placed
  getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".task:not(.dragging)")
    ];
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    draggableElements.forEach((child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        closest = { offset: offset, element: child };
      }
    });
    return closest.element;
  }

  // Show notification
  showNotification(message, isError = false) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.className = `notification${isError ? " error" : ""} show`;
    setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  }

  // Modal management
  openModal(id = null) {
    const modal = document.getElementById("task-modal");
    const titleInput = document.getElementById("task-title");
    const dateInput = document.getElementById("task-date");
    const prioritySelect = document.getElementById("task-priority");

    if (id) {
      const task = this.tasks.find((task) => task.id === id);
      if (task) {
        this.currentEditingId = id;
        titleInput.value = task.title;
        dateInput.value = task.date.slice(0, 16); // Format for datetime-local input
        prioritySelect.value = task.priority;
        modal.querySelector("h2").textContent = "Edit Task";
      }
    } else {
      this.currentEditingId = null;
      titleInput.value = "";
      dateInput.value = "";
      prioritySelect.value = "medium";
      modal.querySelector("h2").textContent = "Add New Task";
    }
    modal.classList.add("active");
    titleInput.focus();
  }

  closeModal() {
    const modal = document.getElementById("task-modal");
    modal.classList.remove("active");
    this.currentEditingId = null;
  }

  // Setup event listeners
  setupEventListeners() {
    document.getElementById("add-btn").addEventListener("click", () =>
      this.openModal()
    );

    document.querySelectorAll(".filter-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        document.querySelectorAll(".filter-btn").forEach((btn) => {
          btn.classList.remove("active");
          btn.setAttribute("aria-pressed", "false");
        });
        e.target.classList.add("active");
        e.target.setAttribute("aria-pressed", "true");
        this.renderTasks();
      });
    });

    document.getElementById("sort-by").addEventListener("change", () =>
      this.renderTasks()
    );

    document.getElementById("task-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const titleInput = document.getElementById("task-title");
      const dateInput = document.getElementById("task-date");
      const prioritySelect = document.getElementById("task-priority");
      if (this.currentEditingId) {
        this.editTask(
          this.currentEditingId,
          titleInput.value,
          dateInput.value,
          prioritySelect.value
        );
      } else {
        this.addTask(
          titleInput.value,
          dateInput.value,
          prioritySelect.value
        );
      }
      this.closeModal();
    });

    document.getElementById("cancel-task").addEventListener("click", () =>
      this.closeModal()
    );

    document.getElementById("tasks").addEventListener("click", (e) => {
      const taskElement = e.target.closest(".task");
      if (!taskElement) return;
      const taskId = taskElement.getAttribute("data-task-id");
      const button = e.target.closest("button");
      if (button) {
        if (button.classList.contains("delete")) {
          if (confirm("Are you sure you want to delete this task?")) {
            this.deleteTask(taskId);
          }
        } else if (button.classList.contains("edit")) {
          this.openModal(taskId);
        } else if (button.classList.contains("complete")) {
          this.toggleTaskComplete(taskId);
        }
      }
    });

    // Container-level dragover event for smoother reordering
const tasksContainer = document.getElementById("tasks");
tasksContainer.addEventListener("dragover", (e) => {
  const sortBy = document.getElementById("sort-by").value;
  if (sortBy !== "custom") return;
  e.preventDefault();
  const draggingElem = document.querySelector(".dragging");
  if (!draggingElem) return;
  const afterElement = this.getDragAfterElement(tasksContainer, e.clientY);
  // Only reposition if the element's current next sibling isn't already correct.
  if (afterElement == null) {
    if (draggingElem.nextElementSibling) {
      tasksContainer.appendChild(draggingElem);
    }
  } else {
    if (draggingElem.nextElementSibling !== afterElement) {
      tasksContainer.insertBefore(draggingElem, afterElement);
    }
  }
});


    document.getElementById("task-modal").addEventListener("click", (e) => {
      if (e.target.id === "task-modal") {
        this.closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const taskManager = new TaskManager();
});
