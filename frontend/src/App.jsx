import { useState, useEffect, useCallback } from 'react';
import './App.css';
import TreeView from './TreeView';
import ContentView from './ContentView';
import Viewer3D from './Viewer3D';
import FileUpload from './FileUpload';
import { api } from './api';

function App() {
  const [components, setComponents] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // Can be part ID or instanceId
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [currentView, setCurrentView] = useState('geometry'); // 'geometry', 'metadata', 'structure'
  const [transformMode, setTransformMode] = useState('translate'); // 'translate', 'rotate', 'scale'
  const [faceAlignMode, setFaceAlignMode] = useState(false);
  const [selectedFaces, setSelectedFaces] = useState([]); // Store selected faces for alignment

  const loadComponents = async () => {
    try {
      const metadata = await api.getAllMetadata();
      const componentsArray = Object.values(metadata);
      setComponents(componentsArray);
    } catch (error) {
      console.error('Failed to load components:', error);
    }
  };

  // Load components on mount
  useEffect(() => {
    loadComponents();
  }, []);

  // Build a flat list of all instances (root parts + all child instances)
  // Each instance has a unique renderKey for selection
  const getAllInstances = useCallback(() => {
    const instances = [];
    
    const processComponent = (comp, parentId = null, relationData = null) => {
      // For root components, use the part ID as the render key
      // For child instances, use the instanceId as the render key
      const renderKey = relationData?.instanceId || comp.id;
      
      instances.push({
        renderKey,
        id: comp.id,
        instanceId: relationData?.instanceId,
        name: comp.name,
        displayName: comp.displayName || comp.name,
        position: relationData?.position || comp.position,
        rotation: relationData?.rotation || comp.rotation,
        color: comp.color,
        isChildInstance: !!relationData,
        parentId,
        filename: comp.filename // Add filename to instance
      });
      
      // Process children recursively
      if (comp.children && comp.children.length > 0) {
        comp.children.forEach(child => {
          const childComp = components.find(c => c.id === child.id);
          if (childComp) {
            // Count instances to determine display name
            const samePartInstances = comp.children.filter(c => c.id === child.id);
            const instanceNumber = samePartInstances.findIndex(c => c.instanceId === child.instanceId) + 1;
            const showInstanceNumber = samePartInstances.length > 1;
            
            const childWithDisplayName = {
              ...childComp,
              displayName: showInstanceNumber ? `${childComp.name} [${instanceNumber}]` : childComp.name
            };
            
            processComponent(childWithDisplayName, comp.id, child);
          }
        });
      }
    };
    
    // Get root components (not children of any other component)
    const getAllChildIds = () => {
      const childIds = new Set();
      components.forEach(comp => {
        if (comp.children && comp.children.length > 0) {
          comp.children.forEach(child => childIds.add(child.id));
        }
      });
      return childIds;
    };
    
    const childIds = getAllChildIds();
    const rootComponents = components.filter(comp => !childIds.has(comp.id));
    
    rootComponents.forEach(comp => processComponent(comp));
    
    return instances;
  }, [components]);

  // Update selected component when selection changes
  useEffect(() => {
    if (selectedId) {
      const allInstances = getAllInstances();
      const instance = allInstances.find(inst => inst.renderKey === selectedId);
      if (instance) {
        // For child instances, we want to show the actual part metadata
        // but with the instance-specific position/rotation
        const baseComp = components.find(c => c.id === instance.id);
        setSelectedComponent({
          ...baseComp,
          ...instance,
          // Keep the base component data but override with instance-specific data
          position: instance.position,
          rotation: instance.rotation,
          displayName: instance.displayName
        });
      } else {
        setSelectedComponent(null);
      }
    } else {
      setSelectedComponent(null);
    }
  }, [selectedId, components, getAllInstances]);

  const handleUpload = async (file) => {
    try {
      const result = await api.uploadFile(file);
      if (result.success) {
        await loadComponents();
        alert('File uploaded successfully!');
        setShowUpload(false);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleSelectComponent = (id) => {
    setSelectedId(id);
  };

  const handleUpdateMetadata = (updatedData) => {
    // Update local state immediately for responsive UI
    // Check if this is a child instance (has instanceId and parentId)
    if (updatedData.instanceId && updatedData.parentId) {
      // Update child instance's relationship data
      setComponents((prev) =>
        prev.map((c) => {
          if (c.id === updatedData.parentId && c.children) {
            // Update the specific child instance in the parent's children array
            return {
              ...c,
              children: c.children.map((child) =>
                child.instanceId === updatedData.instanceId
                  ? {
                      ...child,
                      position: updatedData.position,
                      rotation: updatedData.rotation,
                    }
                  : child
              ),
            };
          }
          return c;
        })
      );
    } else {
      // Update root part data
      setComponents((prev) =>
        prev.map((c) => (c.id === updatedData.id ? updatedData : c))
      );
    }
  };

  const handleSaveMetadata = async (data) => {
    try {
      // Check if this is a child instance (has instanceId and parentId)
      if (data.instanceId && data.parentId) {
        // Update child instance's relationship data
        await api.updateChildRelation(data.parentId, data.instanceId, data.position, data.rotation);
      } else {
        // Update root part metadata
        await api.updateMetadata(data.id, data);
      }
      await loadComponents();
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Failed to save metadata:', error);
      alert('Failed to save changes: ' + error.message);
    }
  };

  const handleTransformEnd = async (renderKey, position, rotation) => {
    try {
      // Find the instance to determine if it's a root part or child instance
      const allInstances = getAllInstances();
      const instance = allInstances.find(inst => inst.renderKey === renderKey);
      
      if (!instance) return;
      
      if (instance.isChildInstance) {
        // For child instances, update the relationship data
        await api.updateChildRelation(instance.parentId, instance.instanceId, position, rotation);
      } else {
        // For root parts, update the part's transform
        await api.updateTransform(instance.id, { position, rotation });
      }
      
      await loadComponents();
    } catch (error) {
      console.error('Failed to update transform:', error);
    }
  };

  const handleAddChild = async (parentId, childId) => {
    try {
      await api.addChildPart(parentId, childId, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
      await loadComponents();
      alert('Child part added successfully!');
    } catch (error) {
      console.error('Failed to add child:', error);
      alert('Failed to add child: ' + error.message);
    }
  };

  const handleRemoveChild = async (parentId, childId) => {
    try {
      await api.removeChildPart(parentId, childId);
      await loadComponents();
      alert('Child part removed successfully!');
    } catch (error) {
      console.error('Failed to remove child:', error);
      alert('Failed to remove child: ' + error.message);
    }
  };

  const handleReplaceChild = async (parentId, oldChildId, newChildId) => {
    try {
      await api.replaceChildPart(parentId, oldChildId, newChildId);
      await loadComponents();
      alert('Child part replaced successfully!');
    } catch (error) {
      console.error('Failed to replace child:', error);
      alert('Failed to replace child: ' + error.message);
    }
  };

  const handleFaceSelect = (faceData) => {
    if (!faceAlignMode) return;
    
    setSelectedFaces(prev => {
      const newFaces = [...prev, faceData];
      
      // If we have two faces selected, perform alignment
      if (newFaces.length === 2) {
        performFaceAlignment(newFaces[0], newFaces[1]);
        return []; // Reset after alignment
      }
      
      return newFaces;
    });
  };

  const performFaceAlignment = (face1, face2) => {
    // Calculate the transformation needed to align face1 to face2
    // This is a placeholder implementation
    // In a real implementation, this would:
    // 1. Calculate the normal vectors of both faces
    // 2. Calculate the rotation needed to align the normals
    // 3. Calculate the translation to bring the faces into contact
    // 4. Apply the transformation to the component
    
    alert(`Face alignment: Selected faces from components ${face1.componentId} and ${face2.componentId}.\n\nThis feature is ready for full implementation with proper face normal calculation and component transformation.`);
    
    // Reset face selection
    setSelectedFaces([]);
    setFaceAlignMode(false);
  };

  const toggleFaceAlignMode = () => {
    setFaceAlignMode(prev => !prev);
    setSelectedFaces([]); // Reset selected faces when toggling
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🔧 piniPLM - Product Lifecycle Management</h1>
          <div className="header-controls">
            <div className="view-selector">
              <label>View:</label>
              <select value={currentView} onChange={(e) => setCurrentView(e.target.value)}>
                <option value="geometry">Geometry View</option>
                <option value="metadata">Meta Data View</option>
                <option value="structure">Structure View</option>
              </select>
            </div>
            {currentView === 'geometry' && selectedId && (
              <div className="view-selector">
                <label>Transform:</label>
                <select value={transformMode} onChange={(e) => setTransformMode(e.target.value)} disabled={faceAlignMode}>
                  <option value="translate">Move (Translate)</option>
                  <option value="rotate">Rotate</option>
                  <option value="scale">Scale</option>
                </select>
              </div>
            )}
            {currentView === 'geometry' && (
              <button
                className={`upload-button ${faceAlignMode ? 'active' : ''}`}
                onClick={toggleFaceAlignMode}
                style={{
                  backgroundColor: faceAlignMode ? '#ff6b6b' : undefined,
                  fontWeight: faceAlignMode ? 'bold' : undefined
                }}
                title={faceAlignMode ? `Face Align Mode ON (${selectedFaces.length}/2 faces selected)` : 'Click to enable Face Align mode'}
              >
                {faceAlignMode ? `Face Align ON (${selectedFaces.length}/2)` : 'Face Align OFF'}
              </button>
            )}
            <button
              className="upload-button"
              onClick={() => setShowUpload(!showUpload)}
            >
              {showUpload ? 'Close Upload' : 'Upload File'}
            </button>
          </div>
        </div>
      </header>

      {showUpload && (
        <div className="upload-section">
          <FileUpload onUpload={handleUpload} />
        </div>
      )}

      <div className="app-content">
        <div className="left-panel">
          <TreeView
            components={components}
            selectedId={selectedId}
            onSelect={handleSelectComponent}
            onAddChild={handleAddChild}
            onRemoveChild={handleRemoveChild}
            onReplaceChild={handleReplaceChild}
          />
        </div>

        <div className="center-panel">
          {currentView === 'geometry' ? (
            <Viewer3D
              instances={getAllInstances()}
              selectedId={selectedId}
              onSelectComponent={handleSelectComponent}
              onTransformEnd={handleTransformEnd}
              transformMode={transformMode}
              faceAlignMode={faceAlignMode}
              onFaceSelect={handleFaceSelect}
            />
          ) : currentView === 'metadata' ? (
            <div className="view-placeholder">
              <h2>Meta Data View</h2>
              <p>Displays detailed metadata and properties for components</p>
              <p>Use the Properties panel on the right to edit metadata</p>
            </div>
          ) : (
            <div className="view-placeholder">
              <h2>Structure View</h2>
              <p>Displays the product structure and assembly relationships</p>
              <p>Shows parent-child relationships and hierarchical organization</p>
            </div>
          )}
        </div>

        <div className="right-panel">
          <ContentView
            selectedComponent={selectedComponent}
            onUpdate={handleUpdateMetadata}
            onSave={handleSaveMetadata}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
