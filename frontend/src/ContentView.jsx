import React, { useState, useEffect } from 'react';
import './ContentView.css';

export default function ContentView({ selectedComponent, onUpdate, onSave }) {
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedComponent) {
      setFormData(selectedComponent);
      setHasChanges(false);
    }
  }, [selectedComponent]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
    if (onUpdate) {
      onUpdate({ ...formData, [field]: value });
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
      setHasChanges(false);
    }
  };

  if (!selectedComponent) {
    return (
      <div className="content-view">
        <div className="content-view-header">
          <h3>Properties</h3>
        </div>
        <div className="content-view-empty">
          Select a component to view and edit its properties
        </div>
      </div>
    );
  }

  return (
    <div className="content-view">
      <div className="content-view-header">
        <h3>Properties</h3>
        {hasChanges && (
          <button className="save-button" onClick={handleSave}>
            Save Changes
          </button>
        )}
      </div>
      <div className="content-view-content">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Nomenclature</label>
          <input
            type="text"
            value={formData.nomenclature || ''}
            onChange={(e) => handleChange('nomenclature', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Part Number</label>
          <input
            type="text"
            value={formData.partNumber || ''}
            onChange={(e) => handleChange('partNumber', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Revision</label>
          <input
            type="text"
            value={formData.revision || ''}
            onChange={(e) => handleChange('revision', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            rows="3"
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Material</label>
          <input
            type="text"
            value={formData.material || ''}
            onChange={(e) => handleChange('material', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Weight</label>
          <input
            type="text"
            value={formData.weight || ''}
            onChange={(e) => handleChange('weight', e.target.value)}
            placeholder="e.g., 2.5 kg"
          />
        </div>

        <div className="form-group">
          <label>Cost</label>
          <input
            type="text"
            value={formData.cost || ''}
            onChange={(e) => handleChange('cost', e.target.value)}
            placeholder="e.g., $100.00"
          />
        </div>

        <div className="form-group">
          <label>Supplier</label>
          <input
            type="text"
            value={formData.supplier || ''}
            onChange={(e) => handleChange('supplier', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Status</label>
          <select
            value={formData.status || 'Draft'}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="Draft">Draft</option>
            <option value="In Review">In Review</option>
            <option value="Approved">Approved</option>
            <option value="Released">Released</option>
            <option value="Obsolete">Obsolete</option>
          </select>
        </div>

        <div className="form-section">
          <h4>Position (X, Y, Z)</h4>
          <div className="form-row">
            <div className="form-group-inline">
              <label>X</label>
              <input
                type="number"
                step="0.1"
                value={formData.position?.x || 0}
                onChange={(e) =>
                  handleChange('position', {
                    ...formData.position,
                    x: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="form-group-inline">
              <label>Y</label>
              <input
                type="number"
                step="0.1"
                value={formData.position?.y || 0}
                onChange={(e) =>
                  handleChange('position', {
                    ...formData.position,
                    y: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="form-group-inline">
              <label>Z</label>
              <input
                type="number"
                step="0.1"
                value={formData.position?.z || 0}
                onChange={(e) =>
                  handleChange('position', {
                    ...formData.position,
                    z: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Rotation (X, Y, Z)</h4>
          <div className="form-row">
            <div className="form-group-inline">
              <label>X</label>
              <input
                type="number"
                step="0.1"
                value={formData.rotation?.x || 0}
                onChange={(e) =>
                  handleChange('rotation', {
                    ...formData.rotation,
                    x: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="form-group-inline">
              <label>Y</label>
              <input
                type="number"
                step="0.1"
                value={formData.rotation?.y || 0}
                onChange={(e) =>
                  handleChange('rotation', {
                    ...formData.rotation,
                    y: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="form-group-inline">
              <label>Z</label>
              <input
                type="number"
                step="0.1"
                value={formData.rotation?.z || 0}
                onChange={(e) =>
                  handleChange('rotation', {
                    ...formData.rotation,
                    z: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="form-group metadata-info">
          <label>Created</label>
          <div className="info-text">
            {formData.createdAt
              ? new Date(formData.createdAt).toLocaleString()
              : 'N/A'}
          </div>
        </div>

        <div className="form-group metadata-info">
          <label>Last Modified</label>
          <div className="info-text">
            {formData.modifiedAt
              ? new Date(formData.modifiedAt).toLocaleString()
              : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
