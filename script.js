const STORAGE_KEY = 'todos';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const dateInput = document.getElementById('todo-date');
const list = document.getElementById('todo-list');
const counter = document.getElementById('counter');
const emptyHint = document.getElementById('empty');
const dateEl = document.getElementById('current-date');
const filterBtns = document.querySelectorAll('.filter-btn');

let todos = load();
let currentFilter = 'all';

// Текущая дата в шапке
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

// Форматирование даты для красивого вывода
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Проверка, просрочена ли задача
function isOverdue(dateString, isDone) {
  if (!dateString || isDone) return false;
  return new Date(dateString).getTime() < new Date().getTime();
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

    // Чекбокс
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    // Блок с текстом и датой
    const contentDiv = document.createElement('div');
    contentDiv.className = 'todo-content';

    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = todo.text;
    contentDiv.appendChild(span);

    // Если есть дата - показываем плашку
    if (todo.date) {
      const dateBadge = document.createElement('span');
      dateBadge.className = 'todo-date-badge';
      dateBadge.innerHTML = `⏰ ${formatDate(todo.date)}`;
      contentDiv.appendChild(dateBadge);
    }

    // Кнопка удаления
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
  addTodo(input.value, dateInput.value);
  input.value = '';
  dateInput.value = ''; // Очищаем дату после добавления
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

render();

// Обновляем список каждую минуту, чтобы статус "просрочено" обновлялся сам
setInterval(render, 60000);