const STORAGE_KEY = 'todos';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const counter = document.getElementById('counter');
const emptyHint = document.getElementById('empty');
const dateEl = document.getElementById('current-date');
const filterBtns = document.querySelectorAll('.filter-btn');
const toastContainer = document.getElementById('toast-container');

// Элементы кастомного календаря
const dateBtn = document.getElementById('date-btn');
const dateBtnText = document.getElementById('date-btn-text');
const customCalendar = document.getElementById('custom-calendar');
const calMonthYear = document.getElementById('cal-month-year');
const calDays = document.getElementById('cal-days');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const quickTodayBtn = document.getElementById('quick-today');
const quickTomorrowBtn = document.getElementById('quick-tomorrow');
const calApply = document.getElementById('cal-apply');
const calHours = document.getElementById('cal-hours');
const calMinutes = document.getElementById('cal-minutes');

let todos = load();
let currentFilter = 'all';
let notifiedIds = new Set();

// Состояние календаря
let currentDate = new Date();
let selectedDate = null;

const today = new Date();
dateEl.textContent = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });

// --- Логика Календаря ---
function renderCalendar() {
  calDays.innerHTML = '';
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  calMonthYear.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let startDay = firstDay === 0 ? 6 : firstDay - 1;

  // Пустые ячейки в начале
  for (let i = 0; i < startDay; i++) {
    const emptyDiv = document.createElement('div');
    calDays.appendChild(emptyDiv);
  }

  // Дни месяца
  for (let i = 1; i <= daysInMonth; i++) {
    const dayBtn = document.createElement('button');
    dayBtn.type = 'button';
    dayBtn.className = 'cal-day';
    dayBtn.textContent = i;

    const thisDate = new Date(year, month, i);
    const todayDate = new Date();

    if (thisDate.toDateString() === todayDate.toDateString()) {
      dayBtn.classList.add('today');
    }

    if (selectedDate && thisDate.toDateString() === selectedDate.toDateString()) {
      dayBtn.classList.add('selected');
    }

    dayBtn.addEventListener('click', () => {
      selectedDate = thisDate;
      renderCalendar();
    });

    calDays.appendChild(dayBtn);
  }
}

// Открытие/закрытие календаря
dateBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  customCalendar.classList.toggle('hidden');
  dateBtn.classList.toggle('active');
  if (!customCalendar.classList.contains('hidden')) {
    renderCalendar();
  }
});

// Закрытие при клике вне календаря
document.addEventListener('click', (e) => {
  if (!document.getElementById('date-picker-wrapper').contains(e.target)) {
    customCalendar.classList.add('hidden');
    dateBtn.classList.remove('active');
  }
});

prevMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

quickTodayBtn.addEventListener('click', () => {
  selectedDate = new Date();
  renderCalendar();
});

quickTomorrowBtn.addEventListener('click', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  selectedDate = tomorrow;
  renderCalendar();
});

// Применение даты
calApply.addEventListener('click', () => {
  if (!selectedDate) {
    showToast("Выберите дату в календаре", "⚠️");
    return;
  }

  const hours = String(calHours.value).padStart(2, '0');
  const minutes = String(calMinutes.value).padStart(2, '0');

  const finalDate = new Date(selectedDate);
  finalDate.setHours(parseInt(hours), parseInt(minutes), 0);

  dateBtnText.textContent = formatDate(finalDate.toISOString());
  dateBtn.classList.add('has-date');
  customCalendar.classList.add('hidden');
  dateBtn.classList.remove('active');

  dateBtn.dataset.date = finalDate.toISOString();
});

function resetDatePicker() {
  dateBtnText.textContent = 'Когда?';
  dateBtn.classList.remove('has-date');
  delete dateBtn.dataset.date;
  selectedDate = null;
}

// --- Основной код ---
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
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

function showToast(message, icon = '🔔') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 4000);
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
    banner.innerHTML = `<span>Разрешить браузеру присылать напоминания?</span><button id="allow-notifications">Разрешить</button>`;
    document.querySelector('.app').insertBefore(banner, document.querySelector('.todo-form'));
    document.getElementById('allow-notifications').addEventListener('click', () => {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") showToast("Уведомления включены.", "✅");
        banner.classList.add('hidden');
      });
    });
  }
}

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

  if (date) showToast(`Напоминание установлено на ${formatDate(date)}`, "⏰");
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

form.addEventListener('submit', e => {
  e.preventDefault();
  const dateVal = dateBtn.dataset.date || null;
  addTodo(input.value, dateVal);
  input.value = '';
  resetDatePicker();
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

renderCalendar();
render();
askNotificationPermission();
setInterval(checkReminders, 10000);
setInterval(render, 60000);