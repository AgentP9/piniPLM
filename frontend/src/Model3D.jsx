import React, { useRef, useEffect, Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

// Get API URL
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:2024`
  : (import.meta.env.VITE_API_URL || 'http://localhost:2024');

// Component to load and display OBJ files
function OBJModel({ url, color, isSelected, hovered }) {
  const obj = useLoader(OBJLoader, url);
  const groupRef = useRef();

  useEffect(() => {
    if (obj && groupRef.current) {
      // Center the model
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      obj.position.set(-center.x, -center.y, -center.z);

      // Apply material to all meshes
      obj.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: isSelected ? '#ff6b6b' : (hovered ? '#4dabf7' : color),
            emissive: isSelected ? '#ff6b6b' : '#000000',
            emissiveIntensity: isSelected ? 0.3 : 0,
          });
        }
      });
    }
  }, [obj, color, isSelected, hovered]);

  return <primitive ref={groupRef} object={obj} />;
}

// Component to load and display STL files
function STLModel({ url, color, isSelected, hovered }) {
  const geometry = useLoader(STLLoader, url);

  // Center the geometry
  geometry.center();

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial 
        color={isSelected ? '#ff6b6b' : (hovered ? '#4dabf7' : color)}
        emissive={isSelected ? '#ff6b6b' : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
    </mesh>
  );
}

// Component to load and display GLTF/GLB files
function GLTFModel({ url, color, isSelected, hovered }) {
  const gltf = useLoader(GLTFLoader, url);
  const groupRef = useRef();

  useEffect(() => {
    if (gltf && gltf.scene && groupRef.current) {
      // Center the model
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      gltf.scene.position.set(-center.x, -center.y, -center.z);

      // Apply material to all meshes
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: isSelected ? '#ff6b6b' : (hovered ? '#4dabf7' : color),
            emissive: isSelected ? '#ff6b6b' : '#000000',
            emissiveIntensity: isSelected ? 0.3 : 0,
          });
        }
      });
    }
  }, [gltf, color, isSelected, hovered]);

  return <primitive ref={groupRef} object={gltf.scene} />;
}

// Fallback component (Box) for unsupported formats or loading errors
function FallbackBox({ color, isSelected, hovered }) {
  return (
    <Box args={[1, 1, 1]}>
      <meshStandardMaterial 
        color={isSelected ? '#ff6b6b' : (hovered ? '#4dabf7' : color)}
        emissive={isSelected ? '#ff6b6b' : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
    </Box>
  );
}

// Main Model3D component that determines which loader to use
export default function Model3D({ filename, color, isSelected, hovered }) {
  if (!filename) {
    // No file, use fallback box
    return <FallbackBox color={color} isSelected={isSelected} hovered={hovered} />;
  }

  const fileUrl = `${API_URL}/uploads/${filename}`;
  const extension = filename.split('.').pop().toLowerCase();

  // Select appropriate loader based on file extension
  if (extension === 'obj') {
    return (
      <Suspense fallback={<FallbackBox color={color} isSelected={isSelected} hovered={hovered} />}>
        <OBJModel 
          url={fileUrl} 
          color={color} 
          isSelected={isSelected} 
          hovered={hovered}
        />
      </Suspense>
    );
  } else if (extension === 'stl') {
    return (
      <Suspense fallback={<FallbackBox color={color} isSelected={isSelected} hovered={hovered} />}>
        <STLModel 
          url={fileUrl} 
          color={color} 
          isSelected={isSelected} 
          hovered={hovered}
        />
      </Suspense>
    );
  } else if (extension === 'gltf' || extension === 'glb') {
    return (
      <Suspense fallback={<FallbackBox color={color} isSelected={isSelected} hovered={hovered} />}>
        <GLTFModel 
          url={fileUrl} 
          color={color} 
          isSelected={isSelected} 
          hovered={hovered}
        />
      </Suspense>
    );
  } else if (extension === 'jt') {
    // JT format is not supported by Three.js
    // Display a box with a warning
    console.warn('JT format is not supported. Please convert to OBJ, STL, GLTF, or GLB format.');
    return <FallbackBox color={color} isSelected={isSelected} hovered={hovered} />;
  } else {
    // Unknown format, use fallback
    return <FallbackBox color={color} isSelected={isSelected} hovered={hovered} />;
  }
}
