export interface JiraConfig {
  baseUrl: string;
  username: string;
  password: string;
  projectKeys: string[]; // 支持多个项目
}

export interface JiraIssue {
  id: string;
  summary: string;
  status: string; // 原始状态文字
  status_category: 'todo' | 'in_progress' | 'done';
  project_key: string;
  url: string;
  updated_at: string;
}

// 按状态分类的颜色配置（不再映射文字，只提供颜色）
export const STATUS_CATEGORY_CONFIG: Record<string, { color: string }> = {
  todo: { color: '#F59E0B' },
  in_progress: { color: '#06B6D4' },
  done: { color: '#10B981' },
};
