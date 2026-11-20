const STORAGE_KEY = 'todos';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const counter = document.getElementById('counter');
const emptyHint = document.getElementById('empty');
const dateEl = document.getElementById('current-date');
const filterBtns = document.querySelectorAll('.filter-btn');

let todos = load();
let currentFilter = 'all'; // all, active, done

// Вывод текущей даты
const today = new Date();
const options = { day: 'numeric', month: 'long', weekday: 'long' };
dateEl.textContent = today.toLocaleDateString('ru-RU', options);

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

function render() {
  list.innerHTML = '';

  // Фильтрация
  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.done;
    if (currentFilter === 'done') return todo.done;
    return true;
  });

  // Если пусто — показываем подсказку, но разную для фильтров
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
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = todo.text;

    const del = document.createElement('button');
    del.className = 'delete';
    del.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    del.title = 'Удалить';
    del.addEventListener('click', () => deleteTodo(todo.id, li));

    li.append(checkbox, span, del);
    list.appendChild(li);
  });

  const doneCount = todos.filter(t => t.done).length;
  counter.textContent = `${doneCount} из ${todos.length} выполнено`;
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  todos.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text: trimmed,
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
  // Небольшая задержка, чтобы анимация зачеркивания была видна
  setTimeout(render, 150);
}

function deleteTodo(id, element) {
  // Анимация удаления
  element.classList.add('removing');

  setTimeout(() => {
    todos = todos.filter(t => t.id !== id);
    save();
    render();
  }, 250); // ждем окончания анимации
}

form.addEventListener('submit', e => {
  e.preventDefault();
  addTodo(input.value);
  input.value = '';
  input.focus();
});

// Обработка фильтров
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

render();