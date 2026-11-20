/**
 * ROSHAN ARUL A - 3D CONCERT GRAND PIANO PORTFOLIO ENGINE
 * Technologies: Three.js (WebGL), Web Audio API (Physical Acoustic Synthesis), Vanilla JS
 * Features:
 *   1. Procedural High-Gloss Piano-Black Grand Piano with Golden Harp & Ivory Keys
 *   2. Responsive Scroll-Camera Choreography (Rotates & Zooms dynamically)
 *   3. Bottom Viewport Docking Alignment for interactive playing
 *   4. Key Indicator Badges visible ONLY when docked at bottom
 *   5. Mouse & Keyboard Playability + Polyphonic Grand Piano Sound Engine
 *   6. Auto-Play Demo Melodies (Für Elise, Interstellar, Canon in D)
 *   7. Printable Resume & CV Modal with @media print support
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D WebGL Grand Piano Scene
  const pianoScene = initThreePianoScene();

  // 2. Initialize Web Audio API Piano Synthesizer
  const audioEngine = initPianoAudioEngine();

  // 3. Connect 3D Keyboard & Audio Engine
  if (pianoScene && audioEngine) {
    setupPianoInteraction(pianoScene, audioEngine);
  }

  // 4. Initialize UI, Navigation, Modals & Forms
  initNavigation();
  initResumeModal();
  initContactForm();
});

/* ==========================================================================
   1. THREE.JS 3D CONCERT GRAND PIANO SCENE
   ========================================================================== */
function initThreePianoScene() {
  const container = document.getElementById('canvas-container');
  const canvas = document.getElementById('webgl-canvas');
  if (!container || !canvas) return null;

  // Scene & Camera
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08080a, 0.04);

  const camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(3.8, 3.2, 5.8);

  // Renderer with High Dynamic Range & Color Management
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  if (THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  // Lighting Rig: Concert Stage Illumination
  const ambientLight = new THREE.AmbientLight(0xfff7e8, 0.65);
  scene.add(ambientLight);

  // Key Spotlight (Casts crisp soft shadows on piano and floor)
  const spotLight = new THREE.SpotLight(0xffeedd, 3.5);
  spotLight.position.set(4, 9, 4);
  spotLight.angle = Math.PI / 4.5;
  spotLight.penumbra = 0.55;
  spotLight.decay = 1.4;
  spotLight.distance = 25;
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 2048;
  spotLight.shadow.mapSize.height = 2048;
  spotLight.shadow.camera.near = 1;
  spotLight.shadow.camera.far = 20;
  spotLight.shadow.bias = -0.0001;
  scene.add(spotLight);

  // Rim Light (Accentuates glossy piano-black rim curvature)
  const rimLight = new THREE.DirectionalLight(0xe8d5b5, 1.8);
  rimLight.position.set(-6, 5, -4);
  scene.add(rimLight);

  // Front Fill Light (Illuminates keys and front cheekblocks)
  const fillLight = new THREE.DirectionalLight(0xb0c4de, 0.85);
  fillLight.position.set(0, 3, 7);
  scene.add(fillLight);

  // Soft Ground Reflection Plane
  const groundGeo = new THREE.PlaneGeometry(35, 35);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x070709,
    roughness: 0.6,
    metalness: 0.3
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.5;
  ground.receiveShadow = true;
  scene.add(ground);

  // Master Piano Group
  const pianoMaster = new THREE.Group();
  scene.add(pianoMaster);

  // BUILD THE 3D GRAND PIANO COMPONENTS
  const pianoComponents = buildConcertGrandPiano(pianoMaster);

  // Scroll Choreography & Mouse Parallax Variables
  let scrollProgress = 0;
  let targetScroll = 0;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let isPianoAtBottom = false;

  function updateScrollProgress() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    targetScroll = docHeight > 0 ? Math.max(0, Math.min(1, window.scrollY / docHeight)) : 0;
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Handle Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    updateScrollProgress();
  });

  // Animation Loop with Smooth Interpolation
  const currentCamPos = new THREE.Vector3().copy(camera.position);
  const currentLookAt = new THREE.Vector3(0, 0.2, 0.5);
  const targetCamPos = new THREE.Vector3();
  const targetLookAt = new THREE.Vector3();

  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Smooth scroll interpolation
    scrollProgress += (targetScroll - scrollProgress) * 0.08;
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // Detect if we are docked at the bottom interactive finale section (P >= 0.88)
    const finaleThreshold = 0.88;
    const bottomFactor = Math.max(0, Math.min(1, (scrollProgress - finaleThreshold) / (1 - finaleThreshold)));
    isPianoAtBottom = bottomFactor > 0.5;

    // Enable/disable pointer events on canvas container when in interactive mode
    if (bottomFactor > 0.75) {
      container.style.pointerEvents = 'auto';
    } else {
      container.style.pointerEvents = 'none';
    }

    // Dynamic Key Indicator Badge Opacity (0% during normal scroll, 100% when at bottom!)
    pianoComponents.keyIndicators.forEach(badge => {
      badge.material.opacity = bottomFactor;
    });

    // CAMERA & PIANO CHOREOGRAPHY ACROSS SCROLL
    if (scrollProgress < 0.25) {
      // 1. HERO SECTION: Majestic 3/4 Perspective with gentle ambient floating
      const t = scrollProgress / 0.25;
      targetCamPos.set(
        THREE.MathUtils.lerp(3.6, 2.0, t),
        THREE.MathUtils.lerp(3.0, 2.6, t),
        THREE.MathUtils.lerp(5.4, 4.2, t)
      );
      targetLookAt.set(
        THREE.MathUtils.lerp(0.2, 0.0, t),
        THREE.MathUtils.lerp(0.3, 0.4, t),
        THREE.MathUtils.lerp(0.8, 1.2, t)
      );

      pianoMaster.rotation.y = THREE.MathUtils.lerp(0.18, 0.35, t) + mouseX * 0.04;
      pianoMaster.rotation.x = THREE.MathUtils.lerp(0.04, 0.02, t) + mouseY * 0.02;
      pianoMaster.position.set(0.6, 0.1, 0);

    } else if (scrollProgress < 0.55) {
      // 2. ABOUT ME & CRAFTSMANSHIP: Zoom close to the Soundboard, Golden Strings & Harp
      const t = (scrollProgress - 0.25) / 0.3;
      targetCamPos.set(
        THREE.MathUtils.lerp(2.0, -1.8, t),
        THREE.MathUtils.lerp(2.6, 2.3, t),
        THREE.MathUtils.lerp(4.2, 3.2, t)
      );
      targetLookAt.set(
        THREE.MathUtils.lerp(0.0, -0.3, t),
        THREE.MathUtils.lerp(0.4, 0.45, t),
        THREE.MathUtils.lerp(1.2, 1.4, t)
      );

      pianoMaster.rotation.y = THREE.MathUtils.lerp(0.35, -0.28, t) + mouseX * 0.03;
      pianoMaster.rotation.x = 0.02 + mouseY * 0.02;
      pianoMaster.position.set(
        THREE.MathUtils.lerp(0.6, -0.4, t),
        0.1,
        0
      );

    } else if (scrollProgress < 0.85) {
      // 3. SKILLS, LANGUAGES & PROJECTS: Sweeping elevated view showing gloss curves & keys
      const t = (scrollProgress - 0.55) / 0.3;
      targetCamPos.set(
        THREE.MathUtils.lerp(-1.8, 1.5, t),
        THREE.MathUtils.lerp(2.3, 3.4, t),
        THREE.MathUtils.lerp(3.2, 3.8, t)
      );
      targetLookAt.set(
        THREE.MathUtils.lerp(-0.3, 0.0, t),
        THREE.MathUtils.lerp(0.45, 0.25, t),
        THREE.MathUtils.lerp(1.4, 0.6, t)
      );

      pianoMaster.rotation.y = THREE.MathUtils.lerp(-0.28, 0.05, t) + mouseX * 0.03;
      pianoMaster.rotation.x = 0.02 + mouseY * 0.02;
      pianoMaster.position.set(
        THREE.MathUtils.lerp(-0.4, 0.0, t),
        0.1,
        0
      );

    } else {
      // 4. CRUCIAL FINALE: PIANO ALIGNS PERFECTLY TO THE BOTTOM OF THE VIEWPORT!
      // The camera positions directly in front & above the keyboard for optimal ergonomic playability
      const t = (scrollProgress - 0.85) / 0.15;
      
      // Target camera position squarely in front of the keyboard bed
      targetCamPos.set(
        THREE.MathUtils.lerp(1.5, 0.0, t) + mouseX * 0.08,
        THREE.MathUtils.lerp(3.4, 1.95, t),
        THREE.MathUtils.lerp(3.8, 2.55, t)
      );
      targetLookAt.set(
        0.0,
        THREE.MathUtils.lerp(0.25, 0.05, t),
        THREE.MathUtils.lerp(0.6, 0.15, t)
      );

      // Piano aligns square, translating slightly downward so keys sit right at the bottom edge
      pianoMaster.rotation.y = THREE.MathUtils.lerp(0.05, 0.0, t);
      pianoMaster.rotation.x = THREE.MathUtils.lerp(0.02, 0.06, t); // Slight ergonomic forward tilt
      pianoMaster.position.set(
        0.0,
        THREE.MathUtils.lerp(0.1, -0.22, t), // Docked down towards bottom
        0.0
      );
    }

    // Apply Lerping to Camera
    currentCamPos.lerp(targetCamPos, 0.09);
    currentLookAt.lerp(targetLookAt, 0.09);
    camera.position.copy(currentCamPos);
    camera.lookAt(currentLookAt);

    // Spring return animation for all depressed keys
    for (let keyObj of pianoComponents.allKeys) {
      if (!keyObj.isPressed && keyObj.pivot.rotation.x !== 0) {
        keyObj.pivot.rotation.x += (0 - keyObj.pivot.rotation.x) * 0.25;
        if (Math.abs(keyObj.pivot.rotation.x) < 0.001) {
          keyObj.pivot.rotation.x = 0;
          keyObj.mesh.material.emissive.setHex(0x000000);
        }
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  return {
    scene,
    camera,
    renderer,
    canvas,
    pianoMaster,
    pianoComponents,
    isBottom: () => isPianoAtBottom
  };
}

/* ==========================================================================
   2. BUILD THE PROCEDURAL 3D GRAND PIANO MODEL
   ========================================================================== */
function buildConcertGrandPiano(masterGroup) {
  // PBR Materials
  // 1. Piano Black Lacquer (High-gloss deep obsidian black with clearcoat reflection)
  const pianoBlackMat = new THREE.MeshPhysicalMaterial({
    color: 0x09090b,
    metalness: 0.15,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 0.95
  });

  // 2. Cast Iron Harp / Plate (Lustrous Steinway Golden Bronze)
  const ironPlateMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.25
  });

  // 3. Soundboard (Warm resonant spruce wood tone)
  const soundboardMat = new THREE.MeshStandardMaterial({
    color: 0xbfa37c,
    roughness: 0.55,
    metalness: 0.05
  });

  // 4. White Ivory Keys (Rich off-white with delicate specular sheen)
  const whiteKeyMat = new THREE.MeshStandardMaterial({
    color: 0xfbf9f4,
    roughness: 0.22,
    metalness: 0.02
  });

  // 5. Black Ebony Keys (Sleek matte-satin dark ebony)
  const blackKeyMat = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.28,
    metalness: 0.1
  });

  // 6. Polished Brass Metal (Hinges, pedals, casters, prop stick)
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xe5c158,
    metalness: 0.92,
    roughness: 0.18
  });

  // -------------------------------------------------------------
  // A. PIANO RIM & CASE (The Iconic Grand Piano Wing Contour)
  // -------------------------------------------------------------
  const rimShape = new THREE.Shape();
  // Keyboard bed front: from -1.8 to +1.8 at Z = 0
  rimShape.moveTo(-1.8, 0);
  // Left spine (long straight side) running back to Z = 3.6
  rimShape.lineTo(-1.8, 3.4);
  // Rear tail curve
  rimShape.bezierCurveTo(-1.8, 4.3, 0.4, 4.3, 0.8, 3.6);
  // Right bentside (iconic S-curve wing tapering inwards back to the right cheek)
  rimShape.bezierCurveTo(1.2, 2.8, 1.4, 2.0, 1.8, 1.2);
  rimShape.lineTo(1.8, 0);
  rimShape.lineTo(-1.8, 0);

  const extrudeSettings = {
    steps: 1,
    depth: 0.95,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 4
  };

  const rimGeo = new THREE.ExtrudeGeometry(rimShape, extrudeSettings);
  // Rotate so depth is vertical (Y-axis)
  rimGeo.rotateX(Math.PI / 2);

  const rimMesh = new THREE.Mesh(rimGeo, pianoBlackMat);
  rimMesh.position.set(0, 0.45, 0);
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  masterGroup.add(rimMesh);

  // -------------------------------------------------------------
  // B. SPRUCE SOUNDBOARD & CAST IRON HARP
  // -------------------------------------------------------------
  // Soundboard plate inside the rim cavity
  const soundboardGeo = new THREE.PlaneGeometry(3.3, 3.8);
  const soundboardMesh = new THREE.Mesh(soundboardGeo, soundboardMat);
  soundboardMesh.rotation.x = -Math.PI / 2;
  soundboardMesh.position.set(-0.15, 0.38, 2.0);
  soundboardMesh.receiveShadow = true;
  masterGroup.add(soundboardMesh);

  // Cast Iron Harp Frame with webbing beams
  const harpGroup = new THREE.Group();
  harpGroup.position.set(-0.15, 0.42, 2.0);

  // Outer harp rim plate
  const plateGeo = new THREE.BoxGeometry(3.0, 0.05, 3.4);
  const plateMesh = new THREE.Mesh(plateGeo, ironPlateMat);
  plateMesh.position.set(0, 0, 0);
  harpGroup.add(plateMesh);

  // Acoustic Soundholes (Recessed dark circular portals)
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x1a1510 });
  for (let i = 0; i < 4; i++) {
    const holeGeo = new THREE.CylinderGeometry(0.22 - i * 0.03, 0.22 - i * 0.03, 0.06, 24);
    const holeMesh = new THREE.Mesh(holeGeo, holeMat);
    holeMesh.position.set(-0.7 + i * 0.5, 0.01, -0.6 + i * 0.5);
    harpGroup.add(holeMesh);
  }

  // Golden Diagonal Webbing Struts (Structural Harp Ribs)
  for (let r = 0; r < 3; r++) {
    const ribGeo = new THREE.BoxGeometry(0.08, 0.07, 3.2);
    const ribMesh = new THREE.Mesh(ribGeo, ironPlateMat);
    ribMesh.position.set(-0.6 + r * 0.7, 0.04, 0);
    ribMesh.rotation.y = 0.12 - r * 0.08;
    harpGroup.add(ribMesh);
  }

  // Piano Strings (Simulated acoustic wire bundle)
  const stringsGroup = new THREE.Group();
  const stringMat = new THREE.MeshStandardMaterial({
    color: 0xedd69e,
    metalness: 0.9,
    roughness: 0.1
  });
  for (let s = 0; s < 28; s++) {
    const stringGeo = new THREE.CylinderGeometry(0.005, 0.005, 3.0, 6);
    const stringMesh = new THREE.Mesh(stringGeo, stringMat);
    stringMesh.rotation.x = Math.PI / 2;
    stringMesh.position.set(-1.1 + s * 0.08, 0.06, 0.1);
    stringsGroup.add(stringMesh);
  }
  harpGroup.add(stringsGroup);
  masterGroup.add(harpGroup);

  // -------------------------------------------------------------
  // C. THE GRAND PIANO LID & BRASS PROP STICK
  // -------------------------------------------------------------
  const lidGroup = new THREE.Group();
  // Pivot placed along left spine at X = -1.8, Y = 0.5
  lidGroup.position.set(-1.8, 0.5, 0);

  const lidGeo = new THREE.ExtrudeGeometry(rimShape, {
    steps: 1,
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2
  });
  lidGeo.rotateX(Math.PI / 2);
  const lidMesh = new THREE.Mesh(lidGeo, pianoBlackMat);
  lidMesh.position.set(1.8, 0, 0);
  lidMesh.castShadow = true;
  lidGroup.add(lidMesh);

  // Open the lid at an authentic concert angle (~34 degrees)
  lidGroup.rotation.z = -0.58;
  masterGroup.add(lidGroup);

  // Brass Prop Stick supporting the lid
  const propGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.7, 16);
  const propMesh = new THREE.Mesh(propGeo, brassMat);
  propMesh.position.set(0.65, 0.95, 1.6);
  propMesh.rotation.z = -0.32;
  propMesh.rotation.x = 0.15;
  masterGroup.add(propMesh);

  // -------------------------------------------------------------
  // D. FALLBOARD, NAMEPLATE & MUSIC DESK
  // -------------------------------------------------------------
  // Front Fallboard Housing
  const fallboardGeo = new THREE.BoxGeometry(3.6, 0.28, 0.35);
  const fallboardMesh = new THREE.Mesh(fallboardGeo, pianoBlackMat);
  fallboardMesh.position.set(0, 0.28, -0.15);
  fallboardMesh.castShadow = true;
  masterGroup.add(fallboardMesh);

  // Golden Nameplate: "ROSHAN ARUL • CONCERT GRAND"
  const nameplateCanvas = document.createElement('canvas');
  nameplateCanvas.width = 512;
  nameplateCanvas.height = 64;
  const npCtx = nameplateCanvas.getContext('2d');
  npCtx.fillStyle = '#08080a';
  npCtx.fillRect(0, 0, 512, 64);
  npCtx.fillStyle = '#d4af37';
  npCtx.font = 'bold 22px "Cinzel", Georgia, serif';
  npCtx.textAlign = 'center';
  npCtx.textBaseline = 'middle';
  npCtx.fillText('★ ROSHAN ARUL • SRM TRICHY ★', 256, 32);

  const npTex = new THREE.CanvasTexture(nameplateCanvas);
  const npMat = new THREE.MeshStandardMaterial({
    map: npTex,
    metalness: 0.6,
    roughness: 0.25
  });
  const npMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.18), npMat);
  npMesh.position.set(0, 0.32, 0.03);
  masterGroup.add(npMesh);

  // Music Rest / Desk with Sheet Music
  const deskGroup = new THREE.Group();
  deskGroup.position.set(0, 0.45, 0.5);

  const deskGeo = new THREE.BoxGeometry(1.5, 0.45, 0.05);
  const deskMesh = new THREE.Mesh(deskGeo, pianoBlackMat);
  deskMesh.rotation.x = -0.3;
  deskGroup.add(deskMesh);

  // Sheet Music Page
  const musicSheetCanvas = document.createElement('canvas');
  musicSheetCanvas.width = 256;
  musicSheetCanvas.height = 128;
  const msCtx = musicSheetCanvas.getContext('2d');
  msCtx.fillStyle = '#f6f4ee';
  msCtx.fillRect(0, 0, 256, 128);
  msCtx.fillStyle = '#111';
  msCtx.font = 'bold 16px "Playfair Display", Georgia, serif';
  msCtx.fillText('Opus 1: Web & IoT Systems', 20, 28);
  msCtx.lineWidth = 1.5;
  for (let l = 0; l < 5; l++) {
    msCtx.beginPath();
    msCtx.moveTo(20, 48 + l * 7);
    msCtx.lineTo(236, 48 + l * 7);
    msCtx.stroke();
  }
  msCtx.font = '12px "Cinzel", serif';
  msCtx.fillText('♪ Roshan Arul A', 20, 105);

  const sheetTex = new THREE.CanvasTexture(musicSheetCanvas);
  const sheetMat = new THREE.MeshBasicMaterial({ map: sheetTex });
  const sheetMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.36), sheetMat);
  sheetMesh.rotation.x = -0.3;
  sheetMesh.position.set(0, 0.02, 0.03);
  deskGroup.add(sheetMesh);
  masterGroup.add(deskGroup);

  // -------------------------------------------------------------
  // E. FLUTED LEGS & PEDAL LYRE
  // -------------------------------------------------------------
  const legPositions = [
    [-1.5, -0.5, 0.3],   // Front Left
    [ 1.5, -0.5, 0.3],   // Front Right
    [-0.3, -0.5, 3.4]    // Tail Rear
  ];

  legPositions.forEach(pos => {
    const legGroup = new THREE.Group();
    legGroup.position.set(...pos);

    // Fluted upper leg
    const upperGeo = new THREE.CylinderGeometry(0.12, 0.09, 1.0, 16);
    const upperMesh = new THREE.Mesh(upperGeo, pianoBlackMat);
    legGroup.add(upperMesh);

    // Brass Caster Wheel at bottom
    const casterGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16);
    const casterMesh = new THREE.Mesh(casterGeo, brassMat);
    casterMesh.rotation.z = Math.PI / 2;
    casterMesh.position.y = -0.52;
    legGroup.add(casterMesh);

    masterGroup.add(legGroup);
  });

  // Central Pedal Lyre with 3 Brass Pedals (Sustain, Sostenuto, Soft)
  const lyreGroup = new THREE.Group();
  lyreGroup.position.set(0, -0.55, 0.35);

  const lyreFrameGeo = new THREE.BoxGeometry(0.65, 0.8, 0.08);
  const lyreFrame = new THREE.Mesh(lyreFrameGeo, pianoBlackMat);
  lyreGroup.add(lyreFrame);

  // 3 Brass Pedals
  for (let p = -1; p <= 1; p++) {
    const pedalGeo = new THREE.BoxGeometry(0.08, 0.04, 0.28);
    const pedalMesh = new THREE.Mesh(pedalGeo, brassMat);
    pedalMesh.position.set(p * 0.16, -0.4, 0.1);
    lyreGroup.add(pedalMesh);
  }
  masterGroup.add(lyreGroup);

  // -------------------------------------------------------------
  // F. PLAYABLE 24-KEY KEYBOARD WITH DYNAMIC BOTTOM INDICATORS
  // -------------------------------------------------------------
  const keyboardGroup = new THREE.Group();
  keyboardGroup.position.set(0, 0.12, -0.32);
  masterGroup.add(keyboardGroup);

  // 14 White Keys + 10 Black Keys covering 2 octaves (C4 to B5)
  // Mapping computer keyboard keys for seamless typing:
  const keyDefinitions = [
    // Octave 4
    { note: 'C4',  isBlack: false, char: 'A',  freq: 261.63 },
    { note: 'C#4', isBlack: true,  char: 'W',  freq: 277.18 },
    { note: 'D4',  isBlack: false, char: 'S',  freq: 293.66 },
    { note: 'D#4', isBlack: true,  char: 'E',  freq: 311.13 },
    { note: 'E4',  isBlack: false, char: 'D',  freq: 329.63 },
    { note: 'F4',  isBlack: false, char: 'F',  freq: 349.23 },
    { note: 'F#4', isBlack: true,  char: 'T',  freq: 369.99 },
    { note: 'G4',  isBlack: false, char: 'G',  freq: 392.00 },
    { note: 'G#4', isBlack: true,  char: 'Y',  freq: 415.30 },
    { note: 'A4',  isBlack: false, char: 'H',  freq: 440.00 },
    { note: 'A#4', isBlack: true,  char: 'U',  freq: 466.16 },
    { note: 'B4',  isBlack: false, char: 'J',  freq: 493.88 },

    // Octave 5
    { note: 'C5',  isBlack: false, char: 'K',  freq: 523.25 },
    { note: 'C#5', isBlack: true,  char: 'O',  freq: 554.37 },
    { note: 'D5',  isBlack: false, char: 'L',  freq: 587.33 },
    { note: 'D#5', isBlack: true,  char: 'P',  freq: 622.25 },
    { note: 'E5',  isBlack: false, char: ';',  freq: 659.25 },
    { note: 'F5',  isBlack: false, char: "'",  freq: 698.46 },
    { note: 'F#5', isBlack: true,  char: ']',  freq: 739.99 },
    { note: 'G5',  isBlack: false, char: 'Z',  freq: 783.99 },
    { note: 'G#5', isBlack: true,  char: 'X',  freq: 830.61 },
    { note: 'A5',  isBlack: false, char: 'C',  freq: 880.00 },
    { note: 'A#5', isBlack: true,  char: 'V',  freq: 932.33 },
    { note: 'B5',  isBlack: false, char: 'B',  freq: 987.77 }
  ];

  const whiteKeyWidth = 0.22;
  const whiteKeyLength = 1.35;
  const whiteKeyHeight = 0.16;

  const blackKeyWidth = 0.13;
  const blackKeyLength = 0.85;
  const blackKeyHeight = 0.22;

  const allKeys = [];
  const keyIndicators = [];
  const charKeyMap = {};
  const noteKeyMap = {};

  // Count white keys to center keyboard
  const totalWhite = keyDefinitions.filter(k => !k.isBlack).length;
  const totalKeyboardWidth = totalWhite * whiteKeyWidth;
  const startX = -totalKeyboardWidth / 2 + whiteKeyWidth / 2;

  let whiteIndex = 0;

  keyDefinitions.forEach((def) => {
    // Each key gets its own pivot placed at the rear so it tilts downward realistically when pressed
    const keyPivot = new THREE.Group();
    keyboardGroup.add(keyPivot);

    let keyX, keyY, keyZ;
    let keyMesh;

    if (!def.isBlack) {
      // White Key
      keyX = startX + whiteIndex * whiteKeyWidth;
      keyY = 0;
      keyZ = -whiteKeyLength / 2;

      // Position pivot at the back edge of the key
      keyPivot.position.set(keyX, 0.08, 0.5);

      const geo = new THREE.BoxGeometry(whiteKeyWidth - 0.015, whiteKeyHeight, whiteKeyLength);
      // Custom material instance so emissive highlight works individually
      const mat = whiteKeyMat.clone();
      keyMesh = new THREE.Mesh(geo, mat);
      keyMesh.position.set(0, 0, keyZ);
      keyMesh.castShadow = true;
      keyMesh.receiveShadow = true;
      keyPivot.add(keyMesh);

      // Create Key Indicator Badge (Showing [KEY] and Note)
      // "whic are indicated in the piano only when its on the bottom."
      const badge = createKeyIndicatorBadge(def.char, def.note, false);
      badge.position.set(0, whiteKeyHeight / 2 + 0.005, keyZ - whiteKeyLength / 2 + 0.25);
      badge.rotation.x = -Math.PI / 2;
      badge.material.opacity = 0.0; // Completely invisible during normal scroll
      keyPivot.add(badge);
      keyIndicators.push(badge);

      whiteIndex++;
    } else {
      // Black Key
      // Position between previous white key and current white key
      keyX = startX + (whiteIndex - 0.5) * whiteKeyWidth;
      keyY = 0.06;
      keyZ = -blackKeyLength / 2 - 0.24;

      keyPivot.position.set(keyX, 0.12, 0.5);

      const geo = new THREE.BoxGeometry(blackKeyWidth, blackKeyHeight, blackKeyLength);
      const mat = blackKeyMat.clone();
      keyMesh = new THREE.Mesh(geo, mat);
      keyMesh.position.set(0, keyY, keyZ);
      keyMesh.castShadow = true;
      keyMesh.receiveShadow = true;
      keyPivot.add(keyMesh);

      // Create Key Indicator Badge
      const badge = createKeyIndicatorBadge(def.char, def.note, true);
      badge.position.set(0, keyY + blackKeyHeight / 2 + 0.005, keyZ - blackKeyLength / 2 + 0.18);
      badge.rotation.x = -Math.PI / 2;
      badge.material.opacity = 0.0; // Completely invisible during normal scroll
      keyPivot.add(badge);
      keyIndicators.push(badge);
    }

    const keyObject = {
      note: def.note,
      char: def.char.toUpperCase(),
      freq: def.freq,
      isBlack: def.isBlack,
      pivot: keyPivot,
      mesh: keyMesh,
      isPressed: false
    };

    // Store reference on mesh for mouse raycasting
    keyMesh.userData.keyObject = keyObject;

    allKeys.push(keyObject);
    charKeyMap[def.char.toUpperCase()] = keyObject;
    noteKeyMap[def.note] = keyObject;
  });

  return {
    allKeys,
    keyIndicators,
    charKeyMap,
    noteKeyMap,
    keyboardGroup,
    masterGroup
  };
}

/**
 * Creates dynamic text canvas texture for key indicators
 */
function createKeyIndicatorBadge(char, note, isBlack) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Background pill
  ctx.clearRect(0, 0, 128, 128);

  if (isBlack) {
    ctx.fillStyle = 'rgba(212, 175, 55, 0.95)'; // Gold badge for black keys
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(14, 14, 100, 100, 16);
    } else {
      ctx.rect(14, 14, 100, 100);
    }
    ctx.fill();

    ctx.fillStyle = '#0a0a0c';
    ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 64, 52);

    ctx.fillStyle = '#222';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(note, 64, 90);
  } else {
    ctx.fillStyle = 'rgba(20, 20, 26, 0.88)'; // Dark badge for white keys
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(14, 14, 100, 100, 16);
    } else {
      ctx.rect(14, 14, 100, 100);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#faf8f5';
    ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, 64, 52);

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText(note, 64, 90);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.0,
    depthWrite: false
  });

  const geo = new THREE.PlaneGeometry(0.18, 0.18);
  return new THREE.Mesh(geo, mat);
}

/* ==========================================================================
   3. WEB AUDIO API ACOUSTIC GRAND PIANO SYNTHESIZER
   ========================================================================== */
function initPianoAudioEngine() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  let ctx = null;
  let masterGain = null;
  let compressor = null;
  let isMuted = false;
  let isSustainOn = false;
  let octaveMultiplier = 1.0;

  // Active voices map (note -> array of active nodes)
  const activeVoices = new Map();

  function ensureContext() {
    if (!ctx) {
      ctx = new AudioContext();

      // Master Dynamic Compressor (Ensures clean acoustic polyphony without distortion)
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, ctx.currentTime);
      compressor.knee.setValueAtTime(12, ctx.currentTime);
      compressor.ratio.setValueAtTime(8, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, ctx.currentTime);

      masterGain.connect(compressor);
      compressor.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  /**
   * Physically-modeled Grand Piano Note Synthesis:
   * Multi-harmonic additive synthesis with hammer strike transient and acoustic decay
   */
  function playNote(freq, noteName = '') {
    ensureContext();
    if (isMuted || !ctx) return;

    const actualFreq = freq * octaveMultiplier;
    const now = ctx.currentTime;

    // Harmonic Ratios for Acoustic Piano String (including inharmonic dispersion)
    const harmonics = [
      { ratio: 1.000, gain: 1.00, decay: 2.8 },  // Fundamental
      { ratio: 2.003, gain: 0.55, decay: 2.4 },  // 2nd Harmonic
      { ratio: 3.008, gain: 0.35, decay: 1.9 },  // 3rd Harmonic
      { ratio: 4.015, gain: 0.20, decay: 1.5 },  // 4th Harmonic
      { ratio: 5.025, gain: 0.12, decay: 1.1 },  // 5th Harmonic
      { ratio: 6.038, gain: 0.08, decay: 0.8 }   // 6th Harmonic
    ];

    const voiceGroup = [];

    // 1. Hammer Strike Transient (Percussive click of felt hammer on steel string)
    try {
      const hammerDuration = 0.015;
      const bufferSize = Math.floor(ctx.sampleRate * hammerDuration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const hammerFilter = ctx.createBiquadFilter();
      hammerFilter.type = 'bandpass';
      hammerFilter.frequency.setValueAtTime(Math.min(actualFreq * 4, 3500), now);
      hammerFilter.Q.setValueAtTime(3.0, now);

      const hammerGain = ctx.createGain();
      hammerGain.gain.setValueAtTime(0.4, now);
      hammerGain.gain.exponentialRampToValueAtTime(0.001, now + hammerDuration);

      noiseSource.connect(hammerFilter);
      hammerFilter.connect(hammerGain);
      hammerGain.connect(masterGain);

      noiseSource.start(now);
      noiseSource.stop(now + hammerDuration);
    } catch (e) {
      // Graceful fallback
    }

    // 2. Resonant Harmonics
    harmonics.forEach(h => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(actualFreq * h.ratio, now);

      // Immediate punchy acoustic attack (0.003s)
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(h.gain * 0.45, now + 0.003);

      // Natural exponential acoustic decay
      const decayTime = isSustainOn ? h.decay * 1.8 : h.decay;
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

      osc.connect(gainNode);
      gainNode.connect(masterGain);

      osc.start(now);
      osc.stop(now + decayTime);

      voiceGroup.push({ osc, gainNode, stopTime: now + decayTime });
    });

    activeVoices.set(noteName, voiceGroup);
  }

  function releaseNote(noteName = '') {
    if (!ctx || isSustainOn) return;
    const voiceGroup = activeVoices.get(noteName);
    if (voiceGroup) {
      const now = ctx.currentTime;
      voiceGroup.forEach(v => {
        try {
          // Fast damper release
          v.gainNode.gain.cancelScheduledValues(now);
          v.gainNode.gain.setValueAtTime(v.gainNode.gain.value, now);
          v.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
          v.osc.stop(now + 0.16);
        } catch (e) {}
      });
      activeVoices.delete(noteName);
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    const statusLabel = document.getElementById('sound-engine-status');
    const toggleBtn = document.getElementById('piano-sound-toggle');
    if (statusLabel) {
      statusLabel.textContent = isMuted ? 'AUDIO OFF' : 'AUDIO ON';
    }
    if (toggleBtn) {
      toggleBtn.classList.toggle('muted', isMuted);
    }
    return !isMuted;
  }

  function toggleSustain(state = null) {
    isSustainOn = state !== null ? state : !isSustainOn;
    const pedalBtn = document.getElementById('sustain-pedal-btn');
    if (pedalBtn) {
      pedalBtn.classList.toggle('active', isSustainOn);
    }
    return isSustainOn;
  }

  function setOctave(mult, label) {
    octaveMultiplier = mult;
    const octLabel = document.getElementById('current-octave-label');
    if (octLabel) {
      octLabel.textContent = `OCT: ${label}`;
    }
  }

  return {
    ensureContext,
    playNote,
    releaseNote,
    toggleMute,
    toggleSustain,
    setOctave,
    getIsSustain: () => isSustainOn
  };
}

/* ==========================================================================
   4. PIANO INTERACTION: MOUSE CLICK/DRAG & KEYBOARD BINDINGS
   ========================================================================== */
function setupPianoInteraction(pianoScene, audioEngine) {
  const { allKeys, charKeyMap, noteKeyMap } = pianoScene.pianoComponents;
  const canvas = pianoScene.canvas;
  const camera = pianoScene.camera;
  const scene = pianoScene.scene;

  // Press a single key visually & trigger sound
  function triggerKeyPress(keyObj) {
    if (!keyObj || keyObj.isPressed) return;
    audioEngine.ensureContext();

    keyObj.isPressed = true;
    // Animate key tilting downward realistically
    keyObj.pivot.rotation.x = 0.065; // ~3.7 degrees down

    // Emissive highlight feedback
    if (keyObj.isBlack) {
      keyObj.mesh.material.emissive.setHex(0x554422); // Warm golden glow
    } else {
      keyObj.mesh.material.emissive.setHex(0x332a1a); // Ivory glow
    }

    // Play acoustic note
    audioEngine.playNote(keyObj.freq, keyObj.note);
  }

  // Release a single key
  function triggerKeyRelease(keyObj) {
    if (!keyObj) return;
    keyObj.isPressed = false;
    audioEngine.releaseNote(keyObj.note);
  }

  // -------------------------------------------------------------
  // A. COMPUTER KEYBOARD EVENT LISTENERS
  // -------------------------------------------------------------
  const pressedCharKeys = new Set();

  window.addEventListener('keydown', (e) => {
    // Avoid triggering piano while user is typing in contact form inputs!
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    // Sustain pedal toggle on Spacebar
    if (e.code === 'Space') {
      e.preventDefault();
      audioEngine.toggleSustain(true);
      return;
    }

    const char = e.key.toUpperCase();
    if (charKeyMap[char] && !pressedCharKeys.has(char)) {
      e.preventDefault();
      pressedCharKeys.add(char);
      triggerKeyPress(charKeyMap[char]);
    }
  });

  window.addEventListener('keyup', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      audioEngine.toggleSustain(false);
      return;
    }

    const char = e.key.toUpperCase();
    if (charKeyMap[char]) {
      pressedCharKeys.delete(char);
      triggerKeyRelease(charKeyMap[char]);
    }
  });

  // -------------------------------------------------------------
  // B. MOUSE & TOUCH 3D RAYCASTING ON PIANO KEYS
  // -------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const mouseVec = new THREE.Vector2();
  let isPointerDown = false;
  let currentlyHoveredKey = null;

  function getIntersectedKey(event) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return null;

    mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouseVec, camera);

    // Collect all key meshes for raycasting
    const keyMeshes = allKeys.map(k => k.mesh);
    const intersects = raycaster.intersectObjects(keyMeshes, false);

    if (intersects.length > 0) {
      // Prioritize black keys if overlapping
      intersects.sort((a, b) => {
        const aBlack = a.object.userData.keyObject && a.object.userData.keyObject.isBlack;
        const bBlack = b.object.userData.keyObject && b.object.userData.keyObject.isBlack;
        return (bBlack ? 1 : 0) - (aBlack ? 1 : 0);
      });
      return intersects[0].object.userData.keyObject || null;
    }
    return null;
  }

  canvas.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    const key = getIntersectedKey(e);
    if (key) {
      currentlyHoveredKey = key;
      triggerKeyPress(key);
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    const key = getIntersectedKey(e);
    if (key !== currentlyHoveredKey) {
      if (currentlyHoveredKey) {
        triggerKeyRelease(currentlyHoveredKey);
      }
      currentlyHoveredKey = key;
      if (key) {
        triggerKeyPress(key);
      }
    }
  });

  window.addEventListener('pointerup', () => {
    if (isPointerDown) {
      isPointerDown = false;
      if (currentlyHoveredKey) {
        triggerKeyRelease(currentlyHoveredKey);
        currentlyHoveredKey = null;
      }
    }
  });

  // -------------------------------------------------------------
  // C. DEMO MELODIES AUTOPLAYER (Für Elise, Interstellar, Canon)
  // -------------------------------------------------------------
  let currentDemoTimeouts = [];

  function stopDemoMelody() {
    currentDemoTimeouts.forEach(t => clearTimeout(t));
    currentDemoTimeouts = [];
    allKeys.forEach(k => triggerKeyRelease(k));

    const stopBtn = document.getElementById('stop-demo-btn');
    if (stopBtn) stopBtn.style.display = 'none';

    document.querySelectorAll('.demo-buttons .hud-btn').forEach(b => b.classList.remove('active'));
  }

  function playMelodyNotes(sequence) {
    stopDemoMelody();
    audioEngine.ensureContext();

    const stopBtn = document.getElementById('stop-demo-btn');
    if (stopBtn) stopBtn.style.display = 'inline-flex';

    sequence.forEach(item => {
      const tPress = setTimeout(() => {
        const keyObj = noteKeyMap[item.note];
        if (keyObj) {
          triggerKeyPress(keyObj);
        }
      }, item.time);

      const tRelease = setTimeout(() => {
        const keyObj = noteKeyMap[item.note];
        if (keyObj) {
          triggerKeyRelease(keyObj);
        }
      }, item.time + item.duration);

      currentDemoTimeouts.push(tPress, tRelease);
    });

    // Cleanup at end of melody
    const totalDuration = sequence[sequence.length - 1].time + sequence[sequence.length - 1].duration + 300;
    const tEnd = setTimeout(stopDemoMelody, totalDuration);
    currentDemoTimeouts.push(tEnd);
  }

  // Beethoven's Für Elise
  const furEliseNotes = [
    { note: 'E5', time: 0, duration: 250 },
    { note: 'D#5', time: 280, duration: 250 },
    { note: 'E5', time: 560, duration: 250 },
    { note: 'D#5', time: 840, duration: 250 },
    { note: 'E5', time: 1120, duration: 250 },
    { note: 'B4', time: 1400, duration: 250 },
    { note: 'D5', time: 1680, duration: 250 },
    { note: 'C5', time: 1960, duration: 250 },
    { note: 'A4', time: 2240, duration: 600 },
    { note: 'C4', time: 3000, duration: 250 },
    { note: 'E4', time: 3280, duration: 250 },
    { note: 'A4', time: 3560, duration: 250 },
    { note: 'B4', time: 3840, duration: 600 },
    { note: 'E4', time: 4600, duration: 250 },
    { note: 'G#4', time: 4880, duration: 250 },
    { note: 'B4', time: 5160, duration: 250 },
    { note: 'C5', time: 5440, duration: 600 }
  ];

  // Hans Zimmer - Interstellar (First Step)
  const interstellarNotes = [
    { note: 'A4', time: 0, duration: 350 },
    { note: 'E5', time: 400, duration: 400 },
    { note: 'A4', time: 900, duration: 350 },
    { note: 'E5', time: 1300, duration: 400 },
    { note: 'F4', time: 1800, duration: 350 },
    { note: 'C5', time: 2200, duration: 400 },
    { note: 'F4', time: 2700, duration: 350 },
    { note: 'C5', time: 3100, duration: 400 },
    { note: 'G4', time: 3600, duration: 350 },
    { note: 'D5', time: 4000, duration: 400 },
    { note: 'G4', time: 4500, duration: 350 },
    { note: 'D5', time: 4900, duration: 400 },
    { note: 'E4', time: 5400, duration: 350 },
    { note: 'B4', time: 5800, duration: 700 }
  ];

  // Pachelbel's Canon in D
  const canonNotes = [
    { note: 'D5', time: 0, duration: 400 },
    { note: 'C#5', time: 450, duration: 400 },
    { note: 'B4', time: 900, duration: 400 },
    { note: 'A4', time: 1350, duration: 400 },
    { note: 'G4', time: 1800, duration: 400 },
    { note: 'F#4', time: 2250, duration: 400 },
    { note: 'G4', time: 2700, duration: 400 },
    { note: 'A4', time: 3150, duration: 600 }
  ];

  // Button Hooks
  const eliseBtn = document.getElementById('demo-elise-btn');
  const interstellarBtn = document.getElementById('demo-interstellar-btn');
  const canonBtn = document.getElementById('demo-canon-btn');
  const stopBtn = document.getElementById('stop-demo-btn');

  if (eliseBtn) {
    eliseBtn.addEventListener('click', () => {
      eliseBtn.classList.add('active');
      playMelodyNotes(furEliseNotes);
    });
  }
  if (interstellarBtn) {
    interstellarBtn.addEventListener('click', () => {
      interstellarBtn.classList.add('active');
      playMelodyNotes(interstellarNotes);
    });
  }
  if (canonBtn) {
    canonBtn.addEventListener('click', () => {
      canonBtn.classList.add('active');
      playMelodyNotes(canonNotes);
    });
  }
  if (stopBtn) {
    stopBtn.addEventListener('click', stopDemoMelody);
  }

  // Sustain Pedal UI Button
  const pedalBtn = document.getElementById('sustain-pedal-btn');
  if (pedalBtn) {
    pedalBtn.addEventListener('click', () => {
      audioEngine.toggleSustain();
    });
  }

  // Octave Picker UI Buttons
  const octDownBtn = document.getElementById('octave-down-btn');
  const octUpBtn = document.getElementById('octave-up-btn');
  let currentOct = 4;

  if (octDownBtn) {
    octDownBtn.addEventListener('click', () => {
      if (currentOct > 3) {
        currentOct--;
        audioEngine.setOctave(Math.pow(2, currentOct - 4), currentOct);
      }
    });
  }
  if (octUpBtn) {
    octUpBtn.addEventListener('click', () => {
      if (currentOct < 5) {
        currentOct++;
        audioEngine.setOctave(Math.pow(2, currentOct - 4), currentOct);
      }
    });
  }

  // Audio Toggle Button in Nav
  const audioNavBtn = document.getElementById('piano-sound-toggle');
  if (audioNavBtn) {
    audioNavBtn.addEventListener('click', () => {
      audioEngine.toggleMute();
    });
  }
}

/* ==========================================================================
   5. NAVIGATION & MOBILE DRAWER
   ========================================================================== */
function initNavigation() {
  const mainNav = document.getElementById('main-nav');
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  // Sticky navbar shadow styling on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      mainNav.classList.add('scrolled');
    } else {
      mainNav.classList.remove('scrolled');
    }
  });

  // Mobile Drawer Toggle
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
      mobileToggle.classList.toggle('active');
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileToggle.classList.remove('active');
      });
    });
  }
}

/* ==========================================================================
   6. PRINTABLE RESUME & CV MODAL
   ========================================================================== */
function initResumeModal() {
  const modal = document.getElementById('resume-modal');
  const openNavBtn = document.getElementById('open-resume-btn');
  const openHeroBtn = document.getElementById('hero-resume-btn');
  const openMobileBtn = document.getElementById('mobile-resume-btn');
  const closeBtn = document.getElementById('close-resume-btn');
  const printBtn = document.getElementById('print-cv-btn');

  function openModal() {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Lock background scroll
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (openNavBtn) openNavBtn.addEventListener('click', openModal);
  if (openHeroBtn) openHeroBtn.addEventListener('click', openModal);
  if (openMobileBtn) {
    openMobileBtn.addEventListener('click', () => {
      const drawer = document.getElementById('mobile-drawer');
      if (drawer) drawer.classList.remove('open');
      openModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // Print Action (invokes native browser print dialog formatted by @media print)
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

/* ==========================================================================
   7. CONTACT FORM HANDLER
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');
  if (!form || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const subject = document.getElementById('contact-subject').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      feedback.style.display = 'block';
      feedback.className = 'form-feedback-message';
      feedback.style.background = 'rgba(220, 53, 69, 0.15)';
      feedback.style.borderColor = 'rgba(220, 53, 69, 0.4)';
      feedback.style.color = '#ea868f';
      feedback.textContent = 'Please fill in all required fields.';
      return;
    }

    // Success confirmation with direct mailto fallback option
    feedback.className = 'form-feedback-message success';
    feedback.innerHTML = `
      ✓ Thank you, <strong>${escapeHtml(name)}</strong>! Your message has been received.<br>
      A direct draft will also open in your email client for <em>roshanarul53124@gmail.com</em>.
    `;
    feedback.style.display = 'block';

    // Open mailto link
    const mailtoUri = `mailto:roshanarul53124@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${name} (${email})\n\nMessage:\n${message}`)}`;
    setTimeout(() => {
      window.location.href = mailtoUri;
    }, 900);

    form.reset();
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}
