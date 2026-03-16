import { attachConsole, error, info, warn } from "@tauri-apps/plugin-log";

let initialized = false;

function formatArg(arg: unknown): string {
  if (arg instanceof Error) {
    return arg.stack || arg.message;
  }
  if (typeof arg === "string") return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

export async function initLogging() {
  if (initialized) return;
  initialized = true;
  try {
    await attachConsole();
  } catch (err) {
    console.warn("Failed to attach Tauri console logger:", err);
  }
  void info("Logger initialized");
}

export function logInfo(message: string, data?: unknown) {
  void info(data ? `${message} ${formatArg(data)}` : message);
}

export function logWarn(message: string, data?: unknown) {
  void warn(data ? `${message} ${formatArg(data)}` : message);
}

export function logError(message: string, data?: unknown) {
  void error(data ? `${message} ${formatArg(data)}` : message);
}
