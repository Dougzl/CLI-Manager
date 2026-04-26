import { useCallback, useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import { isTauri } from "@tauri-apps/api/core";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  disable as disableAutostart,
  enable as enableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";
import {
  register as registerGlobalShortcut,
  unregister as unregisterGlobalShortcut,
} from "@tauri-apps/plugin-global-shortcut";
import { Sidebar } from "./components/sidebar";
import { TerminalTabs } from "./components/TerminalTabs";
import { CommandPalette } from "./components/CommandPalette";
import { StatsPanel } from "./components/stats/StatsPanel";
import { WindowTitleBar } from "./components/WindowTitleBar";
import { useSettingsStore } from "./stores/settingsStore";
import { useProjectStore } from "./stores/projectStore";
import { useSessionStore } from "./stores/sessionStore";
import { useTerminalStore } from "./stores/terminalStore";
import { useSyncStore } from "./stores/syncStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useHistoryStore } from "./stores/historyStore";
import { createPerfMarker, logWarn } from "./lib/logger";
import {
  getProjectShell,
  getProjectStartupCommand,
  getProjectTitle,
  parseProjectEnvVars,
} from "./lib/projectLaunch";
import {
  getNextCronRunAt,
  getProjectsForAppLaunch,
  getProjectsForCron,
  validateCronExpression,
} from "./lib/projectScheduler";
import { toTauriShortcut } from "./lib/shortcut";
import { hideMainWindowToTray, toggleMainWindowVisibility } from "./lib/windowVisibility";
import type { Project } from "./lib/types";
import "./App.css";

const appStartAt =
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
let firstScreenPerfReported = false;
const COMPACT_WINDOW_WIDTH = 350;
const WINDOW_MIN_HEIGHT = 600;
const IN_TAURI = isTauri();

function App() {
  const loadSettings = useSettingsStore((s) => s.load);
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);
  const lightThemePalette = useSettingsStore((s) => s.lightThemePalette);
  const darkThemePalette = useSettingsStore((s) => s.darkThemePalette);
  const historySessions = useHistoryStore((s) => s.sessions);
  const loadHistorySessions = useHistoryStore((s) => s.loadSessions);
  const openHistoryWorkspace = useHistoryStore((s) => s.openHistory);
  const openHistorySession = useHistoryStore((s) => s.openSession);
  const viewMode = useSettingsStore((s) => s.viewMode);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const launchAtStartup = useSettingsStore((s) => s.launchAtStartup);
  const minimizeToTray = useSettingsStore((s) => s.minimizeToTray);
  const toggleMainWindowShortcut = useSettingsStore((s) => s.keyboardShortcuts.toggleMainWindow);
  const projects = useProjectStore((s) => s.projects);

  const [statsOpen, setStatsOpen] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const restoreWindowWidthRef = useRef<number | null>(null);
  const allowWindowCloseRef = useRef(false);
  const appLaunchHandledRef = useRef(false);

  useKeyboardShortcuts();

  const launchProjectSession = useCallback(async (project: Project, reason: "app-launch" | "cron") => {
    const { sessions, sessionStatuses, createSession } = useTerminalStore.getState();

    if (reason === "app-launch") {
      const alreadyRunning = sessions.some(
        (session) =>
          session.projectId === project.id && (sessionStatuses[session.id] ?? "running") === "running"
      );
      if (alreadyRunning) {
        return false;
      }
    }

    await createSession(
      project.id,
      project.path,
      getProjectTitle(project),
      getProjectStartupCommand(project),
      parseProjectEnvVars(project),
      getProjectShell(project)
    );

    if (reason === "cron") {
      toast.success(`已按定时计划启动：${project.name}`);
    }

    return true;
  }, []);

  const requestAppExit = useCallback(async () => {
    allowWindowCloseRef.current = true;
    await getCurrentWindow().close();
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await useSyncStore.getState().load();
      await useSessionStore.getState().load();
      await useProjectStore.getState().fetchAll();

      const { projects, projectHealth } = useProjectStore.getState();
      const projectMap = new Map(projects.map((p) => [p.id, p]));
      await useTerminalStore.getState().restoreSessions(projectMap, projectHealth);
      setBootstrapped(true);
    };

    init().catch((err) => {
      toast.error("初始化失败", { description: String(err) });
    });
  }, [loadSettings]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-light-palette", lightThemePalette);
    document.documentElement.setAttribute("data-dark-palette", darkThemePalette);
  }, [resolvedTheme, lightThemePalette, darkThemePalette]);

  const hideToTrayRef = useRef(false);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!IN_TAURI) return;
    const appWindow = getCurrentWindow();
    let unlistenClose: Promise<() => void> | null = null;
    let unlistenResize: (() => void) | null = null;
    let unlistenFocus: (() => void) | null = null;

    const hideToTrayIfNeeded = async () => {
      if (!minimizeToTray || hideToTrayRef.current) return;
      try {
        if (await appWindow.isMinimized() || !(await appWindow.isVisible())) return;
        hideToTrayRef.current = true;
        await appWindow.hide();
      } catch (err) {
        logWarn("Failed to hide window to tray", err);
      } finally {
        hideToTrayRef.current = false;
      }
    };

    const scheduleHideToTray = () => {
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = window.setTimeout(async () => {
        hideTimeoutRef.current = null;
        if (!document.hasFocus()) {
          await hideToTrayIfNeeded();
        }
      }, 150);
    };

    unlistenClose = appWindow.onCloseRequested(async (event) => {
      if (allowWindowCloseRef.current) {
        await useSessionStore.getState().clear();
        return;
      }

      if (minimizeToTray) {
        event.preventDefault();
        await hideMainWindowToTray();
        return;
      }

      await useSessionStore.getState().clear();
    });

    void (async () => {
      unlistenResize = await appWindow.onResized(async () => {
        if (!minimizeToTray || hideToTrayRef.current) return;
        try {
          if (await appWindow.isMinimized()) {
            hideToTrayRef.current = true;
            await appWindow.hide();
          }
        } catch (err) {
          logWarn("Failed to hide minimized window to tray", err);
        } finally {
          hideToTrayRef.current = false;
        }
      });
    })();

    void (async () => {
      unlistenFocus = await appWindow.onFocusChanged(async ({ payload: focused }) => {
        if (!focused) {
          scheduleHideToTray();
        } else {
          if (hideTimeoutRef.current !== null) {
            window.clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
          }
        }
      });
    })();

    return () => {
      unlistenClose?.then((fn) => fn()).catch(() => {});
      unlistenResize?.();
      unlistenFocus?.();
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [minimizeToTray]);

  useEffect(() => {
    if (!IN_TAURI || !settingsLoaded) return;

    void (async () => {
      try {
        const enabled = await isAutostartEnabled();
        if (launchAtStartup && !enabled) {
          await enableAutostart();
        } else if (!launchAtStartup && enabled) {
          await disableAutostart();
        }
      } catch (err) {
        logWarn("Failed to sync autostart setting", err);
      }
    })();
  }, [launchAtStartup, settingsLoaded]);

  useEffect(() => {
    if (!IN_TAURI || !settingsLoaded) return;

    const tauriShortcut = toTauriShortcut(toggleMainWindowShortcut);
    void registerGlobalShortcut(tauriShortcut, (event) => {
      if (event.state === "Pressed") {
        void toggleMainWindowVisibility();
      }
    }).catch((err) => {
      toast.error("注册全局快捷键失败", { description: String(err) });
    });

    return () => {
      void unregisterGlobalShortcut(tauriShortcut).catch(() => {});
    };
  }, [settingsLoaded, toggleMainWindowShortcut]);

  useEffect(() => {
    if (!IN_TAURI) return;

    let unlistenToggle: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;

    void (async () => {
      unlistenToggle = await listen("app-toggle-window", () => {
        void toggleMainWindowVisibility();
      });
      unlistenExit = await listen("app-exit-requested", () => {
        void requestAppExit();
      });
    })();

    return () => {
      unlistenToggle?.();
      unlistenExit?.();
    };
  }, [requestAppExit]);

  useEffect(() => {
    if (!bootstrapped || appLaunchHandledRef.current) return;
    appLaunchHandledRef.current = true;

    const launchProjects = getProjectsForAppLaunch(useProjectStore.getState().projects);
    for (const project of launchProjects) {
      void launchProjectSession(project, "app-launch");
    }
  }, [bootstrapped, launchProjectSession]);

  useEffect(() => {
    if (!bootstrapped) return;

    const timeouts = new Map<string, number>();
    let disposed = false;

    const scheduleProject = (project: Project) => {
      const validation = validateCronExpression(project.cron_expression);
      if (!validation.valid) {
        return;
      }

      const nextRunAt = getNextCronRunAt(validation.normalized);
      if (!nextRunAt) {
        return;
      }

      const delay = Math.max(1000, nextRunAt - Date.now());
      const timeoutId = window.setTimeout(async () => {
        if (disposed) return;
        try {
          await launchProjectSession(project, "cron");
        } finally {
          if (!disposed) {
            scheduleProject(project);
          }
        }
      }, delay);
      timeouts.set(project.id, timeoutId);
    };

    for (const project of getProjectsForCron(projects)) {
      scheduleProject(project);
    }

    return () => {
      disposed = true;
      for (const timeoutId of timeouts.values()) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [bootstrapped, projects, launchProjectSession]);

  useEffect(() => {
    if (!IN_TAURI) return;
    const appWindow = getCurrentWindow();

    void (async () => {
      try {
        if (viewMode !== "compact") {
          if (restoreWindowWidthRef.current && restoreWindowWidthRef.current > COMPACT_WINDOW_WIDTH) {
            await appWindow.setSize(
              new LogicalSize(restoreWindowWidthRef.current, Math.max(window.innerHeight, WINDOW_MIN_HEIGHT))
            );
          }
          await appWindow.setMinSize(new LogicalSize(800, WINDOW_MIN_HEIGHT));
          restoreWindowWidthRef.current = null;
          return;
        }

        if (restoreWindowWidthRef.current == null) {
          restoreWindowWidthRef.current = window.innerWidth;
        }
        await appWindow.setMinSize(new LogicalSize(COMPACT_WINDOW_WIDTH, WINDOW_MIN_HEIGHT));
        if (await appWindow.isMaximized()) {
          await appWindow.unmaximize();
        }
        await appWindow.setSize(
          new LogicalSize(COMPACT_WINDOW_WIDTH, Math.max(window.innerHeight, WINDOW_MIN_HEIGHT))
        );
      } catch (err) {
        logWarn("Failed to shrink window for compact mode", err);
      }
    })();
  }, [viewMode]);

  const handleOpenStats = useCallback(() => {
    const stopPerf = createPerfMarker("stats.open", {
      sessionsBefore: historySessions.length,
    });
    void (async () => {
      try {
        if (historySessions.length === 0) {
          await loadHistorySessions();
        }
        setStatsOpen(true);
        stopPerf({ sessionsAfter: useHistoryStore.getState().sessions.length });
      } catch (err) {
        stopPerf({ error: String(err) });
        toast.error("加载历史会话失败", { description: String(err) });
      }
    })();
  }, [historySessions.length, loadHistorySessions]);

  const handleOpenSessionFromStats = useCallback(
    async (sessionKey: string) => {
      try {
        await openHistoryWorkspace();
        await openHistorySession(sessionKey);
      } catch (err) {
        toast.error("跳转历史会话失败", { description: String(err) });
        throw err;
      }
    },
    [openHistoryWorkspace, openHistorySession]
  );

  useEffect(() => {
    if (firstScreenPerfReported) return;
    let raf1 = 0;
    let raf2 = 0;
    const stopPerf = createPerfMarker("app.first_screen", {
      bootElapsedMs:
        (typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now()) - appStartAt,
    });
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (firstScreenPerfReported) return;
        firstScreenPerfReported = true;
        stopPerf({
          resolvedTheme,
          statsPrefetched: historySessions.length > 0,
          viewMode,
        });
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [resolvedTheme, historySessions.length, viewMode]);

  return (
    <div className="ui-workspace-shell flex h-screen flex-col">
      <a href="#main-content" className="skip-link">
        跳转到主内容
      </a>
      <WindowTitleBar />
      {viewMode === "compact" ? (
        <div id="main-content" className="flex min-h-0 flex-1" tabIndex={-1}>
          <Sidebar onOpenStats={handleOpenStats} compactMode />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <Sidebar onOpenStats={handleOpenStats} />
          <main id="main-content" className="ui-main-shell flex min-w-0 flex-1 flex-col" tabIndex={-1}>
            <TerminalTabs />
          </main>
        </div>
      )}
      <CommandPalette />
      <StatsPanel
        open={statsOpen}
        sessions={historySessions}
        onClose={() => setStatsOpen(false)}
        onOpenSession={handleOpenSessionFromStats}
      />
      <Toaster
        theme={resolvedTheme}
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "border border-border bg-bg-secondary text-text-primary",
            description: "text-text-secondary",
          },
        }}
      />
    </div>
  );
}

export default App;
