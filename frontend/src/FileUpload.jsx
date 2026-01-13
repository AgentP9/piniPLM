import React, { useRef, useState } from 'react';
import './FileUpload.css';

export default function FileUpload({ onUpload }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="file-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jt,.obj,.stl,.gltf,.glb"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
      <div
        className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${
          uploading ? 'uploading' : ''
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        {uploading ? (
          <>
            <div className="upload-spinner"></div>
            <p>Uploading...</p>
          </>
        ) : (
          <>
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              Click or drag & drop to upload JT file
            </p>
            <p className="upload-hint">
              Supported formats: .jt, .obj, .stl, .gltf, .glb
            </p>
          </>
        )}
      </div>
    </div>
  );
}
