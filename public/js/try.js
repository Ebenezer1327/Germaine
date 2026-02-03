
// import './style.css'
import * as THREE from "https://cdn.skypack.dev/three@0.132.2";

import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js";


// import { Geometry, TetrahedronGeometry } from 'three'

/**
 * Base
 */
// Debug

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//galaxy
const parameters = {}
parameters.count = 100000;
parameters.size = 0.01;
parameters.radius = 2.15; 
parameters.branches = 3; 
parameters.spin = 3;
parameters.randomness = 5;
parameters.randomnessPower = 4;
parameters.insideColor = '#ff6030';
parameters.outsideColor = '#0949f0';

let material = null; 
let geometry = null; 
let points = null; 

const generateGalaxy = () => {
    
if(points !== null){
    geometry.dispose();
    material.dispose();
    scene.remove(points);
}
material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
})

    geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(parameters.count * 3);

    const colors = new Float32Array(parameters.count * 3);
    const colorInside = new THREE.Color(parameters.insideColor);
    const colorOutside = new THREE.Color(parameters.outsideColor);


    for(let i=0; i<parameters.count; i++){
        const i3 = i*3;
        const radius = Math.pow(Math.random()*parameters.randomness, Math.random()*parameters.radius);
        const spinAngle = radius*parameters.spin;
        const branchAngle = ((i%parameters.branches)/parameters.branches)*Math.PI*2;
        

        const negPos = [1,-1];
        const randomX = Math.pow(Math.random(), parameters.randomnessPower)*negPos[Math.floor(Math.random() * negPos.length)];
        const randomY = Math.pow(Math.random(), parameters.randomnessPower)*negPos[Math.floor(Math.random() * negPos.length)];
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower)*negPos[Math.floor(Math.random() * negPos.length)];

        positions[i3] = Math.cos(branchAngle + spinAngle)*(radius) + randomX;
        positions[i3+1] = randomY;
        positions[i3+2] = Math.sin(branchAngle + spinAngle)*(radius) + randomZ;

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, Math.random()*radius/parameters.radius);

        colors[i3] = mixedColor.r;
        colors[i3+1] = mixedColor.g;
        colors[i3+2] = mixedColor.b;
        
        
    }
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));

    points = new THREE.Points(geometry, material);
    scene.add(points);

}
generateGalaxy();

/**
 * 3D Stars
 */
const starCount = 8000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const i3 = i * 3;
  const radius = 15 + Math.random() * 25;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  starPositions[i3 + 2] = radius * Math.cos(phi);

  const brightness = 0.6 + Math.random() * 0.5;
  starColors[i3] = brightness;
  starColors[i3 + 1] = brightness;
  starColors[i3 + 2] = 0.9 + Math.random() * 0.1;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starMaterial = new THREE.PointsMaterial({
  size: 0.08,
  sizeAttenuation: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
  transparent: true,
  opacity: 0.9
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Memory Lane text removed - caption modal for photos instead

// Globes removed per user request
function _removedGlobeTexture(baseColor, pattern) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;

  if (pattern === 'hearts') {
    for (let i = 0; i < 12; i++) {
      const x = 40 + (i % 4) * 60;
      const y = 40 + Math.floor(i / 4) * 80;
      ctx.beginPath();
      ctx.moveTo(x, y + 8);
      ctx.bezierCurveTo(x, y, x + 12, y - 4, x + 12, y + 6);
      ctx.bezierCurveTo(x + 12, y + 14, x, y + 20, x, y + 8);
      ctx.bezierCurveTo(x, y + 20, x - 12, y + 14, x - 12, y + 6);
      ctx.bezierCurveTo(x - 12, y - 4, x, y, x, y + 8);
      ctx.fill();
      ctx.stroke();
    }
  } else if (pattern === 'stars') {
    for (let i = 0; i < 15; i++) {
      const x = 30 + Math.random() * 200;
      const y = 30 + Math.random() * 200;
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * Math.PI * 2 - Math.PI / 2;
        const r = j % 2 === 0 ? 10 : 4;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (pattern === 'dots') {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        ctx.beginPath();
        ctx.arc(32 + i * 28, 32 + j * 28, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  } else if (pattern === 'flowers') {
    for (let i = 0; i < 12; i++) {
      const x = 50 + (i % 4) * 55;
      const y = 50 + Math.floor(i / 4) * 75;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 12, y + Math.sin(a) * 12, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === 'waves') {
    for (let row = 0; row < 4; row++) {
      ctx.beginPath();
      ctx.moveTo(0, 40 + row * 55);
      for (let x = 0; x <= 256; x += 20) {
        ctx.lineTo(x, 40 + row * 55 + Math.sin(x * 0.05) * 15);
      }
      ctx.stroke();
    }
  } else if (pattern === 'grid') {
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(32 * i, 0);
      ctx.lineTo(32 * i, 256);
      ctx.stroke();
      ctx.moveTo(0, 32 * i);
      ctx.lineTo(256, 32 * i);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Memory Lane - multiple photos floating in the galaxy
 */
const clickableObjects = [];

const MEMORY_LANE_PHOTOS = [
  { id: 'memory-lane-fireworks', src: '/images/memory-lane-fireworks.png', pos: [-3, 0.02, 2] },
  { id: 'memory-lane-flyer', src: '/images/memory-lane-flyer.png', pos: [3, 0.02, -2] }
];

const photoLoader = new THREE.TextureLoader();
MEMORY_LANE_PHOTOS.forEach((p) => {
  photoLoader.load(p.src, (tex) => {
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1, -1);
    tex.offset.set(0, 1);

    const photoGeo = new THREE.PlaneGeometry(2, 2.5);
    const photoMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(photoGeo, photoMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
    mesh.userData = { isPhoto: true, photoId: p.id };
    clickableObjects.push(mesh);
    scene.add(mesh);
  }, undefined, () => { /* skip if load fails */ });
});

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera - top-down view so "Memory Lane" is readable from above
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 8, 0)
camera.up.set(-1, 0, 8)
camera.lookAt(0, 0, 0)
scene.add(camera)

// Controls - allow zoom so user can zoom in to see "Memory Lane"
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.minDistance = 2
controls.maxDistance = 20

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

function onPointerMove(e) {
  mouse.x = (e.clientX / sizes.width) * 2 - 1
  mouse.y = -(e.clientY / sizes.height) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects(clickableObjects)
  canvas.style.cursor = hits.length ? 'pointer' : 'default'
}

let cameraTarget = null
const DEFAULT_CAMERA = {
  position: new THREE.Vector3(0, 8, 0),
  lookAt: new THREE.Vector3(0, 0, 0)
}

function onPointerClick(e) {
  mouse.x = (e.clientX / sizes.width) * 2 - 1
  mouse.y = -(e.clientY / sizes.height) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects(clickableObjects)
  if (!hits.length) return

  const obj = hits[0].object
  if (obj.userData.isPhoto) {
    const pos = obj.position.clone()
    cameraTarget = {
      position: new THREE.Vector3(pos.x, 3, pos.z),
      lookAt: pos
    }
    openCaptionModal(obj.userData.photoId)
  }
}

const CAPTION_KEY = 'memory_lane_captions'
const DEFAULT_CAPTIONS = {
  'memory-lane-fireworks': "First NDP Fireworks with you HAHA i was soooo nervous to even take picture with you but i really enjoyed my time yapping with you!. Besides that, your miniso fan was a life saviour but that wasnt rlly the point, the thing i was focusing on was you being super sweet to bring the fan for me because you know i sweat alot. OOO and shoutout to my dad for fetching us home that day too because 502 highkey set us up... but it means more time with you HEHE. Overall it was a very enjoyable and cute day\n\n3 August 2024",
  'memory-lane-flyer': "Singapore flyers or Ferris Wheel with you, experience was really nice tho and the view i had that day was SOOO bombz because of a specific someone... but anw also SHOUTOUT to BYD food hehe it was worth it iw to eat the $9.90 steak again.\n\n7 September 2024"
}

// Sync stored captions with defaults for all Memory Lane photos
try {
  const stored = JSON.parse(localStorage.getItem(CAPTION_KEY) || '{}')
  Object.keys(DEFAULT_CAPTIONS).forEach((id) => {
    stored[id] = DEFAULT_CAPTIONS[id]
  })
  localStorage.setItem(CAPTION_KEY, JSON.stringify(stored))
} catch (e) {}

function getCaption(photoId) {
  try {
    const stored = JSON.parse(localStorage.getItem(CAPTION_KEY) || '{}')
    return stored[photoId] || DEFAULT_CAPTIONS[photoId] || ''
  } catch (e) { return '' }
}

function saveCaption(photoId, text) {
  try {
    const stored = JSON.parse(localStorage.getItem(CAPTION_KEY) || '{}')
    stored[photoId] = text
    localStorage.setItem(CAPTION_KEY, JSON.stringify(stored))
  } catch (e) {}
}

function openCaptionModal(photoId) {
  const panel = document.getElementById('photo-detail-panel')
  const display = document.getElementById('photo-caption-display')
  if (!panel || !display) return
  panel.dataset.photoId = photoId
  const raw = getCaption(photoId) || 'No caption for this memory.'
  const parts = raw.split(/\n\n/)
  display.textContent = ''
  display.appendChild(document.createTextNode(parts[0] || raw))
  if (parts[1]) {
    display.appendChild(document.createElement('br'))
    display.appendChild(document.createElement('br'))
    const strong = document.createElement('strong')
    strong.textContent = parts[1]
    display.appendChild(strong)
  }
  panel.classList.add('open')
  panel.setAttribute('aria-hidden', 'false')
}

function closeCaptionModal() {
  const panel = document.getElementById('photo-detail-panel')
  if (!panel) return
  panel.classList.remove('open')
  panel.setAttribute('aria-hidden', 'true')
  // Zoom camera back to default view
  cameraTarget = {
    position: DEFAULT_CAMERA.position.clone(),
    lookAt: DEFAULT_CAMERA.lookAt.clone()
  }
}

function initCaptionModal() {
  const panel = document.getElementById('photo-detail-panel')
  const closeBtn = document.getElementById('photo-detail-close')

  if (!panel) return

  closeBtn?.addEventListener('click', closeCaptionModal)
}

initCaptionModal()

canvas.addEventListener('pointermove', onPointerMove)
canvas.addEventListener('click', onPointerClick)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    if (cameraTarget) {
      const speed = 0.05
      camera.position.lerp(cameraTarget.position, speed)
      controls.target.lerp(cameraTarget.lookAt, speed)
      if (camera.position.distanceTo(cameraTarget.position) < 0.1) {
        cameraTarget = null
      }
    } else {
      controls.update()
    }

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()
