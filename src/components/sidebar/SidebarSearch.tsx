import { Play, Search, X } from "../icons";

interface SidebarSearchProps {
  collapsed: boolean;
  searchQuery: string;
  selectedCount: number;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onStartFiltered: () => void;
  onStartSelected: () => void;
  onClearSelected: () => void;
  onExpandSidebar: () => void;
}

export function SidebarSearch({
  collapsed,
  searchQuery,
  selectedCount,
  filteredCount,
  onSearchChange,
  onStartFiltered,
  onStartSelected,
  onClearSelected,
  onExpandSidebar,
}: SidebarSearchProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-2 py-1">
        <button
          onClick={onExpandSidebar}
          className="ui-flat-action h-8 w-8 px-0"
          title="展开并搜索"
        >
          <Search size={14} strokeWidth={1.6} />
        </button>
        <button
          onClick={onStartSelected}
          disabled={selectedCount === 0}
          className="ui-flat-action h-8 w-8 px-0"
          title="启动已选"
        >
          <Play size={13} strokeWidth={1.7} />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 rounded-xl bg-surface-container-highest px-2.5 py-1.5">
        <span className="text-on-surface-variant">
          <Search size={14} strokeWidth={1.5} />
        </span>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-on-surface outline-none"
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={onStartFiltered}
          disabled={filteredCount === 0}
          className="mini-btn"
          title="启动筛选结果"
        >
          启动筛选
        </button>
        <button
          onClick={onStartSelected}
          disabled={selectedCount === 0}
          className="mini-btn"
          title="启动已选"
        >
          启动已选 ({selectedCount})
        </button>
        {selectedCount > 0 && (
          <button onClick={onClearSelected} className="mini-btn" title="清空已选">
            <span className="inline-flex items-center gap-1">
              <X size={11} strokeWidth={2} />
              清空
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
