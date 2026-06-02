"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { OrgNode } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

export function OrgTreeView({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: OrgNode[];
  selectedId?: string;
  onSelect: (node: OrgNode) => void;
}) {
  const roots = useMemo(() => nodes.filter((node) => !node.parent_id), [nodes]);
  const childrenByParent = useMemo(() => {
    return nodes.reduce<Record<string, OrgNode[]>>((acc, node) => {
      if (!node.parent_id) return acc;
      if (!acc[node.parent_id]) acc[node.parent_id] = [];
      acc[node.parent_id].push(node);
      return acc;
    }, {});
  }, [nodes]);

  return (
    <div className="space-y-1">
      {roots.map((root) => (
        <TreeNode
          key={root.id}
          node={root}
          selectedId={selectedId}
          onSelect={onSelect}
          childrenByParent={childrenByParent}
          depth={0}
        />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  selectedId,
  onSelect,
  childrenByParent,
  depth,
}: {
  node: OrgNode;
  selectedId?: string;
  onSelect: (node: OrgNode) => void;
  childrenByParent: Record<string, OrgNode[]>;
  depth: number;
}) {
  const children = childrenByParent[node.id] ?? [];
  const [open, setOpen] = useState(true);

  return (
    <div>
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 12 }}>
        {children.length > 0 ? (
          <button type="button" className="rounded p-1 hover:bg-slate-100" onClick={() => setOpen((value) => !value)}>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-6" />
        )}
        <Button
          type="button"
          variant="ghost"
          className={cn("h-8 justify-start px-2", selectedId === node.id && "bg-slate-100")}
          onClick={() => onSelect(node)}
        >
          {node.name} <span className="ml-2 text-xs text-slate-500">{node.key}</span>
        </Button>
      </div>
      {open && children.length > 0 && (
        <div className="space-y-1">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              childrenByParent={childrenByParent}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
