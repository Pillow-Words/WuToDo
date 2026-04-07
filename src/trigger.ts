import { emit } from "@tauri-apps/api/event";

const strip = document.querySelector(".trigger-strip")!;

strip.addEventListener("mouseenter", () => {
  emit("trigger-enter");
});
