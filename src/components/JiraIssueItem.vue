<script setup lang="ts">
import type { JiraIssue } from "../types/jira";
import { STATUS_CATEGORY_CONFIG } from "../types/jira";
import { open } from "@tauri-apps/plugin-shell";

const props = defineProps<{ issue: JiraIssue }>();

const meta = STATUS_CATEGORY_CONFIG[props.issue.status_category] || {
  color: "#9CA3AF",
};

async function openIssue() {
  await open(props.issue.url);
}
</script>

<template>
  <div class="jira-item" @click="openIssue">
    <div
      class="status-pill"
      :style="{
        '--s-color': meta.color,
      }"
      :title="issue.status"
    >
      <span class="pill-dot"></span>
      <span class="pill-label">{{ issue.status }}</span>
    </div>

    <div class="content">
      <span class="issue-key">{{ issue.id }}</span>
      <span class="text">{{ issue.summary }}</span>
    </div>

    <button class="open-btn" @click.stop="openIssue">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 17L17 7M17 7H7M17 7V17" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.jira-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px;
  border-radius: 8px;
  transition: background 0.15s;
  cursor: pointer;
}

.jira-item:hover {
  background: var(--surface-hover);
}

/* Status pill */
.status-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px 3px 7px;
  border-radius: 12px;
  border: 1px solid rgba(var(--s-color), 0.2);
  background: transparent;
  flex-shrink: 0;
  transition: background 0.15s;
  border-color: color-mix(in srgb, var(--s-color) 25%, transparent);
  background: color-mix(in srgb, var(--s-color) 10%, transparent);
  cursor: default;
}

.pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--s-color);
  flex-shrink: 0;
}

.pill-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--s-color);
  white-space: nowrap;
  line-height: 1;
}

/* Content */
.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.issue-key {
  font-size: 11px;
  color: var(--text-muted);
  font-family: "Courier New", monospace;
}

.text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
  word-break: break-word;
}

/* Open button */
.open-btn {
  opacity: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
}

.open-btn svg {
  width: 14px;
  height: 14px;
}

.jira-item:hover .open-btn {
  opacity: 1;
}

.open-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}
</style>
