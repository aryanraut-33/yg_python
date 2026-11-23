// Interactive 3D "Micro-80 Cyber-Terminal" powered by Three.js.
// A tactile, retro-futuristic desktop computer terminal built specifically for Tinkora's Python workshop.
// Features:
// - Authentic beveled CRT monitor with curved phosphor glass face
// - Dynamic HTML5 Canvas texture displaying live typing Python REPL with blinking cursor and scanlines
// - Sculpted keyboard console with individual mechanical keycaps and an interactive golden-butter spacebar
// - Floppy drive slot with active mint read/write LED and power indicator
// - Interactive: mouse parallax tilt, full 360° drag-to-inspect orbit, click-to-type with keypress action & screen bloom
// - Respects prefers-reduced-motion and cleanly disposes all WebGL memory on unmount.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buzz } from '../ui/fx';

const CODE_SNIPPETS = [
  { prompt: '>>> player = "Aarohi"', out: 'Tinkora Studio: Aarohi active' },
  { prompt: '>>> def spark(): print("Code magic!")', out: 'Code magic! ✨' },
  { prompt: '>>> for star in range(3): print("★ " * 3)', out: '★ ★ ★\n★ ★ ★\n★ ★ ★' },
  { prompt: '>>> mars_rover.move(100)', out: 'Rover arrived at Crater Alpha! 🚀' },
  { prompt: '>>> stage.draw_circle(x=320, y=200, r=40)', out: 'Canvas shape rendered' },
  { prompt: '>>> while True: create_future()', out: 'Infinite imagination loop started' },
];

export function MicroTerminal3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Setup Scene, Camera, Renderer ──
    const scene = new THREE.Scene();

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 5.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
    } catch {
      return;
    }

    container.appendChild(renderer.domElement);

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0xf2f7f4, 0.9);
    scene.add(ambientLight);

    // Butter warm key light from upper right
    const keyLight = new THREE.DirectionalLight(0xffd66b, 2.4);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    // Mint rim light from left rear
    const rimLight = new THREE.PointLight(0x7be0c3, 2.0, 15);
    rimLight.position.set(-4, 2, -2);
    scene.add(rimLight);

    // Screen phosphor glow light pointing onto keyboard
    const screenGlow = new THREE.PointLight(0x7be0c3, 1.4, 4);
    screenGlow.position.set(0, 0.3, 1.1);
    scene.add(screenGlow);

    // ── Terminal Master Group ──
    const terminalGroup = new THREE.Group();
    // Start with a natural 3/4 isometric perspective
    terminalGroup.rotation.y = 0.28;
    terminalGroup.rotation.x = 0.12;
    scene.add(terminalGroup);

    // ── Shared Materials ──
    // Dark forest obsidian matte casing
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x132622,
      roughness: 0.55,
      metalness: 0.2,
    });

    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x0c1916,
      roughness: 0.7,
      metalness: 0.1,
    });

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x060e0c,
      roughness: 0.8,
    });

    const butterMat = new THREE.MeshStandardMaterial({
      color: 0xffd66b,
      roughness: 0.35,
      metalness: 0.25,
      emissive: 0x332600,
      emissiveIntensity: 0.4,
    });

    const mintMat = new THREE.MeshStandardMaterial({
      color: 0x7be0c3,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x163830,
      emissiveIntensity: 0.6,
    });

    // ── 1. Monitor Housing ──
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(0, 0.35, 0);
    // Slight tilt back
    monitorGroup.rotation.x = -0.06;
    terminalGroup.add(monitorGroup);

    // Main cabinet
    const cabinetGeo = new THREE.BoxGeometry(2.3, 1.9, 1.6);
    const cabinet = new THREE.Mesh(cabinetGeo, chassisMat);
    monitorGroup.add(cabinet);

    // Rear tapered housing
    const rearGeo = new THREE.BoxGeometry(1.8, 1.5, 0.6);
    const rear = new THREE.Mesh(rearGeo, darkAccentMat);
    rear.position.set(0, 0, -1.0);
    monitorGroup.add(rear);

    // Ventilation slots on top
    for (let i = 0; i < 5; i++) {
      const ventGeo = new THREE.BoxGeometry(1.5, 0.02, 0.08);
      const vent = new THREE.Mesh(ventGeo, darkAccentMat);
      vent.position.set(0, 0.96, -0.4 + i * 0.18);
      monitorGroup.add(vent);
    }

    // Front Bezel frame
    const bezelGeo = new THREE.BoxGeometry(2.14, 1.68, 0.12);
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.set(0, 0.04, 0.82);
    monitorGroup.add(bezel);

    // Power Indicator LED
    const pwrLedGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const pwrLedMat = new THREE.MeshStandardMaterial({
      color: 0xffd66b,
      emissive: 0xffd66b,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    const pwrLed = new THREE.Mesh(pwrLedGeo, pwrLedMat);
    pwrLed.position.set(0.88, -0.66, 0.89);
    monitorGroup.add(pwrLed);

    // Badge plate: "MICRO-80"
    const badgeGeo = new THREE.BoxGeometry(0.38, 0.08, 0.02);
    const badge = new THREE.Mesh(badgeGeo, darkAccentMat);
    badge.position.set(-0.72, -0.66, 0.89);
    monitorGroup.add(badge);

    // ── 2. Dynamic CRT Screen Face & Canvas Texture ──
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 768;
    const ctx = screenCanvas.getContext('2d')!;

    let currentSnippetIndex = 0;
    let snippetProgress = 0;
    let cursorVisible = true;
    let lastBlink = 0;
    let flashIntensity = 0;

    const renderScreenCanvas = () => {
      // Clear with deep phosphor green-slate
      ctx.fillStyle = '#071512';
      ctx.fillRect(0, 0, 1024, 768);

      // Flash pulse overlay when clicked
      if (flashIntensity > 0.02) {
        ctx.fillStyle = `rgba(123, 224, 195, ${flashIntensity * 0.35})`;
        ctx.fillRect(0, 0, 1024, 768);
      }

      // Scanline grid
      ctx.fillStyle = 'rgba(10, 30, 24, 0.55)';
      for (let y = 0; y < 768; y += 4) {
        ctx.fillRect(0, y, 1024, 2);
      }

      // Top system bar
      ctx.fillStyle = '#0e2922';
      ctx.fillRect(24, 24, 976, 52);
      ctx.fillStyle = '#7be0c3';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('● TINKORA MICRO-80 · PYTHON 3.12 · 64K RAM', 42, 58);

      ctx.fillStyle = '#ffd66b';
      ctx.font = '20px monospace';
      ctx.fillText('[ONLINE]', 890, 58);

      // Divider
      ctx.strokeStyle = '#1b4a3e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(24, 88);
      ctx.lineTo(1000, 88);
      ctx.stroke();

      // Terminal REPL contents
      const startY = 140;
      const lineHeight = 46;

      ctx.font = '24px "SF Mono", "Fira Code", monospace';

      // Welcome lines
      ctx.fillStyle = '#7be0c3';
      ctx.fillText('Tinkora Interactive REPL (Ready)', 42, startY);

      ctx.fillStyle = '#8fa39b';
      ctx.fillText('Type, click, or spin to inspect the terminal.', 42, startY + lineHeight);

      // Active Snippet
      const snippet = CODE_SNIPPETS[currentSnippetIndex];
      ctx.fillStyle = '#ffd66b';
      const promptToShow = snippet.prompt.slice(0, Math.floor(snippetProgress));
      ctx.fillText(promptToShow, 42, startY + lineHeight * 3);

      if (snippetProgress >= snippet.prompt.length) {
        ctx.fillStyle = '#7be0c3';
        const outLines = snippet.out.split('\n');
        outLines.forEach((ol, idx) => {
          ctx.fillText(`↳ ${ol}`, 42, startY + lineHeight * (4.2 + idx));
        });
      }

      // Cursor
      const cursorY =
        snippetProgress >= snippet.prompt.length
          ? startY + lineHeight * (4.5 + snippet.out.split('\n').length)
          : startY + lineHeight * 3;
      const cursorX =
        snippetProgress >= snippet.prompt.length
          ? 42
          : 42 + ctx.measureText(promptToShow).width + 6;

      if (cursorVisible) {
        ctx.fillStyle = '#7be0c3';
        ctx.fillRect(cursorX, cursorY - 22, 14, 26);
      }

      // Screen corner borders
      ctx.strokeStyle = '#7be0c3';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 976, 720);
    };

    renderScreenCanvas();

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.generateMipmaps = true;
    screenTexture.minFilter = THREE.LinearMipMapLinearFilter;

    // Curved CRT Screen Face Geometry
    const screenGeo = new THREE.PlaneGeometry(1.72, 1.28, 12, 12);
    // Apply subtle barrel curvature along Z for realistic vintage curved glass
    const pos = screenGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const distSq = (x * x) / (0.86 * 0.86) + (y * y) / (0.64 * 0.64);
      pos.setZ(i, -distSq * 0.07);
    }
    screenGeo.computeVertexNormals();

    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
      toneMapped: false,
    });

    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0.08, 0.88);
    monitorGroup.add(screenMesh);

    // ── 3. Keyboard Console & Chassis Deck ──
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(0, -0.92, 0.55);
    consoleGroup.rotation.x = 0.2; // Angled ergonomic wedge
    terminalGroup.add(consoleGroup);

    // Console main base
    const consoleBaseGeo = new THREE.BoxGeometry(2.4, 0.32, 1.4);
    const consoleBase = new THREE.Mesh(consoleBaseGeo, chassisMat);
    consoleGroup.add(consoleBase);

    // Keyboard well
    const keyWellGeo = new THREE.BoxGeometry(2.18, 0.08, 1.15);
    const keyWell = new THREE.Mesh(keyWellGeo, bezelMat);
    keyWell.position.set(0, 0.15, 0);
    consoleGroup.add(keyWell);

    // Keycaps Matrix (4 Rows)
    const keyGroup = new THREE.Group();
    consoleGroup.add(keyGroup);

    const keyCapMat = new THREE.MeshStandardMaterial({
      color: 0x18332c,
      roughness: 0.6,
      metalness: 0.15,
    });

    const numRows = 3;
    const numCols = 9;
    const keyW = 0.18;
    const keyH = 0.08;
    const keyD = 0.18;
    const spacingX = 0.22;
    const spacingZ = 0.22;
    const startX = -((numCols - 1) * spacingX) / 2;
    const startZ = -0.32;

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const keyCapGeo = new THREE.BoxGeometry(keyW, keyH, keyD);
        const keyMesh = new THREE.Mesh(keyCapGeo, keyCapMat);
        keyMesh.position.set(
          startX + c * spacingX + (r % 2 === 1 ? 0.08 : 0),
          0.21,
          startZ + r * spacingZ,
        );
        keyGroup.add(keyMesh);
      }
    }

    // Interactive Golden Spacebar
    const spacebarGeo = new THREE.BoxGeometry(0.95, 0.09, 0.22);
    const spacebar = new THREE.Mesh(spacebarGeo, butterMat);
    spacebar.position.set(0, 0.21, 0.38);
    consoleGroup.add(spacebar);

    // Floppy Drive Bay (Bottom Right)
    const floppySlotGeo = new THREE.BoxGeometry(0.55, 0.04, 0.04);
    const floppySlot = new THREE.Mesh(floppySlotGeo, darkAccentMat);
    floppySlot.position.set(0.72, 0.02, 0.68);
    consoleGroup.add(floppySlot);

    // Floppy Activity LED (blinks green on interact)
    const floppyLedGeo = new THREE.SphereGeometry(0.035, 12, 12);
    const floppyLed = new THREE.Mesh(floppyLedGeo, mintMat);
    floppyLed.position.set(0.38, 0.02, 0.68);
    consoleGroup.add(floppyLed);

    // ── 4. Floating Syntax Sparks (Particle Dust) ──
    const particleCount = 42;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 1.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffd66b,
      size: 0.065,
      transparent: true,
      opacity: 0.75,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    terminalGroup.add(particles);

    // ── Interaction State ──
    let isDragging = false;
    let previousPointer = { x: 0, y: 0 };
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let spacebarDip = 0;
    let animationFrameId: number;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      setIsInteracting(true);
      previousPointer = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) {
        // Subtle mouse parallax tilt when hovering
        const rect = container.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetTiltY = normX * 0.3;
        targetTiltX = normY * 0.25;
        return;
      }

      // Drag to inspect 360°
      const deltaX = e.clientX - previousPointer.x;
      const deltaY = e.clientY - previousPointer.y;

      terminalGroup.rotation.y += deltaX * 0.012;
      terminalGroup.rotation.x += deltaY * 0.012;

      previousPointer = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
      setIsInteracting(false);
    };

    // User clicked the terminal: triggers mechanical sound, spacebar press, screen flash & new code
    const triggerCodeSpark = () => {
      buzz(14);
      spacebarDip = 0.05;
      flashIntensity = 0.8;
      screenGlow.intensity = 2.8;

      // Cycle or advance snippet
      currentSnippetIndex = (currentSnippetIndex + 1) % CODE_SNIPPETS.length;
      snippetProgress = 0;
      setTypedCount((c) => c + 1);
    };

    const domEl = renderer.domElement;
    domEl.style.cursor = 'grab';
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('click', triggerCodeSpark);

    // ── Resize Observer ──
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
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Typing progression
      const activeSnippet = CODE_SNIPPETS[currentSnippetIndex];
      if (snippetProgress < activeSnippet.prompt.length) {
        snippetProgress += delta * 18; // 18 chars per second typing speed
      }

      // Cursor blinking
      if (elapsed - lastBlink > 0.45) {
        cursorVisible = !cursorVisible;
        lastBlink = elapsed;
      }

      // Flash & spacebar bounce recovery
      if (flashIntensity > 0.01) {
        flashIntensity *= 0.88;
        screenGlow.intensity = 1.4 + flashIntensity * 1.5;
      }
      if (spacebarDip > 0.001) {
        spacebarDip *= 0.85;
      }
      spacebar.position.y = 0.21 - spacebarDip;

      // Floppy LED activity flicker
      (floppyLed.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.5 + Math.sin(elapsed * 8) * 0.4;

      // Update Screen Canvas Texture
      renderScreenCanvas();
      screenTexture.needsUpdate = true;

      // Idle drift / parallax
      if (!isDragging && !prefersReducedMotion) {
        terminalGroup.rotation.y += 0.003;
        particles.rotation.y -= 0.002;
      }

      // Parallax damping
      currentTiltX += (targetTiltX - currentTiltX) * 0.08;
      currentTiltY += (targetTiltY - currentTiltY) * 0.08;
      if (!isDragging) {
        terminalGroup.rotation.x += currentTiltX * 0.04;
        terminalGroup.rotation.y += currentTiltY * 0.04;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('click', triggerCodeSpark);

      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }

      // Traverse and dispose geometries and materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      screenTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className={`workshop-3d-wrapper${isInteracting ? ' is-active' : ''}`}
      aria-label="Interactive 3D Micro-80 Cyber-Terminal. Drag to rotate or click to type."
      title="Micro-80 Cyber-Terminal · Drag to rotate · Tap to type real Python code"
    >
      <div className="workshop-3d-canvas-box" ref={mountRef} />
      <div className="workshop-3d-meta">
        <span className="workshop-3d-tag">Micro-80 Terminal</span>
        <span className="workshop-3d-hint">
          {isInteracting
            ? 'Inspecting 3D chassis'
            : typedCount > 0
              ? `${typedCount} commands executed`
              : 'Drag to inspect · Click to type'}
        </span>
      </div>
    </div>
  );
}
