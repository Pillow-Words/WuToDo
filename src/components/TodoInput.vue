<script setup lang="ts">
import { ref } from "vue";
import { useTodos } from "../composables/useTodos";

const { addTodo } = useTodos();
const inputText = ref("");

function handleSubmit() {
  if (inputText.value.trim()) {
    addTodo(inputText.value);
    inputText.value = "";
  }
}
</script>

<template>
  <div class="input-wrap">
    <input
      v-model="inputText"
      type="text"
      placeholder="添加新任务..."
      @keydown.enter="handleSubmit"
    />
    <button class="add-btn" @click="handleSubmit" :disabled="!inputText.trim()">
      +
    </button>
  </div>
</template>

<style scoped>
.input-wrap {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

input {
  flex: 1;
  padding: 9px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: var(--surface-input);
  color: var(--text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
}

input::placeholder {
  color: var(--text-muted);
}

input:focus {
  border-color: rgba(245, 158, 11, 0.5);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1);
}

.add-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: var(--color-pending);
  color: #1a1a1a;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, transform 0.1s;
}

.add-btn:hover:not(:disabled) {
  background: #D97706;
  transform: scale(1.05);
}

.add-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.add-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
</style>
