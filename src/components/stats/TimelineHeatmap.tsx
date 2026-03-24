import { useMemo } from "react";
import type { HistoryStatsHeatmapDay } from "../../lib/types";

interface TimelineHeatmapProps {
  days: HistoryStatsHeatmapDay[];
  selectedDayStart: number | null;
  onSelectDay: (day: HistoryStatsHeatmapDay) => void;
}

function formatDay(dayStartUtc: number): string {
  if (!Number.isFinite(dayStartUtc) || dayStartUtc <= 0) return "-";
  return new Date(dayStartUtc).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

function cellColor(level: number): string {
  if (level <= 0) return "var(--bg-secondary)";
  if (level === 1) return "rgba(122, 162, 247, 0.26)";
  if (level === 2) return "rgba(122, 162, 247, 0.45)";
  if (level === 3) return "rgba(122, 162, 247, 0.68)";
  return "rgba(122, 162, 247, 0.9)";
}

export function TimelineHeatmap({ days, selectedDayStart, onSelectDay }: TimelineHeatmapProps) {
  const cells = useMemo(() => {
    if (days.length === 0) return [] as Array<{ type: "pad" } | { type: "day"; day: HistoryStatsHeatmapDay }>;
    const first = new Date(days[0].day_start_utc);
    const mondayBasedWeekday = (first.getDay() + 6) % 7;
    const placeholders: Array<{ type: "pad" }> = Array.from({ length: mondayBasedWeekday }, () => ({
      type: "pad",
    }));
    const dayCells = days.map((day) => ({ type: "day" as const, day }));
    return [...placeholders, ...dayCells];
  }, [days]);

  if (days.length === 0) {
    return (
      <div className="text-xs py-6 text-center" style={{ color: "var(--text-muted)" }}>
        暂无热力图数据
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-secondary)" }}>
      <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        最近 {days.length} 天活跃热力图
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-flow-col auto-cols-[13px] grid-rows-7 gap-1 min-w-max">
          {cells.map((item, idx) => {
            if (item.type === "pad") {
              return (
                <div
                  key={`pad-${idx}`}
                  className="w-[13px] h-[13px] rounded-[3px]"
                  style={{ backgroundColor: "transparent" }}
                />
              );
            }
            const day = item.day;
            const selected = day.day_start_utc === selectedDayStart;
            return (
              <button
                key={day.day_start_utc}
                onClick={() => onSelectDay(day)}
                className="w-[13px] h-[13px] rounded-[3px] border transition-colors"
                style={{
                  borderColor: selected ? "var(--accent)" : "transparent",
                  backgroundColor: cellColor(day.level),
                }}
                title={`${formatDay(day.day_start_utc)} · ${day.sessions} 会话 · ${day.messages} 消息`}
              />
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          点击方块查看当天会话
        </div>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="inline-block w-[10px] h-[10px] rounded-[2px]"
              style={{ backgroundColor: cellColor(level) }}
              title={level === 0 ? "无活动" : `活跃等级 ${level}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
