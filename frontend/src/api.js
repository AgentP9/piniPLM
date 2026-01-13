const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2024';

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
};
