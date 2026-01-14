// Shared configuration and utilities for 3D rendering

// API URL configuration (shared with api.js)
export const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:2024`
  : (import.meta.env.VITE_API_URL || 'http://localhost:2024');

// Material configuration utility
export const getMaterialProps = (color, isSelected, hovered) => ({
  color: isSelected ? '#ff6b6b' : (hovered ? '#4dabf7' : color),
  emissive: isSelected ? '#ff6b6b' : '#000000',
  emissiveIntensity: isSelected ? 0.3 : 0,
});
