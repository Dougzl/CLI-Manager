import { invoke } from "@tauri-apps/api/core";
import { logError } from "./logger";

export interface ExternalTab {
  cwd?: string;
  title: string;
  startupCmd?: string;
  shell?: string;
}

export async function openWindowsTerminal(tabs: ExternalTab[]) {
  if (!tabs.length) return;
  try {
    await invoke("open_windows_terminal", {
      tabs: tabs.map((t) => ({
        cwd: t.cwd ?? null,
        title: t.title,
        startup_cmd: t.startupCmd ?? null,
        shell: t.shell ?? null,
      })),
    });
  } catch (err) {
    console.error("Failed to open Windows Terminal:", err);
    logError("Failed to open Windows Terminal", err);
  }
}
