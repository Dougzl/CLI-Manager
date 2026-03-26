import { ChevronRight, FolderPlus, Plus } from "../icons";

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreateGroup: () => void;
  onCreateProject: () => void;
}

export function SidebarHeader({
  collapsed,
  onToggleCollapse,
  onCreateGroup,
  onCreateProject,
}: SidebarHeaderProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-2 pb-2 pt-3">
        <button
          onClick={onToggleCollapse}
          className="ui-flat-action h-8 w-8 px-0"
          title="展开侧边栏"
        >
          <ChevronRight size={14} strokeWidth={1.8} />
        </button>
        <button
          onClick={onCreateGroup}
          className="ui-flat-action h-8 w-8 px-0"
          title="新建分组"
        >
          <FolderPlus size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={onCreateProject}
          className="ui-flat-action ui-primary-action h-8 w-8 px-0"
          title="新建终端"
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 pb-1 pt-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Projects</span>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleCollapse}
          className="ui-flat-action h-8 w-8 px-0"
          title="折叠侧边栏"
        >
          <ChevronRight size={14} strokeWidth={1.8} className="rotate-180" />
        </button>
        <button
          onClick={onCreateGroup}
          className="ui-flat-action text-xs"
          title="新建分组"
        >
          <FolderPlus size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={onCreateProject}
          className="ui-flat-action ui-primary-action px-2.5 text-xs"
        >
          + New
        </button>
      </div>
    </div>
  );
}
