<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useJira } from "../composables/useJira";
import JiraIssueItem from "./JiraIssueItem.vue";

const { issues, loading, config, issuesByProject, allProjectKeys } =
  useJira();

// 当前选中的项目 tab，'all' 表示全部
const activeProject = ref<string>("all");

// 监听项目 key 变化，重置 activeProject
watch(
  () => allProjectKeys.value,
  (keys) => {
    if (keys.length > 0 && !keys.includes(activeProject.value)) {
      activeProject.value = "all";
    }
  }
);

// 过滤后的工单列表
const filteredIssues = computed(() => {
  if (activeProject.value === "all") {
    return issues.value;
  }
  return issuesByProject.value.get(activeProject.value) || [];
});

// 每个项目的工单数量
const getProjectCount = (key: string) => {
  if (key === "all") return issues.value.length;
  return issuesByProject.value.get(key)?.length || 0;
};
</script>

<template>
  <div class="list-wrap">
    <!-- 未配置 -->
    <div v-if="!config" class="empty">
      <p class="empty-icon">// jira</p>
      <p class="empty-text">未配置 Jira</p>
      <p class="hint">点击设置按钮配置 Jira 连接</p>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading && issues.length === 0" class="empty">
      <p class="empty-icon">...</p>
      <p class="empty-text">加载中...</p>
    </div>

    <!-- 无数据 -->
    <div v-else-if="issues.length === 0" class="empty">
      <p class="empty-icon">// done</p>
      <p class="empty-text">暂无未完成工单</p>
      <p class="hint">所有工单已处理完毕</p>
    </div>

    <!-- 有数据 -->
    <template v-else>
      <!-- 项目子标签页 -->
      <div v-if="allProjectKeys.length > 1" class="project-tabs">
        <button
          class="project-tab"
          :class="{ active: activeProject === 'all' }"
          @click="activeProject = 'all'"
        >
          全部 ({{ getProjectCount("all") }})
        </button>
        <button
          v-for="key in allProjectKeys"
          :key="key"
          class="project-tab"
          :class="{ active: activeProject === key }"
          @click="activeProject = key"
        >
          {{ key }} ({{ getProjectCount(key) }})
        </button>
      </div>

      <!-- 工单列表 -->
      <TransitionGroup name="issue" tag="div" class="list">
        <JiraIssueItem
          v-for="issue in filteredIssues"
          :key="issue.id"
          :issue="issue"
        />
      </TransitionGroup>

      <!-- 空项目提示 -->
      <div v-if="filteredIssues.length === 0" class="empty-project">
        <p class="hint">该项目暂无未完成工单</p>
      </div>
    </template>
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

.empty-project {
  text-align: center;
  padding: 24px 0;
}

/* 项目子标签页 */
.project-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  overflow-x: auto;
  flex-wrap: nowrap;
}

.project-tab {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 5px;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.project-tab:hover {
  color: var(--text-secondary);
}

.project-tab.active {
  background: var(--surface-hover);
  color: var(--text-primary);
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
