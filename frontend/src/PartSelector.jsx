import React, { useState, useEffect } from 'react';
import './PartSelector.css';

export default function PartSelector({ parts, onSelect, onCancel, excludeIds = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredParts, setFilteredParts] = useState([]);

  // Filter parts based on search term and exclusions
  useEffect(() => {
    const availableParts = parts.filter(p => !excludeIds.includes(p.id));
    if (searchTerm.trim() === '') {
      setFilteredParts(availableParts);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredParts(
        availableParts.filter(p => 
          p.name.toLowerCase().includes(term) ||
          p.partNumber?.toLowerCase().includes(term) ||
          p.id.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, parts, excludeIds]);

  return (
    <div className="part-selector-overlay" onClick={onCancel}>
      <div className="part-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="part-selector-header">
          <h3>Select Part</h3>
          <button className="close-btn" onClick={onCancel}>✖</button>
        </div>
        
        <div className="part-selector-search">
          <input
            type="text"
            placeholder="Search by name, part number, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <div className="part-selector-list">
          {filteredParts.length === 0 ? (
            <div className="no-parts">No parts found</div>
          ) : (
            filteredParts.map(part => (
              <div
                key={part.id}
                className="part-item"
                onClick={() => onSelect(part)}
              >
                <div className="part-icon">📦</div>
                <div className="part-info">
                  <div className="part-name">{part.name}</div>
                  {part.partNumber && (
                    <div className="part-number">PN: {part.partNumber}</div>
                  )}
                  <div className="part-id">{part.id}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="part-selector-footer">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
