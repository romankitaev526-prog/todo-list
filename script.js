const STORAGE_KEY = 'todos';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const dateInput = document.getElementById('todo-date');
const list = document.getElementById('todo-list');
const counter = document.getElementById('counter');
const emptyHint = document.getElementById('empty');
const dateEl = document.getElementById('current-date');
const filterBtns = document.querySelectorAll('.filter-btn');
const toastContainer = document.getElementById('toast-container');

let todos = load();
let currentFilter = 'all';
let notifiedIds = new Set();

// --- Вспомогательные функции для дат ---
const today = new Date();
dateEl.textContent = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function isOverdue(dateString, isDone) {
  if (!dateString || isDone) return false;
  return new Date(dateString).getTime() < new Date().getTime();
}

// --- Уведомления ---
function showToast(message, icon = '🔔') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function showNativeNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body: body, icon: "https://github.com/favicon.ico" });
  }
}

function checkReminders() {
  const now = new Date().getTime();

  todos.forEach(todo => {
    if (todo.done || !todo.date) return;

    const taskTime = new Date(todo.date).getTime();
    // Если время пришло (с погрешностью в 1 минуту) и мы еще не уведомляли
    if (taskTime <= now && taskTime > now - 60000 && !notifiedIds.has(todo.id)) {
      notifiedIds.add(todo.id);

      const msg = `Пора выполнить: "${todo.text}"`;
      showToast(msg, '⏰');
      showNativeNotification("Напоминание о задаче", msg);
    }
  });
}

function askNotificationPermission() {
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    const banner = document.createElement('div');
    banner.className = 'notify-banner';
    banner.innerHTML = `
      <span>Разрешить браузеру присылать напоминания?</span>
      <button id="allow-notifications">Разрешить</button>
    `;
    document.querySelector('.app').insertBefore(banner, document.querySelector('.todo-form'));

    document.getElementById('allow-notifications').addEventListener('click', () => {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          showToast("Отлично! Уведомления включены.", "✅");
        }
        banner.classList.add('hidden');
      });
    });
  }
}

// --- Основной рендер ---
function render() {
  list.innerHTML = '';

  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.done;
    if (currentFilter === 'done') return todo.done;
    return true;
  });

  if (filteredTodos.length === 0) {
    emptyHint.classList.remove('hidden');
    if (todos.length > 0) {
      if (currentFilter === 'active') emptyHint.textContent = "Все задачи выполнены! 🎉";
      if (currentFilter === 'done') emptyHint.textContent = "Пока нет выполненных задач.";
    } else {
      emptyHint.textContent = "Задач пока нет — добавьте первую 👆";
    }
  } else {
    emptyHint.classList.add('hidden');
  }

  filteredTodos.forEach(todo => {
    const li = document.createElement('li');
    const overdue = isOverdue(todo.date, todo.done);

    li.className = 'todo-item' + (todo.done ? ' done' : '') + (overdue ? ' overdue' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const contentDiv = document.createElement('div');
    contentDiv.className = 'todo-content';

    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = todo.text;
    contentDiv.appendChild(span);

    if (todo.date) {
      const dateBadge = document.createElement('span');
      dateBadge.className = 'todo-date-badge';
      dateBadge.innerHTML = `⏰ ${formatDate(todo.date)}`;
      contentDiv.appendChild(dateBadge);
    }

    const del = document.createElement('button');
    del.className = 'delete';
    del.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    del.addEventListener('click', () => deleteTodo(todo.id, li));

    li.append(checkbox, contentDiv, del);
    list.appendChild(li);
  });

  const doneCount = todos.filter(t => t.done).length;
  counter.textContent = `${doneCount} из ${todos.length} выполнено`;
}

function addTodo(text, date) {
  const trimmed = text.trim();
  if (!trimmed) return;

  todos.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text: trimmed,
    date: date || null,
    done: false
  });

  save();
  render();

  if (date) {
    showToast(`Напоминание установлено на ${formatDate(date)}`, "⏰");
  }
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  todo.done = !todo.done;
  save();
  setTimeout(render, 150);
}

function deleteTodo(id, element) {
  element.classList.add('removing');
  setTimeout(() => {
    todos = todos.filter(t => t.id !== id);
    save();
    render();
  }, 250);
}

// --- События ---
form.addEventListener('submit', e => {
  e.preventDefault();
  addTodo(input.value, dateInput.value);
  input.value = '';
  dateInput.value = '';
  input.focus();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

// --- Запуск ---
render();
askNotificationPermission();

// Проверка напоминаний каждые 10 секунд
setInterval(checkReminders, 10000);
// Обновление интерфейса (просроченные) каждую минуту
setInterval(render, 60000);