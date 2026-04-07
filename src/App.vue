<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useWindowSlide } from "./composables/useWindowSlide";
import { useJira } from "./composables/useJira";
import AppHeader from "./components/AppHeader.vue";
import TodoInput from "./components/TodoInput.vue";
import TodoList from "./components/TodoList.vue";
import JiraIssueList from "./components/JiraIssueList.vue";
import JiraConfigModal from "./components/JiraConfigModal.vue";

const { expanded, onPanelEnter, onPanelLeave, setModalOpen } = useWindowSlide();
const { config, loading, loadConfig, refreshIssues, saveConfig, clearConfig } = useJira();

const activeTab = ref<"local" | "jira">("jira");
const showConfigModal = ref(false);

// 弹窗打开时阻止面板收缩
watch(showConfigModal, (isOpen) => {
  setModalOpen(isOpen);
});

// 主界面展示时实时查询
watch(expanded, (isExpanded) => {
  if (isExpanded && activeTab.value === 'jira' && config.value && !loading.value) {
    refreshIssues();
  }
});

// 切换到 Jira tab 时如果已展开也查询
watch(activeTab, (tab) => {
  if (tab === 'jira' && expanded.value && config.value && !loading.value) {
    refreshIssues();
  }
});

onMounted(async () => {
  await loadConfig();
});


function openConfig() {
  showConfigModal.value = true;
}

async function handleSaveConfig(cfg: {
  baseUrl: string;
  username: string;
  password: string;
  projectKeys: string[];
}) {
  await saveConfig(cfg);
  // 保存配置后立即刷新工单
  if (activeTab.value === 'jira') {
    await refreshIssues();
  }
}

async function handleClearConfig() {
  await clearConfig();
}
</script>

<template>
  <div
    class="panel"
    :class="{ expanded }"
    @mouseenter="onPanelEnter"
    @mouseleave="onPanelLeave"
  >
    <div class="panel-inner">
      <AppHeader :active-tab="activeTab" />

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <div class="tab-group">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'jira' }"
            @click="activeTab = 'jira'"
          >
            Jira 待办
          </button>
          <button
            v-if="activeTab === 'jira'"
            class="settings-btn-inline"
            @click="openConfig"
            title="Jira 设置"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m20.5-4.5L16 12m-8 0L3.5 7.5M20.5 16.5L16 12m-8 0L3.5 16.5" />
            </svg>
          </button>
        </div>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'local' }"
          @click="activeTab = 'local'"
        >
          本地待办
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <div v-show="activeTab === 'local'" class="tab-pane">
          <TodoInput />
          <TodoList />
        </div>
        <div v-show="activeTab === 'jira'" class="tab-pane">
          <JiraIssueList />
        </div>
      </div>
    </div>
  </div>

  <JiraConfigModal
    v-model="showConfigModal"
    :initial-config="config"
    @save="handleSaveConfig"
    @clear="handleClearConfig"
  />
</template>

<style scoped>
.panel {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--bg-panel);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border-bottom: 1px solid var(--border-subtle);
  border-radius: 0 0 14px 14px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.45),
    0 0 1px rgba(255, 255, 255, 0.05) inset;
  transform: translateY(-100%);
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
}

.panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

.panel.expanded {
  transform: translateY(0);
}

.panel-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 18px 16px 16px;
}

/* Tab Navigation */
.tab-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 12px 0 8px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
}

.tab-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
}

.tab-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}

.tab-btn:hover {
  color: var(--text-secondary);
}

.tab-btn.active {
  background: var(--surface-hover);
  color: var(--text-primary);
}

/* Settings button inline with Jira tab */
.settings-btn-inline {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  margin-left: 2px;
}

.settings-btn-inline:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.settings-btn-inline svg {
  width: 12px;
  height: 12px;
}

/* Tab Content */
.tab-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

</style>
