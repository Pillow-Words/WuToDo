<script setup lang="ts">
import { ref, watch } from "vue";
import type { JiraConfig } from "../types/jira";

const props = defineProps<{
  modelValue: boolean;
  initialConfig: JiraConfig | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", config: JiraConfig): void;
  (e: "clear"): void;
}>();

const form = ref<JiraConfig>({
  baseUrl: "",
  username: "",
  password: "",
  projectKeys: [],
});

// 项目 key 输入框绑定值（逗号分隔）
const projectKeysInput = ref("");

// 将输入的逗号分隔字符串转为数组
watch(projectKeysInput, (val) => {
  form.value.projectKeys = val
    .split(/[,，]/)
    .map((k) => k.trim().toUpperCase())
    .filter((k) => k.length > 0);
});

// 初始化时反向转换
watch(
  () => props.initialConfig,
  (config) => {
    if (config) {
      form.value = { ...config };
      projectKeysInput.value = config.projectKeys?.join(", ") || "";
    } else {
      form.value = {
        baseUrl: "",
        username: "",
        password: "",
        projectKeys: [],
      };
      projectKeysInput.value = "";
    }
  },
  { immediate: true }
);

const testing = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

async function testConnection() {
  if (!form.value.baseUrl || !form.value.username || !form.value.password) {
    testResult.value = { success: false, message: "请填写完整信息" };
    return;
  }

  testing.value = true;
  testResult.value = null;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("fetch_jira_issues", {
      config: {
        base_url: form.value.baseUrl,
        username: form.value.username,
        password: form.value.password,
        project_key: form.value.projectKeys[0] || "",
      },
    });
    testResult.value = { success: true, message: "连接成功！" };
  } catch (e) {
    testResult.value = {
      success: false,
      message: `连接失败: ${String(e)}`,
    };
  } finally {
    testing.value = false;
  }
}

function save() {
  if (!form.value.baseUrl || !form.value.username || !form.value.password) {
    return;
  }
  emit("save", { ...form.value });
  emit("update:modelValue", false);
}

function clear() {
  emit("clear");
  emit("update:modelValue", false);
}

function close() {
  emit("update:modelValue", false);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Jira 配置</h3>
            <button class="close-btn" @click="close">×</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Jira 地址</label>
              <input
                v-model="form.baseUrl"
                type="text"
                placeholder="https://jira.company.com"
              />
            </div>

            <div class="form-group">
              <label>用户名</label>
              <input
                v-model="form.username"
                type="text"
                placeholder="your.username"
              />
            </div>

            <div class="form-group">
              <label>密码</label>
              <input
                v-model="form.password"
                type="password"
                placeholder="password or PAT"
              />
            </div>

            <div class="form-group">
              <label>项目 Key（可选，多个用逗号分隔）</label>
              <input
                v-model="projectKeysInput"
                type="text"
                placeholder="如: PROJ1, PROJ2, PROJ3"
              />
              <small v-if="form.projectKeys.length > 0" class="hint">
                将查询: {{ form.projectKeys.join(', ') }}
              </small>
            </div>

            <div v-if="testResult" class="test-result" :class="{ success: testResult.success }">
              {{ testResult.message }}
            </div>
          </div>

          <div class="modal-footer">
            <button
              v-if="initialConfig"
              class="btn btn-danger"
              @click="clear"
            >
              清除配置
            </button>
            <div class="spacer"></div>
            <button
              class="btn btn-secondary"
              @click="testConnection"
              :disabled="testing"
            >
              {{ testing ? "测试中..." : "测试连接" }}
            </button>
            <button class="btn btn-primary" @click="save">保存</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-panel);
  border-radius: 12px;
  width: 360px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border-subtle);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}

.close-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-size: 13px;
  background: var(--surface-input);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-group input:focus {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1);
}

.form-group input::placeholder {
  color: var(--text-muted);
}

.form-group .hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

.test-result {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  background: rgba(239, 68, 68, 0.1);
  color: rgba(239, 68, 68, 0.9);
}

.test-result.success {
  background: rgba(16, 185, 129, 0.1);
  color: rgba(16, 185, 129, 0.9);
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
}

.spacer {
  flex: 1;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background 0.15s, transform 0.1s;
}

.btn:active {
  transform: scale(0.96);
}

.btn-primary {
  background: rgba(245, 158, 11, 0.9);
  color: white;
}

.btn-primary:hover {
  background: rgba(245, 158, 11, 1);
}

.btn-secondary {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--border-subtle);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: rgba(239, 68, 68, 0.9);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
