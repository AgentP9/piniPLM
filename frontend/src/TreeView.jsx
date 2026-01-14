import React, { useState } from 'react';
import './TreeView.css';
import PartSelector from './PartSelector';

function TreeNode({ node, allComponents, selectedId, onSelect, onAddChild, onRemoveChild, onReplaceChild, level = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [showPartSelector, setShowPartSelector] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const handleAddChild = (childId) => {
    if (onAddChild) {
      onAddChild(node.id, childId);
    }
  };

  const handleRemoveChild = (instanceId) => {
    if (onRemoveChild) {
      onRemoveChild(node.id, instanceId);
    }
  };

  const handlePartSelect = (part) => {
    handleAddChild(part.id);
    setShowPartSelector(false);
  };

  return (
    <div className="tree-node">
      {showPartSelector && (
        <PartSelector
          parts={allComponents}
          onSelect={handlePartSelect}
          onCancel={() => setShowPartSelector(false)}
          excludeIds={[node.id]}
        />
      )}
      <div
        className={`tree-node-content ${(node.instanceId || node.id) === selectedId ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 20 + 10}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <span onClick={() => onSelect(node.instanceId || node.id)} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
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
          <span className="tree-node-label">{node.displayName || node.name}</span>
        </span>
        {showActions && (
          <div className="tree-node-actions">
            <button
              className="tree-action-btn"
              title="Add Child Part"
              onClick={(e) => {
                e.stopPropagation();
                setShowPartSelector(true);
              }}
            >
              ➕
            </button>
          </div>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="tree-node-children">
          {node.children.map((child) => {
            // Find the full child metadata
            const childMetadata = allComponents.find(c => c.id === child.id);
            if (!childMetadata) return null;
            
            // Count instances of the same part to show instance number
            const samePartInstances = node.children.filter(c => c.id === child.id);
            const instanceNumber = samePartInstances.findIndex(c => c.instanceId === child.instanceId) + 1;
            const showInstanceNumber = samePartInstances.length > 1;
            
            // Merge relationship data with child metadata
            const childWithRelation = {
              ...childMetadata,
              instanceId: child.instanceId,
              displayName: showInstanceNumber ? `${childMetadata.name} [${instanceNumber}]` : childMetadata.name,
              relationPosition: child.position,
              relationRotation: child.rotation
            };
            
            return (
              <div key={child.instanceId} style={{ position: 'relative' }}>
                <TreeNode
                  node={childWithRelation}
                  allComponents={allComponents}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onAddChild={onAddChild}
                  onRemoveChild={onRemoveChild}
                  onReplaceChild={onReplaceChild}
                  level={level + 1}
                />
                <button
                  className="tree-remove-btn"
                  title="Remove from parent"
                  style={{ 
                    position: 'absolute',
                    right: '5px',
                    top: '5px',
                    fontSize: '10px',
                    padding: '2px 5px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Remove ${childWithRelation.displayName} from ${node.name}?`)) {
                      handleRemoveChild(child.instanceId);
                    }
                  }}
                >
                  ✖
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TreeView({ components, selectedId, onSelect, onAddChild, onRemoveChild, onReplaceChild }) {
  // Build hierarchical structure: only show root-level components
  // (components that are not children of any other component)
  const getAllChildIds = (comps) => {
    const childIds = new Set();
    comps.forEach(comp => {
      if (comp.children && comp.children.length > 0) {
        comp.children.forEach(child => childIds.add(child.id));
      }
    });
    return childIds;
  };

  const childIds = getAllChildIds(components);
  const rootComponents = components.filter(comp => !childIds.has(comp.id));

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
          rootComponents.map((component) => (
            <TreeNode
              key={component.id}
              node={component}
              allComponents={components}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onRemoveChild={onRemoveChild}
              onReplaceChild={onReplaceChild}
            />
          ))
        )}
      </div>
    </div>
  );
}
