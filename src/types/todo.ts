export type TodoStatus = 'pending' | 'ongoing' | 'done';

export interface StatusMeta {
  label: string;
  color: string;
  next: TodoStatus;
}

export const STATUS_CONFIG: Record<TodoStatus, StatusMeta> = {
  pending: { label: '待办', color: '#F59E0B', next: 'ongoing' },
  ongoing: { label: '初步结论', color: '#06B6D4', next: 'done' },
  done:    { label: '完成', color: '#10B981', next: 'pending' },
};

export interface Todo {
  id: string;
  text: string;
  status: TodoStatus;
  createdAt: number;
}
