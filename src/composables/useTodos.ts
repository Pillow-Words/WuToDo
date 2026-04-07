import { ref, watch, computed } from "vue";
import type { Todo } from "../types/todo";
import { STATUS_CONFIG } from "../types/todo";

const todos = ref<Todo[]>([]);
let loaded = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function getStore() {
  const { load } = await import("@tauri-apps/plugin-store");
  return await load("todos.json");
}

function migrateTodo(raw: any): Todo {
  if ('completed' in raw && !('status' in raw)) {
    return {
      id: raw.id,
      text: raw.text,
      status: raw.completed ? 'done' : 'pending',
      createdAt: raw.createdAt,
    };
  }
  return raw as Todo;
}

async function loadTodos() {
  if (loaded) return;
  try {
    const store = await getStore();
    const saved = await store.get<any[]>("todos");
    if (saved) todos.value = saved.map(migrateTodo);
  } catch {
    // first run, no data yet
  }
  loaded = true;
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const store = await getStore();
      await store.set("todos", todos.value);
      await store.save();
    } catch {
      // ignore save errors
    }
  }, 500);
}

watch(todos, scheduleSave, { deep: true });

const statusCounts = computed(() => {
  const counts = { pending: 0, ongoing: 0, done: 0 };
  for (const t of todos.value) {
    counts[t.status]++;
  }
  return counts;
});

function addTodo(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.value.unshift({
    id: crypto.randomUUID(),
    text: trimmed,
    status: 'pending',
    createdAt: Date.now(),
  });
}

function deleteTodo(id: string) {
  todos.value = todos.value.filter((t) => t.id !== id);
}

function cycleTodoStatus(id: string) {
  const todo = todos.value.find((t) => t.id === id);
  if (todo) todo.status = STATUS_CONFIG[todo.status].next;
}

function updateTodo(id: string, text: string) {
  const todo = todos.value.find((t) => t.id === id);
  if (todo) todo.text = text.trim();
}

export function useTodos() {
  loadTodos();
  return { todos, statusCounts, addTodo, deleteTodo, cycleTodoStatus, updateTodo };
}
