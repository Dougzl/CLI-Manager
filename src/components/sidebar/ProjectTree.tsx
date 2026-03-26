import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { TreeNode as TNode } from "../../lib/types";
import { SidebarSkeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { Folder, Plus, Terminal } from "../icons";
import { TreeNodeItem } from "./TreeNodeItem";
import { useTreeActions } from "./TreeContext";

interface ProjectTreeProps {
  tree: TNode[];
  initialLoading: boolean;
  loadError: string | null;
  collapsed: boolean;
  newGroupParentId: string | null;
  onCreateRootGroup: (name: string) => void;
  onCancelRootGroup: () => void;
  onQuickAddProject: () => void;
  onRetry: () => void;
}

interface CompactItem {
  key: string;
  type: "group" | "project";
  id: string;
  label: string;
  node: TNode;
}

function flattenTree(nodes: TNode[], out: CompactItem[] = []): CompactItem[] {
  for (const node of nodes) {
    if (node.type === "group") {
      out.push({
        key: `g:${node.group.id}`,
        type: "group",
        id: node.group.id,
        label: node.group.name,
        node,
      });
      flattenTree(node.children, out);
    } else {
      out.push({
        key: `p:${node.project.id}`,
        type: "project",
        id: node.project.id,
        label: node.project.name,
        node,
      });
    }
  }
  return out;
}

export function ProjectTree({
  tree,
  initialLoading,
  loadError,
  collapsed,
  newGroupParentId,
  onCreateRootGroup,
  onCancelRootGroup,
  onQuickAddProject,
  onRetry,
}: ProjectTreeProps) {
  const actions = useTreeActions();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  if (initialLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-1.5 pb-2 pt-1">
        <SidebarSkeleton />
      </div>
    );
  }

  if (collapsed) {
    const compactItems = flattenTree(tree);
    return (
      <div className="flex-1 overflow-y-auto px-1 pb-2 pt-1">
        {compactItems.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-3 text-text-muted">
            <Terminal size={20} strokeWidth={1.2} className="opacity-50" />
            <button
              onClick={onQuickAddProject}
              className="ui-flat-action ui-primary-action h-8 w-8 px-0"
              title="快速添加项目"
            >
              <Plus size={12} strokeWidth={2} />
            </button>
          </div>
        )}
        {compactItems.map((item) => {
          if (item.type === "group") {
            const groupNode = item.node.type === "group" ? item.node : null;
            if (!groupNode) return null;
            return (
              <button
                key={item.key}
                className="ui-flat-action mx-auto my-0.5 h-8 w-8 px-0 text-primary"
                title={item.label}
                onContextMenu={(e) => actions.onContextMenuGroup(e, groupNode.group.id, groupNode.group.name)}
              >
                <Folder size={16} strokeWidth={1.5} />
              </button>
            );
          }

          const projectNode = item.node.type === "project" ? item.node : null;
          if (!projectNode) return null;
          const project = projectNode.project;
          const projectInitial = project.name.trim().charAt(0).toUpperCase() || "P";
          const selected =
            actions.selectedId === project.id || actions.selectedProjectIds.has(project.id);
          return (
            <button
              key={item.key}
              className={`mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                selected
                  ? "ui-primary-action text-white"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
              title={project.name}
              onClick={() => actions.onOpenProject(project)}
              onContextMenu={(e) => actions.onContextMenuProject(e, project)}
            >
              {projectInitial}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-1.5 pb-2 pt-1">
      {newGroupParentId === "__root__" && (
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <span className="shrink-0 text-accent">
            <Folder size={16} strokeWidth={1.5} />
          </span>
          <input
            ref={(ref) => {
              ref?.focus();
            }}
            className="ui-focus-ring flex-1 rounded-md bg-surface-container-highest px-1.5 py-1 text-xs text-on-surface outline-none"
            onBlur={(e) => {
              const value = e.currentTarget.value.trim();
              if (value) onCreateRootGroup(value);
              else onCancelRootGroup();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = e.currentTarget.value.trim();
                if (value) onCreateRootGroup(value);
                else onCancelRootGroup();
              }
              if (e.key === "Escape") onCancelRootGroup();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => actions.onDragEnd(null, event)}
      >
        <SortableContext
          items={tree.map((n) => (n.type === "group" ? n.group.id : n.project.id))}
          strategy={verticalListSortingStrategy}
        >
          <div role="tree" aria-label="项目树" aria-multiselectable="true">
            {tree.map((node) => (
              <TreeNodeItem
                key={node.type === "group" ? `g:${node.group.id}` : `p:${node.project.id}`}
                node={node}
                depth={0}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {tree.length === 0 && loadError && (
        <EmptyState
          icon={<Terminal size={40} strokeWidth={1} />}
          title="项目加载失败"
          description={loadError}
          action={{ label: "重试", onClick: onRetry }}
        />
      )}

      {tree.length === 0 && !loadError && (
        <EmptyState
          icon={<Terminal size={40} strokeWidth={1} />}
          title="欢迎使用 CLI-Manager"
          description="集中管理你的开发项目终端。添加项目后即可快速启动 CLI 工具。"
          action={{ label: "快速添加项目", onClick: onQuickAddProject }}
        />
      )}
    </div>
  );
}
