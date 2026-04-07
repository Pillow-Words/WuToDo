import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { load } from '@tauri-apps/plugin-store';
import type { JiraConfig, JiraIssue } from '../types/jira';

const STORE_FILE = 'jira-config.json';

// 简单的 base64 编码（防明文存储）
function encodePassword(password: string): string {
  return btoa(password);
}

function decodePassword(encoded: string): string {
  try {
    return atob(encoded);
  } catch {
    return encoded;
  }
}

// 模块级共享状态（确保所有组件使用同一状态）
const config = ref<JiraConfig | null>(null);
const issues = ref<JiraIssue[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const initialized = ref(false);

export function useJira() {

  // 状态统计
  const statusCounts = computed(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 };
    for (const issue of issues.value) {
      counts[issue.status_category as keyof typeof counts]++;
    }
    return counts;
  });

  // 获取 store
  async function getStore() {
    return await load(STORE_FILE);
  }

  // 加载配置
  async function loadConfig(): Promise<void> {
    if (initialized.value) return;

    try {
      const store = await getStore();
      const saved = await store.get<{
        baseUrl: string;
        username: string;
        password: string;
        projectKey: string;
      }>('config');

      if (saved) {
        config.value = {
          baseUrl: saved.baseUrl,
          username: saved.username,
          password: decodePassword(saved.password),
          projectKey: saved.projectKey,
        };
      }
    } catch (e) {
      console.error('加载 Jira 配置失败:', e);
    } finally {
      initialized.value = true;
    }
  }

  // 保存配置
  async function saveConfig(cfg: JiraConfig): Promise<void> {
    const store = await getStore();
    await store.set('config', {
      baseUrl: cfg.baseUrl,
      username: cfg.username,
      password: encodePassword(cfg.password),
      projectKey: cfg.projectKey,
    });
    await store.save();

    config.value = cfg;
  }

  // 清除配置
  async function clearConfig(): Promise<void> {
    const store = await getStore();
    await store.delete('config');
    await store.save();

    config.value = null;
    issues.value = [];
  }

  // 手动刷新
  async function refreshIssues(): Promise<void> {
    if (!config.value) return;

    loading.value = true;
    error.value = null;

    try {
      const result = await invoke<JiraIssue[]>('fetch_jira_issues', {
        config: {
          base_url: config.value.baseUrl,
          username: config.value.username,
          password: config.value.password,
          project_key: config.value.projectKey,
        },
      });
      issues.value = result;
    } catch (e) {
      error.value = String(e);
      console.error('获取 Jira 工单失败:', e);
    } finally {
      loading.value = false;
    }
  }

  return {
    config,
    issues,
    loading,
    error,
    initialized,
    statusCounts,
    loadConfig,
    saveConfig,
    clearConfig,
    refreshIssues,
  };
}
