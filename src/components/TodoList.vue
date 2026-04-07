<script setup lang="ts">
import { useTodos } from "../composables/useTodos";
import TodoItem from "./TodoItem.vue";

const { todos } = useTodos();
</script>

<template>
  <div class="list-wrap">
    <div v-if="todos.length === 0" class="empty">
      <p class="empty-icon">// todo</p>
      <p class="empty-text">暂无任务</p>
      <p class="hint">输入内容并按回车添加</p>
    </div>
    <TransitionGroup name="todo" tag="div" class="list">
      <TodoItem v-for="todo in todos" :key="todo.id" :todo="todo" />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.list-wrap {
  flex: 1;
  overflow-y: auto;
  margin: 0 -8px;
  padding: 0 8px;
}

.empty {
  text-align: center;
  padding: 48px 0 32px;
}

.empty-icon {
  font-size: 16px;
  font-family: "Courier New", monospace;
  color: var(--text-muted);
  margin-bottom: 8px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.hint {
  font-size: 12px;
  margin-top: 4px;
  color: var(--text-muted);
}

.todo-enter-active {
  transition: all 0.2s ease-out;
}

.todo-leave-active {
  transition: all 0.15s ease-in;
}

.todo-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.todo-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
