const STORAGE_KEY = 'todos';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const counter = document.getElementById('counter');
const emptyHint = document.getElementById('empty');
const dateEl = document.getElementById('current-date');
const filterBtns = document.querySelectorAll('.filter-btn');
const toastContainer = document.getElementById('toast-container');

const dateBtn = document.getElementById('date-btn');
const dateBtnText = document.getElementById('date-btn-text');
const customCalendar = document.getElementById('custom-calendar');
const calMonthYear = document.getElementById('cal-month-year');
const calDays = document.getElementById('cal-days');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const calApply = document.getElementById('cal-apply');
const calHours = document.getElementById('cal-hours');
const calMinutes = document.getElementById('cal-minutes');

let todos = load();
let currentFilter = 'all';
let notifiedIds = new Set();

let currentDate = new Date();
let selectedDate = null;

dateEl.textContent = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });

function renderCalendar() {
  calDays.innerHTML = '';
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  calMonthYear.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startDay = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < startDay; i++) {
    const emptyDiv = document.createElement('div');
    calDays.appendChild(emptyDiv);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dayBtn = document.createElement('button');
    dayBtn.type = 'button';
    dayBtn.className = 'cal-day';
    dayBtn.textContent = i;

    const thisDate = new Date(year, month, i);
    if (thisDate.toDateString() === new Date().toDateString()) dayBtn.classList.add('today');
    if (selectedDate && thisDate.toDateString() === selectedDate.toDateString()) dayBtn.classList.add('selected');

    dayBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectedDate = thisDate;
      renderCalendar();
    });
    calDays.appendChild(dayBtn);
  }
}

dateBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  customCalendar.classList.toggle('hidden');
  dateBtn.classList.toggle('active');
  if (!customCalendar.classList.contains('hidden')) renderCalendar();
});

document.addEventListener('click', (e) => {
  if (!customCalendar.contains(e.target) && !dateBtn.contains(e.target)) {
    customCalendar.classList.add('hidden');
    dateBtn.classList.remove('active');
  }
});

prevMonthBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

calApply.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!selectedDate) {
    showToast("Сначала выберите день", "⚠️");
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
  showToast(`Выбрано: ${formatDate(finalDate.toISOString())}`, "📅");
});

function resetDatePicker() {
  dateBtnText.textContent = 'Когда?';
  dateBtn.classList.remove('has-date');
  delete dateBtn.dataset.date;
  selectedDate = null;
}

function load() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }
function formatDate(dateString) { if (!dateString) return ''; return new Date(dateString).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
function isOverdue(dateString, isDone) { if (!dateString || isDone) return false; return new Date(dateString).getTime() < new Date().getTime(); }

function showToast(message, icon = '🔔') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 4000);
}

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator(); const gain1 = ctx.createGain();
    osc1.type = 'sine'; osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime); gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc1.connect(gain1); gain1.connect(ctx.destination); osc1.start(); osc1.stop(ctx.currentTime + 0.5);
    setTimeout(() => {
      const osc2 = ctx.createOscillator(); const gain2 = ctx.createGain();
      osc2.type = 'sine'; osc2.frequency.setValueAtTime(1174.66, ctx.currentTime);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime); gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc2.connect(gain2); gain2.connect(ctx.destination); osc2.start(); osc2.stop(ctx.currentTime + 0.6);
    }, 150);
  } catch (e) {}
}

function checkReminders() {
  const now = new Date().getTime();
  todos.forEach(todo => {
    if (todo.done || !todo.date) return;
    const taskTime = new Date(todo.date).getTime();
    if (taskTime <= now && taskTime > now - 60000 && !notifiedIds.has(todo.id)) {
      notifiedIds.add(todo.id);
      const msg = `Пора выполнить: "${todo.text}"`;
      playNotificationSound(); showToast(msg, '⏰'); showNativeNotification("Напоминание", msg);
    }
  });
}

function showNativeNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") new Notification(title, { body: body, icon: "https://github.com/favicon.ico" });
}

function askNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    const banner = document.createElement('div');
    banner.className = 'notify-banner';
    banner.innerHTML = `<span>Разрешить уведомления?</span><button id="allow-notifications">Разрешить</button>`;
    document.querySelector('.app').insertBefore(banner, document.querySelector('.todo-form'));
    document.getElementById('allow-notifications').addEventListener('click', () => {
      Notification.requestPermission().then(p => { if (p === "granted") { showToast("Уведомления включены", "✅"); playNotificationSound(); } banner.classList.add('hidden'); });
    });
  }
}

function render() {
  list.innerHTML = '';
  const filtered = todos.filter(todo => currentFilter === 'active' ? !todo.done : currentFilter === 'done' ? todo.done : true);

  if (filtered.length === 0) {
    emptyHint.classList.remove('hidden');
    emptyHint.textContent = todos.length > 0 ? (currentFilter === 'active' ? "Все выполнено! 🎉" : "Пока нет выполненных") : "Задач пока нет — добавьте первую 👆";
  } else emptyHint.classList.add('hidden');

  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '') + (isOverdue(todo.date, todo.done) ? ' overdue' : '');

    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = todo.done; checkbox.addEventListener('change', () => toggleTodo(todo.id));
    const contentDiv = document.createElement('div'); contentDiv.className = 'todo-content';
    const span = document.createElement('span'); span.className = 'text'; span.textContent = todo.text; contentDiv.appendChild(span);
    if (todo.date) { const badge = document.createElement('span'); badge.className = 'todo-date-badge'; badge.innerHTML = `⏰ ${formatDate(todo.date)}`; contentDiv.appendChild(badge); }
    const del = document.createElement('button'); del.className = 'delete'; del.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`; del.addEventListener('click', () => deleteTodo(todo.id, li));

    li.append(checkbox, contentDiv, del); list.appendChild(li);
  });
  counter.textContent = `${todos.filter(t => t.done).length} из ${todos.length} выполнено`;
}

function addTodo(text, date) {
  if (!text.trim()) return;
  todos.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: text.trim(), date: date || null, done: false });
  save(); render();
  if (date) showToast(`Напоминание на ${formatDate(date)}`, "⏰");
}

function toggleTodo(id) { const t = todos.find(x => x.id === id); if (t) { t.done = !t.done; save(); setTimeout(render, 150); } }
function deleteTodo(id, el) { el.classList.add('removing'); setTimeout(() => { todos = todos.filter(t => t.id !== id); save(); render(); }, 250); }

form.addEventListener('submit', e => {
  e.preventDefault();
  addTodo(input.value, dateBtn.dataset.date || null);
  input.value = ''; resetDatePicker(); input.focus();
});

filterBtns.forEach(btn => btn.addEventListener('click', () => {
  filterBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
  currentFilter = btn.dataset.filter; render();
}));

renderCalendar(); render(); askNotificationPermission();
setInterval(checkReminders, 10000); setInterval(render, 60000);