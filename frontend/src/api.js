// Use relative URL for API calls when in production (same host)
// or allow override via environment variable
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:2024`
  : (import.meta.env.VITE_API_URL || 'http://localhost:2024');

export const api = {
  // Upload file
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  // Get all files
  getFiles: async () => {
    const response = await fetch(`${API_URL}/api/files`);
    return response.json();
  },

  // Get metadata
  getMetadata: async (id) => {
    const response = await fetch(`${API_URL}/api/metadata/${id}`);
    return response.json();
  },

  // Get all metadata
  getAllMetadata: async () => {
    const response = await fetch(`${API_URL}/api/metadata`);
    return response.json();
  },

  // Update metadata
  updateMetadata: async (id, data) => {
    const response = await fetch(`${API_URL}/api/metadata/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Update transform
  updateTransform: async (id, transform) => {
    const response = await fetch(`${API_URL}/api/transform/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transform),
    });
    return response.json();
  },

  // Delete file
  deleteFile: async (id) => {
    const response = await fetch(`${API_URL}/api/files/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Add child part to parent
  addChildPart: async (parentId, childId, position, rotation) => {
    const response = await fetch(`${API_URL}/api/parts/${parentId}/children`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, position, rotation }),
    });
    return response.json();
  },

  // Remove child part from parent
  removeChildPart: async (parentId, childId) => {
    const response = await fetch(`${API_URL}/api/parts/${parentId}/children/${childId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Replace child part in parent
  replaceChildPart: async (parentId, oldChildId, newChildId, position, rotation) => {
    const response = await fetch(`${API_URL}/api/parts/${parentId}/children/${oldChildId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newChildId, position, rotation }),
    });
    return response.json();
  },

  // Update child relationship data
  updateChildRelation: async (parentId, childId, position, rotation) => {
    const response = await fetch(`${API_URL}/api/parts/${parentId}/children/${childId}/relation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position, rotation }),
    });
    return response.json();
  },
};
