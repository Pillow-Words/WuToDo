<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
import type { Todo } from "../types/todo";
import { STATUS_CONFIG } from "../types/todo";
import { useTodos } from "../composables/useTodos";

const props = defineProps<{ todo: Todo }>();
const { cycleTodoStatus, deleteTodo, updateTodo } = useTodos();

const editing = ref(false);
const editText = ref("");
const editInput = ref<HTMLInputElement>();

const meta = computed(() => STATUS_CONFIG[props.todo.status]);

function startEdit() {
  editing.value = true;
  editText.value = props.todo.text;
  nextTick(() => editInput.value?.focus());
}

function saveEdit() {
  if (editText.value.trim()) {
    updateTodo(props.todo.id, editText.value);
  }
  editing.value = false;
}

function cancelEdit() {
  editing.value = false;
}
</script>

<template>
  <div class="todo-item" :class="{ done: todo.status === 'done' }">
    <button
      class="status-pill"
      :style="{
        '--s-color': meta.color,
      }"
      @click="cycleTodoStatus(todo.id)"
      :title="'点击切换状态'"
    >
      <span class="pill-dot"></span>
      <span class="pill-label">{{ meta.label }}</span>
    </button>

    <div class="content" v-if="!editing" @dblclick="startEdit">
      <span class="text">{{ todo.text }}</span>
    </div>

    <input
      v-else
      ref="editInput"
      v-model="editText"
      class="edit-input"
      @keydown.enter="saveEdit"
      @keydown.escape="cancelEdit"
      @blur="saveEdit"
    />

    <button class="delete-btn" @click="deleteTodo(todo.id)">×</button>
  </div>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}

.todo-item:hover {
  background: var(--surface-hover);
}

/* Status pill */
.status-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px 3px 7px;
  border-radius: 12px;
  border: 1px solid rgba(var(--s-color), 0.2);
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, transform 0.1s;
  /* dynamic border via style */
  border-color: color-mix(in srgb, var(--s-color) 25%, transparent);
  background: color-mix(in srgb, var(--s-color) 10%, transparent);
}

.status-pill:hover {
  background: color-mix(in srgb, var(--s-color) 18%, transparent);
  transform: scale(1.04);
}

.status-pill:active {
  transform: scale(0.96);
}

.pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--s-color);
  flex-shrink: 0;
}

.pill-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--s-color);
  white-space: nowrap;
  line-height: 1;
}

/* Content */
.content {
  flex: 1;
  min-width: 0;
  cursor: default;
}

.text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.5;
  word-break: break-word;
}

.done .text {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* Edit input */
.edit-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: var(--surface-input);
  color: var(--text-primary);
}

.edit-input:focus {
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1);
}

/* Delete button */
.delete-btn {
  opacity: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: rgba(239, 68, 68, 0.8);
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.15s, background 0.15s;
}

.todo-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.12);
}
</style>
