import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Camera path — Catmull-Rom spline from tight cockpit to 3/4 hero    */
/*  Each point: { pos: [x,y,z], look: [x,y,z], fov }                  */
/*  Tune these once the real model is confirmed in place.             */
/* ------------------------------------------------------------------ */
const CAMERA_KEYFRAMES = [
  // 0.00 — inside cabin, tight on dash/wheel, shallow FOV (claustrophobic)
  { pos: [0.15, 0.95, 0.25], look: [0.0, 0.85, -0.4], fov: 32 },
  // 0.12 — still inside, slight push toward windshield
  { pos: [0.05, 1.0, 0.45], look: [0.0, 0.9, -1.0], fov: 35 },
  // 0.28 — breaking through the glass, hood comes into view
  { pos: [-0.3, 1.15, 1.6], look: [0.0, 0.7, -2.0], fov: 40 },
  // 0.42 — front 3/4, grille + lip flare
  { pos: [-1.8, 1.0, 3.0], look: [0.0, 0.55, 0.5], fov: 42 },
  // 0.58 — side profile sweep, side skirts flare
  { pos: [-4.2, 0.9, 1.2], look: [0.0, 0.5, -0.5], fov: 40 },
  // 0.74 — rear 3/4, diffuser + spoiler flare
  { pos: [-3.6, 0.85, -3.4], look: [0.2, 0.5, -1.0], fov: 38 },
  // 1.00 — final hero rest position, full car 3/4 angle
  { pos: [-3.0, 1.2, 4.2], look: [0.0, 0.6, 0.0], fov: 36 },
];

function catmullRomVec3Array(points) {
  const vecs = points.map((p) => new THREE.Vector3(...p));
  return new THREE.CatmullRomCurve3(vecs, false, 'catmullrom', 0.5);
}

const posCurve = catmullRomVec3Array(CAMERA_KEYFRAMES.map((k) => k.pos));
const lookCurve = catmullRomVec3Array(CAMERA_KEYFRAMES.map((k) => k.look));
const fovs = CAMERA_KEYFRAMES.map((k) => k.fov);

function fovAt(t) {
  const n = fovs.length - 1;
  const seg = Math.min(Math.floor(t * n), n - 1);
  const localT = t * n - seg;
  return THREE.MathUtils.lerp(fovs[seg], fovs[seg + 1], localT);
}

/* ------------------------------------------------------------------ */
/*  Part flare map — mesh-name substrings to flare at specific          */
/*  progress windows, matching the brief's "physical sequence" idea    */
/* ------------------------------------------------------------------ */
const FLARE_WINDOWS = [
  { match: /hood/i, start: 0.30, end: 0.42 },
  { match: /grille/i, start: 0.34, end: 0.46 },
  { match: /kit0_carbon|carbon/i, start: 0.40, end: 0.58 }, // front lip / carbon kit
  { match: /wing/i, start: 0.66, end: 0.80 }, // spoiler
];

function CarModel({ progress, onFlareTargets }) {
  const { scene } = useGLTF('/models/m4_placeholder.glb');
  const flareMeshes = useRef([]);

  // Walk the scene once, tag materials, collect flare targets
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const targets = [];

    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;

      // Boost material realism: carbon should read matte, paint glossy
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

  // Idle breathing rotation when not actively scrolling (handled by parent via small offset)
  return <primitive object={clonedScene} scale={1} position={[0, -0.05, 0]} />;
}

function RigCamera({ progress }) {
  const { camera } = useThree();
  const smoothed = useRef(0);

  useFrame(() => {
    // Ease camera progress toward scroll progress for weighty, non-jittery motion
    smoothed.current = THREE.MathUtils.lerp(smoothed.current, progress, 0.08);
    const t = smoothed.current;

    const pos = posCurve.getPoint(t);
    const look = lookCurve.getPoint(t);

    camera.position.copy(pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(look);
    if (camera.isPerspectiveCamera) {
      camera.fov = fovAt(t);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

function FlareLights({ progress, flareTargets }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    flareTargets.forEach(({ mesh, start, end }, i) => {
      if (!mesh.material) return;
      const inWindow = progress >= start && progress <= end + 0.04;
      const localT = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
      // pulse curve: rises then settles, like a quick flare not a steady glow
      const pulse = inWindow ? Math.sin(localT * Math.PI) * 0.9 : 0;
      const targetEmissive = pulse;
      if (mesh.material.emissive) {
        mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
          mesh.material.emissiveIntensity || 0,
          targetEmissive,
          0.15
        );
        if (!mesh.material.emissive.getHex()) {
          mesh.material.emissive = new THREE.Color('#d98a3d'); // warm amber flare
        }
      }
    });
  });

  return <group ref={groupRef} />;
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.25} color="#1a1410" />
      {/* Key rim light — warm, raking across the car */}
      <directionalLight
        position={[-6, 4, 2]}
        intensity={2.2}
        color="#e8a558"
        castShadow
      />
      {/* Cool fill from "outside world" steel blue */}
      <directionalLight position={[5, 3, -4]} intensity={0.5} color="#5a7a9a" />
      {/* Low warm bounce, like cabin ambience */}
      <pointLight position={[0, 0.6, 0]} intensity={0.4} color="#c47a32" distance={4} />
    </>
  );
}

export default function CarScene({ progress }) {
  const flareTargetsRef = useRef([]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ fov: 32, near: 0.05, far: 100 }}
    >
      <color attach="background" args={['#0a0807']} />
      <fog attach="fog" args={['#0a0807', 8, 22]} />
      <SceneLighting />
      <Environment preset="city" />

      <React.Suspense fallback={null}>
        <CarModel
          progress={progress}
          onFlareTargets={(targets) => (flareTargetsRef.current = targets)}
        />
      </React.Suspense>

      <RigCamera progress={progress} />
      <FlareLights progress={progress} flareTargets={flareTargetsRef.current} />
    </Canvas>
  );
}
