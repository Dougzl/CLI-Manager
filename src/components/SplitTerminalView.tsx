import { useRef, useCallback } from "react";
import { XTermTerminal } from "./XTermTerminal";
import { useTerminalStore, type SplitState } from "../stores/terminalStore";

interface Props {
  sessionId: string;
  split: SplitState | undefined;
  resolvedTheme: "dark" | "light";
  terminalThemeName: string;
}

export function SplitTerminalView({ sessionId, split, resolvedTheme, terminalThemeName }: Props) {
  const setSplitRatio = useTerminalStore((s) => s.setSplitRatio);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container || !split) return;

      const rect = container.getBoundingClientRect();
      const isH = split.direction === "horizontal";

      const onMove = (ev: MouseEvent) => {
        const ratio = isH
          ? (ev.clientX - rect.left) / rect.width
          : (ev.clientY - rect.top) / rect.height;
        setSplitRatio(sessionId, ratio);
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = isH ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [sessionId, split, setSplitRatio],
  );

  if (!split) {
    return <XTermTerminal sessionId={sessionId} resolvedTheme={resolvedTheme} terminalThemeName={terminalThemeName} />;
  }

  const isH = split.direction === "horizontal";
  const first = `${split.ratio * 100}%`;
  const second = `${(1 - split.ratio) * 100}%`;

  return (
    <div ref={containerRef} className="w-full h-full flex" style={{ flexDirection: isH ? "row" : "column" }}>
      <div className="overflow-hidden" style={{ [isH ? "width" : "height"]: first }}>
        <XTermTerminal sessionId={sessionId} resolvedTheme={resolvedTheme} terminalThemeName={terminalThemeName} />
      </div>
      <div
        onMouseDown={handleDragStart}
        className="shrink-0 hover:opacity-100 transition-colors"
        style={{
          [isH ? "width" : "height"]: "4px",
          backgroundColor: "var(--border)",
          cursor: isH ? "col-resize" : "row-resize",
        }}
      />
      <div className="overflow-hidden" style={{ [isH ? "width" : "height"]: second }}>
        <XTermTerminal sessionId={split.secondSessionId} resolvedTheme={resolvedTheme} terminalThemeName={terminalThemeName} />
      </div>
    </div>
  );
}
