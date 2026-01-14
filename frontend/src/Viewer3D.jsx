import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, TransformControls } from '@react-three/drei';
import Model3D from './Model3D';

// Component representing a 3D object
function Component3D({ id, position, rotation, isSelected, onSelect, color, filename }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);

  return (
    <group position={position} rotation={rotation}>
      <group
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <Model3D 
          filename={filename}
          color={color}
          isSelected={isSelected}
          hovered={hovered}
        />
      </group>
    </group>
  );
}

// Transform controls wrapper
function TransformableComponent({ id, position, rotation, isSelected, onTransformEnd, filename }) {
  const transformRef = useRef();
  const groupRef = useRef();

  useEffect(() => {
    if (transformRef.current && groupRef.current) {
      const controls = transformRef.current;
      const callback = () => {
        if (groupRef.current) {
          const newPosition = {
            x: groupRef.current.position.x,
            y: groupRef.current.position.y,
            z: groupRef.current.position.z,
          };
          const newRotation = {
            x: groupRef.current.rotation.x,
            y: groupRef.current.rotation.y,
            z: groupRef.current.rotation.z,
          };
          onTransformEnd(id, newPosition, newRotation);
        }
      };
      controls.addEventListener('dragging-changed', callback);
      return () => controls.removeEventListener('dragging-changed', callback);
    }
  }, [id, onTransformEnd]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {isSelected && <TransformControls ref={transformRef} mode="translate" />}
      <Model3D 
        filename={filename}
        color={isSelected ? '#ff6b6b' : '#4dabf7'}
        isSelected={isSelected}
        hovered={false}
      />
    </group>
  );
}

// Main 3D Viewer component
export default function Viewer3D({ instances = [], selectedId, onSelectComponent, onTransformEnd }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ background: '#1a1a1a' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* Grid helper */}
        <gridHelper args={[20, 20, '#444444', '#222222']} />
        
        {/* Render all instances (root parts and child instances) */}
        {instances.map((instance) => {
          const pos = [
            instance.position?.x || 0,
            instance.position?.y || 0,
            instance.position?.z || 0,
          ];
          const rot = [
            instance.rotation?.x || 0,
            instance.rotation?.y || 0,
            instance.rotation?.z || 0,
          ];
          
          if (instance.renderKey === selectedId && onTransformEnd) {
            return (
              <TransformableComponent
                key={instance.renderKey}
                id={instance.renderKey}
                position={pos}
                rotation={rot}
                isSelected={true}
                onTransformEnd={onTransformEnd}
                filename={instance.filename}
              />
            );
          }
          
          return (
            <Component3D
              key={instance.renderKey}
              id={instance.renderKey}
              name={instance.displayName}
              position={pos}
              rotation={rot}
              isSelected={instance.renderKey === selectedId}
              onSelect={onSelectComponent}
              color={instance.color || '#4dabf7'}
              filename={instance.filename}
            />
          );
        })}
        
        <OrbitControls makeDefault />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        <div>Navigation: Left click + drag to rotate</div>
        <div>Right click + drag to pan</div>
        <div>Scroll to zoom</div>
        <div>Select component to move/rotate</div>
      </div>
    </div>
  );
}
