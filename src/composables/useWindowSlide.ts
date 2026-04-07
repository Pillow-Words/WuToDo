import { ref, onMounted, onUnmounted } from "vue";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

const expanded = ref(false);
let collapseTimer: ReturnType<typeof setTimeout> | null = null;
let unlisten: (() => void) | null = null;

// 弹窗打开时阻止面板收缩
const isModalOpen = ref(false);

export function useWindowSlide() {
  onMounted(async () => {
    const appWindow = getCurrentWindow();

    // Listen for trigger-enter from the trigger window
    unlisten = await listen("trigger-enter", () => {
      cancelCollapse();
      if (!expanded.value) {
        expanded.value = true;
        appWindow.show();
        appWindow.setFocus();
      }
    });
  });

  onUnmounted(() => {
    unlisten?.();
  });

  function cancelCollapse() {
    if (collapseTimer) {
      clearTimeout(collapseTimer);
      collapseTimer = null;
    }
  }

  function scheduleCollapse() {
    // 弹窗打开时不收缩
    if (isModalOpen.value) return;

    cancelCollapse();
    collapseTimer = setTimeout(async () => {
      expanded.value = false;
      const appWindow = getCurrentWindow();
      // Small delay for CSS animation to finish
      setTimeout(() => {
        appWindow.hide();
      }, 250);
    }, 400);
  }

  function onPanelEnter() {
    cancelCollapse();
  }

  function onPanelLeave() {
    scheduleCollapse();
  }

  function setModalOpen(value: boolean) {
    isModalOpen.value = value;
  }

  return { expanded, onPanelEnter, onPanelLeave, setModalOpen };
}
