export interface JiraConfig {
  baseUrl: string;
  username: string;
  password: string;
  projectKey: string;
}

export interface JiraIssue {
  id: string;
  summary: string;
  status: string;
  status_category: 'todo' | 'in_progress' | 'done';
  url: string;
  updated_at: string;
}

export const STATUS_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  todo: { label: '待办', color: '#F59E0B' },
  in_progress: { label: '进行中', color: '#06B6D4' },
  done: { label: '完成', color: '#10B981' },
};
