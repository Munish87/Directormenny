import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useDmStore, getHomeVideos } from '../../lib/store';
import { applyDynamicThemeColors, hexToNormalizedRgb } from '../../lib/colors';

const WAVE_VERTEX_SHADER = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave1 = sin(pos.x * 0.45 + uTime * 0.65) * cos(pos.y * 0.35 + uTime * 0.4);
    float wave2 = sin(pos.x * 0.9 - uTime * 0.45) * 0.35;
    pos.z += (wave1 + wave2) * 0.55;
    vElevation = wave1 + wave2;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const WAVE_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec3 uColorPrimary;
  uniform vec3 uColorSecondary;
  uniform float uDollyProgress;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vec3 baseDark = vec3(0.019, 0.027, 0.051); // #05070d
    float ribbon = smoothstep(-0.8, 1.1, vElevation) * 0.42;
    float horizonGlow = exp(-pow((vUv.y - 0.52) * 3.2, 2.0));
    float diagSweep = 0.5 + 0.5 * sin(vUv.x * 4.5 + vUv.y * 2.5 + uTime * 0.4);

    vec3 waveTint = mix(uColorPrimary, uColorSecondary, diagSweep);
    vec3 finalColor = mix(baseDark, waveTint, (ribbon + horizonGlow * 0.38) * (0.65 + uDollyProgress * 0.25));

    // Subtle filmic grain
    float grain = fract(sin(dot(vUv * (uTime * 0.05 + 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    finalColor += (grain - 0.5) * 0.018;

    gl_FragColor = vec4(finalColor, 0.88);
  }
`;

// Reusable module-scope math helpers (zero GC in render loop)
const _targetPrimary = new THREE.Color('#2563eb');
const _targetSecondary = new THREE.Color('#06b6d4');
const _currentPrimary = new THREE.Color('#2563eb');
const _currentSecondary = new THREE.Color('#06b6d4');

export function Scene() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const lowPower2D = useDmStore((s) => s.lowPower2D);

  // Store mutable target state in a ref so the RAF loop reads live values without re-mounting WebGL
  const sceneTargetsRef = useRef({
    dominantColor: '#2563eb',
    secondaryColor: '#06b6d4',
    tileIndex: 0,
    isHubOpen: false,
    bootPhase: 'home' as 'boot' | 'user_select' | 'home',
    reducedMotion: false,
  });

  // Subscribe to store updates for dynamic color & camera rig targets
  const bootPhase = useDmStore((s) => s.bootPhase);
  const activeTab = useDmStore((s) => s.activeTab);
  const videoRowIndex = useDmStore((s) => s.videoRowIndex);
  const artRowIndex = useDmStore((s) => s.artRowIndex);
  const videos = useDmStore((s) => s.videos);
  const artworks = useDmStore((s) => s.artworks);
  const selectedArtCategory = useDmStore((s) => s.selectedArtCategory);
  const selectedVideoId = useDmStore((s) => s.selectedVideoId);
  const reducedMotion = useDmStore((s) => s.reducedMotion);
  const ambientTrackIndex = useDmStore((s) => s.ambientTrackIndex);
  const musicVideoIndex = useDmStore((s) => s.musicVideoIndex);
  const accentOverride = useDmStore((s) => s.accentOverride);

  useEffect(() => {
    let dominant = '#2563eb';
    let secondary = '#06b6d4';
    let activeIdx = 0;

    if (selectedVideoId) {
      const hubVid = videos.find((v) => v.id === selectedVideoId) || videos[0];
      if (hubVid) {
        dominant = hubVid.dominantColor;
        secondary = hubVid.secondaryColor;
      }
    } else if (activeTab === 'videos') {
      const homeVideos = getHomeVideos(videos);
      activeIdx = videoRowIndex;
      if (videoRowIndex < homeVideos.length) {
        dominant = homeVideos[videoRowIndex].dominantColor;
        secondary = homeVideos[videoRowIndex].secondaryColor;
      } else if (videoRowIndex === homeVideos.length) {
        dominant = '#3b82f6';
        secondary = '#6366f1';
      } else {
        dominant = '#10b981';
        secondary = '#06b6d4';
      }
    } else if (activeTab === 'music') {
      const vid = videos[musicVideoIndex] || videos[0];
      if (vid) {
        dominant = vid.dominantColor;
        secondary = vid.secondaryColor;
      }
    } else {
      const filtered =
        selectedArtCategory === 'All'
          ? artworks
          : artworks.filter((a) => a.category === selectedArtCategory);
      activeIdx = artRowIndex;
      const art = filtered[artRowIndex] || filtered[0];
      if (art) {
        // Keep the gallery shell neutral; color belongs inside the artwork.
        dominant = '#334761';
        secondary = '#8296b0';
      }
    }

    if (accentOverride) {
      dominant = accentOverride;
    }

    applyDynamicThemeColors(dominant, secondary);

    sceneTargetsRef.current = {
      dominantColor: dominant,
      secondaryColor: secondary,
      tileIndex: activeIdx,
      isHubOpen: Boolean(selectedVideoId),
      bootPhase,
      reducedMotion,
    };
  }, [
    bootPhase,
    activeTab,
    videoRowIndex,
    artRowIndex,
    videos,
    artworks,
    selectedArtCategory,
    selectedVideoId,
    reducedMotion,
    accentOverride,
    ambientTrackIndex,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || lowPower2D) return;

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    const lightweight = isHeadless || window.innerWidth < 768;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070d, 0.055);

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 8.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !lightweight,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    // Clamp DPR [1, 1.75] per spec
    renderer.setPixelRatio(
      lightweight ? 1 : Math.min(Math.max(window.devicePixelRatio || 1, 1), 1.75)
    );
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. GLSL Animated Gradient Wave Mesh
    const waveGeo = new THREE.PlaneGeometry(26, 15, 48, 32);
    const waveMat = new THREE.ShaderMaterial({
      vertexShader: WAVE_VERTEX_SHADER,
      fragmentShader: WAVE_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uColorPrimary: { value: new THREE.Color('#2563eb') },
        uColorSecondary: { value: new THREE.Color('#06b6d4') },
        uDollyProgress: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.position.set(0, -0.4, -3.5);
    waveMesh.rotation.x = -0.22;
    scene.add(waveMesh);

    // 2. Spatial Particle Field (swirls on boot, drifts on Home)
    const particleCount = lightweight ? 160 : 520;
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1;
      scales[i] = Math.random();
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const particleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.055,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 3. Composite 3-Part Geometric Console Halo Group (Primary ring, Secondary inner bevel, Accent nodes)
    const haloGroup = new THREE.Group();
    const outerRingGeo = new THREE.TorusGeometry(3.1, 0.012, 12, 96);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.16,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);

    const innerRingGeo = new THREE.TorusGeometry(2.35, 0.008, 12, 72);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = 0.35;

    haloGroup.add(outerRing, innerRing);
    haloGroup.position.set(2.4, 0.6, -2.2);
    scene.add(haloGroup);

    // Pre-warm shaders
    renderer.compile(scene, camera);

    const clock = new THREE.Clock();
    let rafId = 0;
    let dollyCurrent = 0;
    const pointer = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer.set((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
    };
    const resetPointer = () => pointer.set(0, 0);
    window.addEventListener('pointermove', onPointerMove);
    document.documentElement.addEventListener('pointerleave', resetPointer);

    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const targets = sceneTargetsRef.current;

      // Smooth color interpolation (~500ms)
      const pRgb = hexToNormalizedRgb(targets.dominantColor);
      const sRgb = hexToNormalizedRgb(targets.secondaryColor);
      _targetPrimary.setRGB(pRgb.r, pRgb.g, pRgb.b);
      _targetSecondary.setRGB(sRgb.r, sRgb.g, sRgb.b);

      const colorLerpFactor = 1 - Math.exp(-4.5 * dt);
      _currentPrimary.lerp(_targetPrimary, colorLerpFactor);
      _currentSecondary.lerp(_targetSecondary, colorLerpFactor);

      waveMat.uniforms.uColorPrimary.value.copy(_currentPrimary);
      waveMat.uniforms.uColorSecondary.value.copy(_currentSecondary);
      particleMat.color.copy(_currentSecondary);
      outerRingMat.color.copy(_currentPrimary);

      if (!targets.reducedMotion) {
        waveMat.uniforms.uTime.value = elapsed;
        particles.rotation.y = elapsed * 0.035;
        particles.rotation.x = Math.sin(elapsed * 0.15) * 0.05;
        haloGroup.rotation.z = elapsed * 0.08;
        innerRing.rotation.y = elapsed * 0.14;
      }

      // Smooth camera dolly into Video Hub or horizontal parallax across tiles
      const targetDolly = targets.isHubOpen ? 1 : 0;
      dollyCurrent = THREE.MathUtils.damp(dollyCurrent, targetDolly, 5.5, dt);
      waveMat.uniforms.uDollyProgress.value = dollyCurrent;

      const targetCamZ = targets.bootPhase === 'boot' ? 6.2 : targets.isHubOpen ? 5.6 : 8.5;
      const targetCamX = (targets.isHubOpen ? 0 : (targets.tileIndex - 2) * 0.22) + (targets.reducedMotion ? 0 : pointer.x * .45);
      const targetCamY = targets.reducedMotion ? 0 : -pointer.y * .25;
      const targetFov = targets.isHubOpen ? 42 : 50;

      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3.5, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 5.0, dt);
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 4.5, dt);
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 5.0, dt);
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
    };

    rafId = window.requestAnimationFrame(animate);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      window.cancelAnimationFrame(rafId);
    };

    const onContextRestored = () => {
      rafId = window.requestAnimationFrame(animate);
    };

    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', resetPointer);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      waveGeo.dispose();
      waveMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      renderer.dispose();
    };
  }, [lowPower2D]);

  if (lowPower2D) {
    return (
      <div
        aria-hidden="true" className="console-scene console-scene-fallback fixed inset-0 pointer-events-none transition-colors duration-500"
        style={{
          background:
            'radial-gradient(circle at 60% 35%, rgba(var(--dm-accent-rgb, 37, 99, 235), 0.22), #05070d 75%)',
        }}
      />
    );
  }

  return <div ref={mountRef} aria-hidden="true" className="console-scene fixed inset-0 pointer-events-none" />;
}
