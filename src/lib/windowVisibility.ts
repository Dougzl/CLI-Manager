import { getCurrentWindow } from "@tauri-apps/api/window";
import { logWarn } from "./logger";

export async function revealMainWindow() {
  const appWindow = getCurrentWindow();
  try {
    if (await appWindow.isMinimized()) {
      await appWindow.unminimize();
    }
    if (!(await appWindow.isVisible())) {
      await appWindow.show();
    }
    await appWindow.setFocus();
  } catch (err) {
    logWarn("Failed to reveal main window", err);
  }
}

export async function hideMainWindowToTray() {
  try {
    await getCurrentWindow().hide();
  } catch (err) {
    logWarn("Failed to hide main window to tray", err);
  }
}

export async function toggleMainWindowVisibility() {
  const appWindow = getCurrentWindow();
  try {
    if (await appWindow.isVisible()) {
      await appWindow.hide();
      return;
    }
    await revealMainWindow();
  } catch (err) {
    logWarn("Failed to toggle main window visibility", err);
  }
}
