<script setup lang="ts">
import { useJira } from "../composables/useJira";
import JiraIssueItem from "./JiraIssueItem.vue";

const { issues, loading, config } = useJira();
</script>

<template>
  <div class="list-wrap">
    <div v-if="!config" class="empty">
      <p class="empty-icon">// jira</p>
      <p class="empty-text">未配置 Jira</p>
      <p class="hint">点击设置按钮配置 Jira 连接</p>
    </div>
    <div v-else-if="loading && issues.length === 0" class="empty">
      <p class="empty-icon">...</p>
      <p class="empty-text">加载中...</p>
    </div>
    <div v-else-if="issues.length === 0" class="empty">
      <p class="empty-icon">// done</p>
      <p class="empty-text">暂无未完成工单</p>
      <p class="hint">所有工单已处理完毕</p>
    </div>
    <TransitionGroup v-else name="issue" tag="div" class="list">
      <JiraIssueItem v-for="issue in issues" :key="issue.id" :issue="issue" />
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

.list {
  display: flex;
  flex-direction: column;
}

.issue-enter-active {
  transition: all 0.2s ease-out;
}

.issue-leave-active {
  transition: all 0.15s ease-in;
}

.issue-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.issue-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
