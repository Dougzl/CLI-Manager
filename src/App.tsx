import { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Sidebar } from "./components/sidebar";
import { TerminalTabs } from "./components/TerminalTabs";
import { CommandPalette } from "./components/CommandPalette";
import { StatsPanel } from "./components/stats/StatsPanel";
import { useSettingsStore } from "./stores/settingsStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useHistoryStore } from "./stores/historyStore";
import "./App.css";

function App() {
  const loadSettings = useSettingsStore((s) => s.load);
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);
  const historySessions = useHistoryStore((s) => s.sessions);
  const loadHistorySessions = useHistoryStore((s) => s.loadSessions);
  const openHistorySession = useHistoryStore((s) => s.openSession);
  const [statsOpen, setStatsOpen] = useState(false);

  useKeyboardShortcuts();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  const handleOpenStats = useCallback(() => {
    void (async () => {
      try {
        if (historySessions.length === 0) {
          await loadHistorySessions();
        }
        setStatsOpen(true);
      } catch (err) {
        toast.error("加载历史会话失败", { description: String(err) });
      }
    })();
  }, [historySessions.length, loadHistorySessions]);

  return (
    <div className="flex h-screen">
      <Sidebar onOpenStats={handleOpenStats} />
      <main className="flex-1 flex flex-col" style={{ backgroundColor: "var(--bg-primary)" }}>
        <TerminalTabs />
      </main>
      <CommandPalette />
      <StatsPanel
        open={statsOpen}
        sessions={historySessions}
        onClose={() => setStatsOpen(false)}
        onOpenSession={openHistorySession}
      />
      <Toaster
        theme={resolvedTheme}
        position="bottom-right"
        toastOptions={{
          style: {
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
          },
        }}
      />
    </div>
  );
}

export default App;
