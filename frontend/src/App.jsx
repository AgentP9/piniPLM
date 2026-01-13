import { useState, useEffect } from 'react';
import './App.css';
import TreeView from './TreeView';
import ContentView from './ContentView';
import Viewer3D from './Viewer3D';
import FileUpload from './FileUpload';
import { api } from './api';

function App() {
  const [components, setComponents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [currentView, setCurrentView] = useState('geometry'); // 'geometry', 'metadata', 'structure'

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

  // Update selected component when selection changes
  useEffect(() => {
    if (selectedId) {
      const comp = components.find((c) => c.id === selectedId);
      setSelectedComponent(comp || null);
    } else {
      setSelectedComponent(null);
    }
  }, [selectedId, components]);

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
    setComponents((prev) =>
      prev.map((c) => (c.id === updatedData.id ? updatedData : c))
    );
  };

  const handleSaveMetadata = async (data) => {
    try {
      await api.updateMetadata(data.id, data);
      await loadComponents();
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Failed to save metadata:', error);
      alert('Failed to save changes: ' + error.message);
    }
  };

  const handleTransformEnd = async (id, position, rotation) => {
    try {
      await api.updateTransform(id, { position, rotation });
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
              components={components}
              selectedId={selectedId}
              onSelectComponent={handleSelectComponent}
              onTransformEnd={handleTransformEnd}
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
