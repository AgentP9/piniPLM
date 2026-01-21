import React, { useRef, useEffect, Suspense, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { API_URL, getMaterialProps } from './renderUtils';
import ErrorBoundary from './ErrorBoundary';

// Component to load and display OBJ files
function OBJModel({ url, color, isSelected, hovered }) {
  const obj = useLoader(OBJLoader, url, 
    undefined, // onProgress
    undefined, // onLoad
    (error) => {
      console.error('Failed to load OBJ file:', url, error);
    }
  );
  const groupRef = useRef();
  const materialProps = useMemo(() => getMaterialProps(color, isSelected, hovered), [color, isSelected, hovered]);

  useEffect(() => {
    if (obj) {
      console.log('OBJ loaded successfully:', url);
      
      if (groupRef.current) {
        // Center the model
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        obj.position.set(-center.x, -center.y, -center.z);

        // Apply material to all meshes
        obj.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial(materialProps);
          }
        });
      }
    }
  }, [obj, materialProps, url]);

  return <primitive ref={groupRef} object={obj} />;
}

// Component to load and display STL files
function STLModel({ url, color, isSelected, hovered }) {
  const geometry = useLoader(STLLoader, url);
  const materialProps = useMemo(() => getMaterialProps(color, isSelected, hovered), [color, isSelected, hovered]);

  // Center the geometry
  geometry.center();

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}

// Component to load and display GLTF/GLB files
function GLTFModel({ url, color, isSelected, hovered }) {
  const gltf = useLoader(GLTFLoader, url);
  const groupRef = useRef();
  const materialProps = useMemo(() => getMaterialProps(color, isSelected, hovered), [color, isSelected, hovered]);

  useEffect(() => {
    if (gltf && gltf.scene && groupRef.current) {
      // Center the model
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      gltf.scene.position.set(-center.x, -center.y, -center.z);

      // Apply material to all meshes
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial(materialProps);
        }
      });
    }
  }, [gltf, materialProps]);

  return <primitive ref={groupRef} object={gltf.scene} />;
}

// Fallback component (Box) for unsupported formats or loading errors
function FallbackBox({ color, isSelected, hovered }) {
  const materialProps = useMemo(() => getMaterialProps(color, isSelected, hovered), [color, isSelected, hovered]);
  
  return (
    <Box args={[1, 1, 1]}>
      <meshStandardMaterial {...materialProps} />
    </Box>
  );
}

// Main Model3D component that determines which loader to use
export default function Model3D({ filename, color, isSelected, hovered }) {
  if (!filename) {
    // No file, use fallback box
    console.warn('No filename provided, using fallback box');
    return <FallbackBox color={color} isSelected={isSelected} hovered={hovered} />;
  }

  const fileUrl = `${API_URL}/uploads/${filename}`;
  const extension = filename ? filename.split('.').pop().toLowerCase() : '';

  if (!extension) {
    console.warn('No file extension found for:', filename);
    return <FallbackBox color={color} isSelected={isSelected} hovered={hovered} />;
  }

  console.log('Loading 3D model:', { filename, extension, fileUrl });

  // Select appropriate loader based on file extension
  if (extension === 'obj') {
    return (
      <ErrorBoundary fallback={<FallbackBox color={color} isSelected={isSelected} hovered={hovered} />}>
        <Suspense fallback={<FallbackBox color={color} isSelected={isSelected} hovered={hovered} />}>
          <OBJModel 
            url={fileUrl} 
            color={color} 
            isSelected={isSelected} 
            hovered={hovered}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else if (extension === 'stl') {
    return (
      <ErrorBoundary fallback={<FallbackBox color={color} isSelected={isSelected} hovered={hovered} />}>
        <Suspense fallback={<FallbackBox color={color} isSelected={isSelected} hovered={hovered} />}>
          <STLModel 
            url={fileUrl} 
            color={color} 
            isSelected={isSelected} 
            hovered={hovered}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else if (extension === 'gltf' || extension === 'glb') {
    return (
      <ErrorBoundary fallback={<FallbackBox color={color} isSelected={isSelected} hovered={hovered} />}>
        <Suspense fallback={<FallbackBox color={color} isSelected={isSelected} hovered={hovered} />}>
          <GLTFModel 
            url={fileUrl} 
            color={color} 
            isSelected={isSelected} 
            hovered={hovered}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } else if (extension === 'jt') {
    // JT format is not supported by Three.js
    // Display a box with a warning
    console.warn('JT format is not supported. Please convert to OBJ, STL, GLTF, or GLB format.');
    return <FallbackBox color={color} isSelected={isSelected} hovered={hovered} />;
  } else {
    // Unknown format, use fallback
    console.warn('Unknown file format:', extension);
    return <FallbackBox color={color} isSelected={isSelected} hovered={hovered} />;
  }
}
