import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import type { HistorySessionSummary, HistorySessionView } from "../../lib/types";
import { useHistoryStore } from "../../stores/historyStore";
import { TimelineHeatmap } from "./TimelineHeatmap";

interface StatsPanelProps {
  open: boolean;
  sessions: HistorySessionView[];
  onClose: () => void;
  onOpenSession: (sessionKey: string) => Promise<void>;
}

function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("zh-CN").format(value);
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  return `${(value * 100).toFixed(1)}%`;
}

function formatDay(dayStartUtc: number): string {
  if (!Number.isFinite(dayStartUtc) || dayStartUtc <= 0) return "-";
  return new Date(dayStartUtc).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
}

function makeSessionKey(summary: HistorySessionSummary): string {
  return `${summary.source}:${summary.session_id}:${summary.file_path}`;
}

export function StatsPanel({ open, sessions, onClose, onOpenSession }: StatsPanelProps) {
  const loadingStats = useHistoryStore((s) => s.loadingStats);
  const stats = useHistoryStore((s) => s.stats);
  const loadStats = useHistoryStore((s) => s.loadStats);

  const [projectKey, setProjectKey] = useState("");
  const [rangeDays, setRangeDays] = useState(30);
  const [selectedDayStart, setSelectedDayStart] = useState<number | null>(null);

  const projectOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of sessions) {
      if (item.project_key) set.add(item.project_key);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [sessions]);

  useEffect(() => {
    if (!open) return;
    void loadStats({
      projectKey: projectKey || null,
      rangeDays,
    }).catch((err) => {
      toast.error("加载统计失败", { description: String(err) });
    });
  }, [open, projectKey, rangeDays, loadStats]);

  useEffect(() => {
    if (!stats) return;
    if (!selectedDayStart) return;
    const exists = stats.heatmap.some((day) => day.day_start_utc === selectedDayStart);
    if (!exists) {
      setSelectedDayStart(null);
    }
  }, [stats, selectedDayStart]);

  const selectedDay = useMemo(() => {
    if (!stats || selectedDayStart === null) return null;
    return stats.heatmap.find((item) => item.day_start_utc === selectedDayStart) ?? null;
  }, [stats, selectedDayStart]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 57, backgroundColor: "rgba(0, 0, 0, 0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-6xl h-[min(86vh,860px)] rounded-lg border flex flex-col overflow-hidden"
        style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}
      >
        <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            <BarChart3 size={15} />
            分析看板
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border w-7 h-7"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            title="关闭"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-3 py-2 border-b flex flex-wrap items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <select
            value={projectKey}
            onChange={(e) => setProjectKey(e.target.value)}
            className="text-xs rounded-md border px-2 py-1 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">全部项目</option>
            {projectOptions.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>

          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value) || 30)}
            className="text-xs rounded-md border px-2 py-1 outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          >
            <option value={7}>最近 7 天</option>
            <option value={30}>最近 30 天</option>
            <option value={90}>最近 90 天</option>
          </select>

          <button
            onClick={() => {
              void loadStats({
                projectKey: projectKey || null,
                rangeDays,
              }).catch((err) => {
                toast.error("刷新统计失败", { description: String(err) });
              });
            }}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw size={12} />
            刷新
          </button>

          <div className="ml-auto text-[11px]" style={{ color: "var(--text-muted)" }}>
            数据范围：最近 {rangeDays} 天
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
          {loadingStats && (
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              正在聚合统计...
            </div>
          )}

          {!loadingStats && stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="rounded-md border p-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    会话数
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                    {formatCount(stats.total_sessions)}
                  </div>
                </div>
                <div className="rounded-md border p-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    消息数
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                    {formatCount(stats.total_messages)}
                  </div>
                </div>
                <div className="rounded-md border p-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    输入 Token
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                    {formatCount(stats.total_input_tokens)}
                  </div>
                </div>
                <div className="rounded-md border p-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    输出 Token
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                    {formatCount(stats.total_output_tokens)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded-md border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    项目活跃排行
                  </div>
                  {stats.project_ranking.length === 0 && (
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      当前筛选下没有项目数据
                    </div>
                  )}
                  {stats.project_ranking.slice(0, 8).map((item) => (
                    <div
                      key={item.project_key}
                      className="flex items-center justify-between py-1.5 border-b text-xs"
                      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    >
                      <span className="truncate pr-2">{item.project_key}</span>
                      <span className="shrink-0">
                        {formatCount(item.sessions)} 会话 / {formatCount(item.messages)} 消息
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-md border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    模型占比
                  </div>
                  {stats.model_distribution.length === 0 && (
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      当前筛选下没有模型数据
                    </div>
                  )}
                  {stats.model_distribution.slice(0, 8).map((item) => (
                    <div key={item.model} className="mb-2 last:mb-0">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="truncate pr-2" style={{ color: "var(--text-secondary)" }}>
                          {item.model}
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>
                          {formatPercent(item.ratio)} · {item.sessions}
                        </span>
                      </div>
                      <div
                        className="h-1.5 mt-1 rounded-full overflow-hidden"
                        style={{ backgroundColor: "var(--bg-tertiary)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, item.ratio * 100))}%`,
                            backgroundColor: "var(--accent)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <TimelineHeatmap
                days={stats.heatmap}
                selectedDayStart={selectedDayStart}
                onSelectDay={(day) => setSelectedDayStart(day.day_start_utc)}
              />

              <div className="rounded-md border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  {selectedDay ? `${formatDay(selectedDay.day_start_utc)} 会话` : "选择热力图日期查看会话"}
                </div>
                {!selectedDay && (
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    点击上方热力图方块后，这里会展示当天会话清单
                  </div>
                )}
                {selectedDay && selectedDay.session_refs.length === 0 && (
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    当天无会话
                  </div>
                )}
                {selectedDay?.session_refs.map((session) => (
                  <button
                    key={makeSessionKey(session)}
                    onClick={() => {
                      void onOpenSession(makeSessionKey(session))
                        .then(() => onClose())
                        .catch((err) => toast.error("打开会话失败", { description: String(err) }));
                    }}
                    className="w-full text-left py-2 border-b last:border-b-0 hover:opacity-90 transition-opacity"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {session.title}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {session.source} · {session.project_key} · {session.message_count} 条消息
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
