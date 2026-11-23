// Interactive 3D Python Workshop Core powered by Three.js.
// Provides a physical, tangible 3D computing artifact for the child dashboard.
// Features dual-mesh geometry (crystalline inner core + glowing mint wireframe lattice),
// orbiting particle constellation, mouse parallax tilt, drag-to-spin, and click pulse reactions.
// Fully responsive, respects prefers-reduced-motion, and cleanly disposes WebGL resources on unmount.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buzz } from '../ui/fx';

export function WorkshopCore3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 280;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch {
      // Fallback if WebGL is unavailable
      return;
    }

    container.appendChild(renderer.domElement);

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffd66b, 2.5, 20); // Butter warm gold
    pointLight.position.set(3, 3, 4);
    scene.add(pointLight);

    const rimLight = new THREE.PointLight(0x7be0c3, 2.0, 20); // Mint rim light
    rimLight.position.set(-3, -2, 3);
    scene.add(rimLight);

    // ── Central 3D Group: Dual Polyhedral Core ──
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Inner Crystalline Polyhedron (Icosahedron)
    const innerGeometry = new THREE.IcosahedronGeometry(1.4, 0);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x162a26,
      roughness: 0.25,
      metalness: 0.85,
      emissive: 0x0f2923,
      flatShading: true,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    coreGroup.add(innerMesh);

    // 2. Outer Glowing Wireframe Lattice
    const wireGeometry = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.6, 1));
    const wireMaterial = new THREE.LineBasicMaterial({
      color: 0x7be0c3, // Mint
      transparent: true,
      opacity: 0.75,
      linewidth: 1.5,
    });
    const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial);
    coreGroup.add(wireframe);

    // 3. Orbiting Code Sparks (Particle Swarm)
    const particleCount = 48;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.0 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffd66b, // Butter
      size: 0.08,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    coreGroup.add(particles);

    // ── Interaction & Drag State ──
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;
    let pulseScale = 1.0;
    let animationFrameId: number;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      setIsInteracting(true);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) {
        // Parallax mouse tilt when hovering
        const rect = container.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetRotationY = normX * 0.35;
        targetRotationX = normY * 0.35;
        return;
      }

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      coreGroup.rotation.y += deltaX * 0.012;
      coreGroup.rotation.x += deltaY * 0.012;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
      setIsInteracting(false);
    };

    const onClick = () => {
      buzz(12);
      pulseScale = 1.18;
      pointLight.intensity = 4.5;
    };

    const domEl = renderer.domElement;
    domEl.style.cursor = 'grab';
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('click', onClick);

    // ── Responsive Resize ──
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // ── Animation Loop ──
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Natural idle rotation (unless dragging or reduced motion)
      if (!isDragging && !prefersReducedMotion) {
        coreGroup.rotation.y += 0.007;
        coreGroup.rotation.x += 0.003;
        particles.rotation.y -= 0.004;
      }

      // Parallax easing
      currentRotationX += (targetRotationX - currentRotationX) * 0.08;
      currentRotationY += (targetRotationY - currentRotationY) * 0.08;
      if (!isDragging) {
        coreGroup.rotation.x += currentRotationX * 0.05;
        coreGroup.rotation.y += currentRotationY * 0.05;
      }

      // Pulse recovery
      if (pulseScale > 1.001) {
        pulseScale += (1.0 - pulseScale) * 0.1;
        coreGroup.scale.set(pulseScale, pulseScale, pulseScale);
        pointLight.intensity += (2.5 - pointLight.intensity) * 0.08;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── Clean Up ──
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('click', onClick);

      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }

      innerGeometry.dispose();
      innerMaterial.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className={`workshop-3d-wrapper${isInteracting ? ' is-active' : ''}`}
      aria-label="Interactive 3D Python Core. Drag to rotate or click to pulse."
      title="Interactive 3D Stage Core · Drag to rotate or tap to pulse"
    >
      <div className="workshop-3d-canvas-box" ref={mountRef} />
      <div className="workshop-3d-meta">
        <span className="workshop-3d-tag">3D Stage Core</span>
        <span className="workshop-3d-hint">
          {isInteracting ? 'Rotating 3D core' : 'Drag to spin · Tap to pulse'}
        </span>
      </div>
    </div>
  );
}
