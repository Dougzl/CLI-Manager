import { useMemo, useState } from "react";
import { TERMINAL_THEME_PRESETS, getTerminalTheme } from "../../../lib/terminalThemes";
import { useSettingsStore } from "../../../stores/settingsStore";

const SWATCH_KEYS = ["background", "foreground", "red", "green", "blue", "cyan"] as const;

export function ThemeSettingsPage() {
  const terminalThemeName = useSettingsStore((s) => s.terminalThemeName);
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);
  const lightThemePalette = useSettingsStore((s) => s.lightThemePalette);
  const darkThemePalette = useSettingsStore((s) => s.darkThemePalette);
  const update = useSettingsStore((s) => s.update);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return TERMINAL_THEME_PRESETS;
    return TERMINAL_THEME_PRESETS.filter((preset) => preset.name.toLowerCase().includes(keyword));
  }, [query]);

  const selectedTheme = useMemo(() => {
    const effective = getTerminalTheme(terminalThemeName, resolvedTheme, lightThemePalette, darkThemePalette);
    const selectedPreset = TERMINAL_THEME_PRESETS.find((item) => item.id === terminalThemeName) ?? null;
    return {
      label: selectedPreset?.name ?? "跟随应用主题（Auto）",
      theme: effective,
    };
  }, [darkThemePalette, lightThemePalette, resolvedTheme, terminalThemeName]);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
      <section className="ui-surface-card rounded-2xl border border-border p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-on-surface">终端主题</div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索主题..."
            className="ui-focus-ring w-52 rounded-lg border border-border bg-surface-container-high px-2 py-1.5 text-xs text-on-surface outline-none"
            aria-label="终端主题搜索"
          />
        </div>

        <div className="mb-3">
          <button
            onClick={() => update("terminalThemeName", "auto")}
            className={`ui-interactive ui-focus-ring flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${
              terminalThemeName === "auto" ? "ui-primary-gradient border-transparent" : "ui-surface-low border-border"
            }`}
          >
            <span className="text-sm font-medium">跟随应用主题</span>
            <span className={`text-xs ${terminalThemeName === "auto" ? "text-white/80" : "text-on-surface-variant"}`}>Auto</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
          {filtered.map((preset) => {
            const active = terminalThemeName === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => update("terminalThemeName", preset.id)}
                className={`ui-interactive ui-focus-ring rounded-xl border p-2 text-left ${
                  active ? "ui-surface-card border-accent" : "ui-surface-low border-border"
                }`}
              >
                <div className="truncate text-xs font-semibold text-on-surface">{preset.name}</div>
                <div className="mt-2 flex gap-1">
                  {SWATCH_KEYS.map((key) => (
                    <span
                      key={key}
                      className="h-3.5 w-3.5 rounded-[4px] border"
                      style={{
                        backgroundColor: (preset.theme as Record<string, string | undefined>)[key] ?? "var(--surface-container-lowest)",
                        borderColor: "var(--border)",
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-on-surface-variant">
              未找到匹配主题
            </div>
          )}
        </div>
      </section>

      <aside className="ui-surface-card rounded-2xl border border-border p-4">
        <div className="text-sm font-semibold text-on-surface">主题详情</div>
        <div className="mt-2 text-xs text-on-surface-variant">{selectedTheme.label}</div>
        <div
          className="mt-3 rounded-xl border p-3 font-mono text-xs"
          style={{
            borderColor: "var(--border)",
            backgroundColor: selectedTheme.theme.background ?? "var(--surface-container-lowest)",
            color: selectedTheme.theme.foreground ?? "var(--on-surface)",
          }}
        >
          <div>$ echo \"hello cli-manager\"</div>
          <div className="mt-1 opacity-80">hello cli-manager</div>
          <div className="mt-3 flex gap-1">
            {SWATCH_KEYS.map((key) => (
              <span
                key={key}
                className="h-4 w-4 rounded-[4px] border border-white/15"
                style={{
                  backgroundColor: (selectedTheme.theme as Record<string, string | undefined>)[key] ?? "var(--surface-container-lowest)",
                }}
                title={key}
              />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
