import React, { useState } from 'react';
import './TreeView.css';

function TreeNode({ node, selectedId, onSelect, level = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="tree-node">
      <div
        className={`tree-node-content ${node.id === selectedId ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 20 + 10}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren && (
          <span
            className="tree-node-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="tree-node-spacer">•</span>}
        <span className="tree-node-icon">📦</span>
        <span className="tree-node-label">{node.name}</span>
      </div>
      {hasChildren && expanded && (
        <div className="tree-node-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeView({ components, selectedId, onSelect }) {
  return (
    <div className="tree-view">
      <div className="tree-view-header">
        <h3>Product Structure</h3>
      </div>
      <div className="tree-view-content">
        {components.length === 0 ? (
          <div className="tree-view-empty">
            No components loaded. Upload a JT file to get started.
          </div>
        ) : (
          components.map((component) => (
            <TreeNode
              key={component.id}
              node={component}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
