import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Car sits centered, always. It rotates idly on its own, tilts      */
/*  toward the cursor, and reveals different angles as you scroll —   */
/*  front 3/4, side profile, rear 3/4 — flaring carbon parts as each   */
/*  angle settles. No camera path through cabin geometry at all.      */
/* ------------------------------------------------------------------ */

// Scroll progress maps to these target Y-rotations (radians) for the car itself.
// Car starts front-ish, sweeps through side, ends rear 3/4.
const ROTATION_STOPS = [
  { t: 0.0,  ry: 0.35 },   // front 3/4
  { t: 0.30, ry: 1.55 },   // side profile
  { t: 0.62, ry: 2.6  },   // rear 3/4
  { t: 1.0,  ry: 3.5  },   // final hero rear-side angle
];

function rotationAt(t) {
  const stops = ROTATION_STOPS;
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      const localT = (t - stops[i].t) / (stops[i + 1].t - stops[i].t);
      const eased = localT * localT * (3 - 2 * localT); // smoothstep
      return THREE.MathUtils.lerp(stops[i].ry, stops[i + 1].ry, eased);
    }
  }
  return stops[stops.length - 1].ry;
}

// Carbon parts to flare as their "good angle" comes into view during the sweep
const FLARE_WINDOWS = [
  { match: /hood/i, start: 0.0, end: 0.18 },
  { match: /grille/i, start: 0.0, end: 0.2 },
  { match: /kit0_carbon|carbon/i, start: 0.22, end: 0.5 },
  { match: /wing/i, start: 0.55, end: 0.85 },
];

function CarModel({ progress, mouse, onFlareTargets }) {
  const { scene } = useGLTF('/models/m4_placeholder.glb');
  const groupRef = useRef();
  const tiltCurrent = useRef({ x: 0, y: 0 });
  const baseRotation = useRef(0);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const targets = [];

    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;

      if (child.material) {
        const mat = child.material;
        const name = (child.name || '') + ' ' + (mat.name || '');
        if (/carbon/i.test(name)) {
          mat.roughness = 0.55;
          mat.metalness = 0.15;
          mat.envMapIntensity = 0.6;
        } else if (/paint|base|coloured/i.test(name)) {
          mat.roughness = 0.18;
          mat.metalness = 0.55;
          mat.envMapIntensity = 1.4;
        } else if (/glass/i.test(name)) {
          mat.roughness = 0.05;
          mat.metalness = 0;
          mat.transparent = true;
          mat.opacity = 0.85;
        }
      }

      for (const f of FLARE_WINDOWS) {
        if (f.match.test(child.name)) {
          targets.push({ mesh: child, ...f });
        }
      }
    });

    onFlareTargets?.(targets);
    return clone;
  }, [scene, onFlareTargets]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Scroll-driven base rotation (the "reveal sweep")
    baseRotation.current = THREE.MathUtils.lerp(
      baseRotation.current,
      rotationAt(progress),
      0.06
    );

    // Idle breathing rotation layered on top — slow, alive, patient
    const idle = Math.sin(state.clock.elapsedTime * 0.15) * 0.03;

    // Cursor magnetism — tilt toward pointer, max ~15deg, weighted return
    const targetTiltY = mouse.current.x * 0.26; // ~15deg max
    const targetTiltX = -mouse.current.y * 0.14; // ~8deg max, gentler vertically
    tiltCurrent.current.x = THREE.MathUtils.lerp(tiltCurrent.current.x, targetTiltX, 0.05);
    tiltCurrent.current.y = THREE.MathUtils.lerp(tiltCurrent.current.y, targetTiltY, 0.05);

    groupRef.current.rotation.y = baseRotation.current + idle + tiltCurrent.current.y;
    groupRef.current.rotation.x = tiltCurrent.current.x;
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={1} position={[0, 0, 0]} />
    </group>
  );
}

function FlareLights({ progress, flareTargets }) {
  useFrame(() => {
    flareTargets.forEach(({ mesh, start, end }) => {
      if (!mesh.material) return;
      const inWindow = progress >= start && progress <= end + 0.04;
      const localT = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
      const pulse = inWindow ? Math.sin(localT * Math.PI) * 0.9 : 0;
      if (!mesh.material.emissive) {
        mesh.material.emissive = new THREE.Color('#d98a3d');
      }
      mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
        mesh.material.emissiveIntensity || 0,
        pulse,
        0.15
      );
    });
  });
  return null;
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.3} color="#1a1410" />
      <directionalLight position={[-12, 8, 4]} intensity={2.2} color="#e8a558" castShadow />
      <directionalLight position={[10, 6, -8]} intensity={0.5} color="#5a7a9a" />
      <pointLight position={[0, 3, 8]} intensity={0.5} color="#c47a32" distance={20} />
    </>
  );
}

function FixedCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 2.2, 19);
    camera.lookAt(0, -0.2, 0);
    if (camera.isPerspectiveCamera) {
      camera.fov = 32;
      camera.updateProjectionMatrix();
    }
  }, [camera]);
  return null;
}

export default function CarScene({ progress }) {
  const flareTargetsRef = useRef([]);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function handleMove(e) {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ fov: 32, near: 0.1, far: 200 }}
    >
      <color attach="background" args={['#0a0807']} />
      <fog attach="fog" args={['#0a0807', 22, 55]} />
      <SceneLighting />
      <Environment preset="city" />

      <React.Suspense fallback={null}>
        <CarModel
          progress={progress}
          mouse={mouse}
          onFlareTargets={(targets) => (flareTargetsRef.current = targets)}
        />
      </React.Suspense>

      <FixedCamera />
      <FlareLights progress={progress} flareTargets={flareTargetsRef.current} />
    </Canvas>
  );
}
