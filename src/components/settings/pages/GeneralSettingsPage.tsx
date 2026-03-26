import { useMemo } from "react";
import {
  useSettingsStore,
  type DarkThemePalette,
  type LightThemePalette,
  type ThemeMode,
} from "../../../stores/settingsStore";
import { SHELL_OPTIONS } from "../../../lib/types";
import { normalizeShellKey } from "../../../lib/shell";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
  { value: "system", label: "跟随系统" },
];

const LIGHT_PALETTE_OPTIONS: {
  value: LightThemePalette;
  label: string;
  description: string;
  swatches: [string, string, string];
}[] = [
  {
    value: "warm-paper",
    label: "暖米纸",
    description: "温暖纸感，橙棕强调",
    swatches: ["#f8f4ec", "#2d261d", "#c46a2d"],
  },
  {
    value: "cream-green",
    label: "奶油绿",
    description: "清新中性，绿色强调",
    swatches: ["#f6f7f1", "#1f2a20", "#3f7a4f"],
  },
  {
    value: "ink-red",
    label: "黑白朱砂",
    description: "高对比中性，红色强调",
    swatches: ["#f7f7f5", "#1f1f1c", "#c43d2f"],
  },
];

const DARK_PALETTE_OPTIONS: {
  value: DarkThemePalette;
  label: string;
  description: string;
  swatches: [string, string, string];
}[] = [
  {
    value: "night-indigo",
    label: "夜靛蓝",
    description: "经典冷色，蓝系强调",
    swatches: ["#1a1b26", "#c0caf5", "#7aa2f7"],
  },
  {
    value: "forest-night",
    label: "森林夜",
    description: "深绿氛围，清爽不刺眼",
    swatches: ["#111714", "#d8e5dc", "#52a36e"],
  },
  {
    value: "graphite-red",
    label: "石墨红",
    description: "中性黑灰，朱红强调",
    swatches: ["#171616", "#e6dfdb", "#c95b4a"],
  },
];

const FONT_FAMILY_OPTIONS: { value: string; label: string }[] = [
  { value: "Cascadia Code, Consolas, monospace", label: "Cascadia Code（推荐）" },
  { value: "\"JetBrains Mono\", \"Cascadia Code\", Consolas, monospace", label: "JetBrains Mono" },
  { value: "\"Fira Code\", \"Cascadia Code\", Consolas, monospace", label: "Fira Code" },
  { value: "Consolas, monospace", label: "Consolas" },
  { value: "\"Courier New\", monospace", label: "Courier New" },
];

function PaletteCard({
  active,
  label,
  description,
  swatches,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  swatches: [string, string, string];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`ui-interactive ui-focus-ring relative overflow-hidden rounded-xl border p-3 text-left transition-[transform,box-shadow,border-color,background-color] ${
        active
          ? "bg-surface-container-lowest border-transparent"
          : "bg-surface-container-low border-border hover:bg-surface-container-high"
      }`}
      style={
        active
          ? {
              boxShadow:
                "0 0 0 2px var(--primary), 0 0 0 6px color-mix(in srgb, var(--primary) 22%, transparent)",
            }
          : undefined
      }
      aria-pressed={active}
    >
      {active && (
        <span className="ui-primary-gradient absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold">
          当前
        </span>
      )}
      <div className="flex items-center gap-1.5">
        {swatches.map((color, index) => (
          <span
            key={`${color}-${index}`}
            className="h-4 w-4 rounded-full border"
            style={{
              backgroundColor: color,
              borderColor: active ? "color-mix(in srgb, var(--primary) 65%, var(--border))" : "var(--border)",
              boxShadow:
                active && index === swatches.length - 1
                  ? "0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent)"
                  : "none",
            }}
          />
        ))}
      </div>
      <div className={`mt-2 text-sm font-semibold ${active ? "text-on-surface" : "text-on-surface-variant"}`}>
        {label}
      </div>
      <div className={`mt-1 text-xs ${active ? "text-on-surface-variant" : "text-text-muted"}`}>
        {description}
      </div>
    </button>
  );
}

export function GeneralSettingsPage() {
  const theme = useSettingsStore((s) => s.theme);
  const lightThemePalette = useSettingsStore((s) => s.lightThemePalette);
  const darkThemePalette = useSettingsStore((s) => s.darkThemePalette);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const defaultShell = useSettingsStore((s) => s.defaultShell);
  const useExternalTerminal = useSettingsStore((s) => s.useExternalTerminal);
  const debugMode = useSettingsStore((s) => s.debugMode);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const update = useSettingsStore((s) => s.update);

  const isCustomFontFamily = useMemo(
    () => !FONT_FAMILY_OPTIONS.some((opt) => opt.value === fontFamily),
    [fontFamily]
  );
  const normalizedDefaultShell = normalizeShellKey(defaultShell);
  const shellSelectValue = normalizedDefaultShell ?? defaultShell;
  const isCustomShellValue = !normalizedDefaultShell;

  return (
    <div className="space-y-6">
      <section className="ui-surface-card rounded-2xl border border-border p-4">
        <div className="mb-3 text-sm font-semibold text-on-surface">应用主题</div>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`ui-interactive ui-focus-ring rounded-xl border px-3 py-2 text-sm ${
                  active ? "ui-primary-gradient border-transparent" : "ui-surface-low border-border text-on-surface-variant"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="ui-surface-card rounded-2xl border border-border p-4">
        <div className="mb-3 text-sm font-semibold text-on-surface">浅色配色方案</div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {LIGHT_PALETTE_OPTIONS.map((option) => (
            <PaletteCard
              key={option.value}
              active={lightThemePalette === option.value}
              label={option.label}
              description={option.description}
              swatches={option.swatches}
              onClick={() => update("lightThemePalette", option.value)}
            />
          ))}
        </div>
      </section>

      <section className="ui-surface-card rounded-2xl border border-border p-4">
        <div className="mb-3 text-sm font-semibold text-on-surface">暗色配色方案</div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {DARK_PALETTE_OPTIONS.map((option) => (
            <PaletteCard
              key={option.value}
              active={darkThemePalette === option.value}
              label={option.label}
              description={option.description}
              swatches={option.swatches}
              onClick={() => update("darkThemePalette", option.value)}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="ui-surface-card rounded-2xl border border-border p-4">
          <div className="text-sm font-semibold text-on-surface">字体大小</div>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={24}
              step={1}
              value={fontSize}
              onChange={(e) => update("fontSize", Number(e.target.value))}
              className="w-full accent-accent"
              aria-label="字体大小滑杆"
            />
            <input
              type="number"
              min={10}
              max={24}
              value={fontSize}
              onChange={(e) => update("fontSize", Math.min(24, Math.max(10, Number(e.target.value))))}
              className="ui-focus-ring w-16 rounded-lg border border-border bg-surface-container-high px-2 py-1 text-xs text-on-surface outline-none"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs text-on-surface-variant">字体族</label>
            <select
              value={fontFamily}
              onChange={(e) => update("fontFamily", e.target.value)}
              className="ui-focus-ring w-full rounded-lg border border-border bg-surface-container-high px-2 py-1.5 text-xs text-on-surface outline-none"
              aria-label="终端字体族"
            >
              {isCustomFontFamily && <option value={fontFamily}>当前自定义（保留）</option>}
              {FONT_FAMILY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="ui-surface-card rounded-2xl border border-border p-4">
          <div className="text-sm font-semibold text-on-surface">终端行为</div>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-on-surface-variant">默认 Shell</label>
              <select
                value={shellSelectValue}
                onChange={(e) => update("defaultShell", e.target.value)}
                className="ui-focus-ring w-full rounded-lg border border-border bg-surface-container-high px-2 py-1.5 text-xs text-on-surface outline-none"
                aria-label="默认 Shell"
              >
                {isCustomShellValue && <option value={defaultShell}>当前自定义（保留）</option>}
                {SHELL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">外部 PowerShell</span>
              <button
                className="switch"
                data-on={useExternalTerminal ? "true" : "false"}
                onClick={() => update("useExternalTerminal", !useExternalTerminal)}
                aria-label={useExternalTerminal ? "关闭外部 PowerShell" : "开启外部 PowerShell"}
                aria-pressed={useExternalTerminal}
              >
                <span className="switch-thumb" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">调试模式</span>
              <button
                className="switch"
                data-on={debugMode ? "true" : "false"}
                onClick={() => update("debugMode", !debugMode)}
                aria-label={debugMode ? "关闭调试模式" : "开启调试模式"}
                aria-pressed={debugMode}
              >
                <span className="switch-thumb" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="ui-surface-card rounded-2xl border border-border p-4">
        <div className="mb-2 text-sm font-semibold text-on-surface">实时预览</div>
        <div
          className="rounded-xl border border-border p-4 font-mono"
          style={{ backgroundColor: "var(--surface-container-lowest)", color: "var(--on-surface)" }}
        >
          <div style={{ fontFamily, fontSize: `${fontSize}px` }}>
            <div>$ cli-manager --doctor</div>
            <div className="opacity-80">Environment ready. Launching workspace...</div>
            <div className="mt-1 text-success">✓ Terminal initialized</div>
          </div>
        </div>
      </section>
    </div>
  );
}
