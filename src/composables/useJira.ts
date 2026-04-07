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
        projectKeys: string[];
        projectKey?: string; // 兼容旧版本
      }>('config');

      if (saved) {
        config.value = {
          baseUrl: saved.baseUrl,
          username: saved.username,
          password: decodePassword(saved.password),
          projectKeys: saved.projectKeys || (saved.projectKey ? [saved.projectKey] : []),
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
      projectKeys: cfg.projectKeys,
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

  // 手动刷新（支持多项目）
  async function refreshIssues(projectKey?: string): Promise<void> {
    if (!config.value) return;

    loading.value = true;
    error.value = null;

    try {
      // 如果没有指定项目，查询所有配置的项目
      const projectsToQuery = projectKey
        ? [projectKey]
        : config.value.projectKeys.length > 0
          ? config.value.projectKeys
          : [''];

      const allIssues: JiraIssue[] = [];

      for (const key of projectsToQuery) {
        const result = await invoke<JiraIssue[]>('fetch_jira_issues', {
          config: {
            base_url: config.value.baseUrl,
            username: config.value.username,
            password: config.value.password,
            project_key: key,
          },
        });
        allIssues.push(...result);
      }

      // 去重（按 id）
      const uniqueIssues = Array.from(
        new Map(allIssues.map((i) => [i.id, i])).values()
      );

      issues.value = uniqueIssues;
    } catch (e) {
      error.value = String(e);
      console.error('获取 Jira 工单失败:', e);
    } finally {
      loading.value = false;
    }
  }

  // 按项目分组的工单
  const issuesByProject = computed(() => {
    const grouped = new Map<string, JiraIssue[]>();

    for (const issue of issues.value) {
      const key = issue.project_key || '未分类';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(issue);
    }

    return grouped;
  });

  // 获取所有项目 key 列表（包含工单中但实际未配置的项目）
  const allProjectKeys = computed(() => {
    const keys = new Set<string>();
    if (config.value?.projectKeys) {
      config.value.projectKeys.forEach((k) => keys.add(k));
    }
    issues.value.forEach((i) => {
      if (i.project_key) keys.add(i.project_key);
    });
    return Array.from(keys).sort();
  });

  return {
    config,
    issues,
    loading,
    error,
    initialized,
    statusCounts,
    issuesByProject,
    allProjectKeys,
    loadConfig,
    saveConfig,
    clearConfig,
    refreshIssues,
  };
}
