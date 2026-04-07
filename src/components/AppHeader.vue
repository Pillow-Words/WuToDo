<script setup lang="ts">
import { useTodos } from "../composables/useTodos";
import { useJira } from "../composables/useJira";
import { STATUS_CONFIG } from "../types/todo";
import { STATUS_CATEGORY_CONFIG } from "../types/jira";
import type { TodoStatus } from "../types/todo";

defineProps<{
  activeTab: 'local' | 'jira';
}>();

const { statusCounts: todoCounts } = useTodos();
const { statusCounts: jiraCounts } = useJira();

const todoStatuses: TodoStatus[] = ['pending', 'ongoing', 'done'];
const jiraStatuses = ['todo', 'in_progress', 'done'] as const;
</script>

<template>
  <div class="header">
    <h1 class="title">我的待办</h1>
    <div class="status-counts">
      <!-- Local Todo Counts -->
      <template v-if="activeTab === 'local'">
        <span
          v-for="s in todoStatuses"
          :key="s"
          class="count-pill"
          :style="{
            '--pill-color': STATUS_CONFIG[s].color,
            opacity: todoCounts[s] > 0 ? 1 : 0.35,
          }"
        >
          <span class="dot"></span>
          {{ todoCounts[s] }}
        </span>
      </template>
      <!-- Jira Counts -->
      <template v-else>
        <span
          v-for="s in jiraStatuses"
          :key="s"
          class="count-pill"
          :style="{
            '--pill-color': STATUS_CATEGORY_CONFIG[s].color,
            opacity: jiraCounts[s] > 0 ? 1 : 0.35,
          }"
        >
          <span class="dot"></span>
          {{ jiraCounts[s] }}
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.status-counts {
  display: flex;
  gap: 10px;
}

.count-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: var(--pill-color);
  transition: opacity 0.2s;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--pill-color);
}
</style>
