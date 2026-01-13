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

  const loadComponents = async () => {
    try {
      const metadata = await api.getAllMetadata();
      const componentsArray = Object.values(metadata);
      setComponents(componentsArray);
    } catch (error) {
      console.error('Failed to load components:', error);
    }
  };

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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🔧 piniPLM - Product Lifecycle Management</h1>
          <button
            className="upload-button"
            onClick={() => setShowUpload(!showUpload)}
          >
            {showUpload ? 'Close Upload' : 'Upload File'}
          </button>
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
          />
        </div>

        <div className="center-panel">
          <Viewer3D
            components={components}
            selectedId={selectedId}
            onSelectComponent={handleSelectComponent}
            onTransformEnd={handleTransformEnd}
          />
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
