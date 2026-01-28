import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("rabbit-canvas");
  if (!container) return;

  const width = container.clientWidth || 220;
  const height = container.clientHeight || 220;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.set(0, 1.3, 4.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffc0cb, 1.1);
  hemiLight.position.set(0, 2, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffcce5, 1);
  dirLight.position.set(1.5, 2.5, 4);
  scene.add(dirLight);

  const group = new THREE.Group();
  scene.add(group);

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.1,
  });
  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xffc4dd,
    roughness: 0.5,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x3b2034,
    roughness: 0.6,
  });

  // Snowy the rabbit (left side)
  const bodyGeo = new THREE.SphereGeometry(0.9, 32, 32);
  const body = new THREE.Mesh(bodyGeo, whiteMat);
  body.position.set(-0.6, -0.3, 0);
  group.add(body);

  const headGeo = new THREE.SphereGeometry(0.75, 32, 32);
  const head = new THREE.Mesh(headGeo, whiteMat);
  head.position.set(-0.6, 0.65, 0.1);
  group.add(head);

  // Ears built from cylinders + spheres (for wider compatibility)
  function makeEar() {
    const earGroup = new THREE.Group();
    const earStemGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.9, 16);
    const earStem = new THREE.Mesh(earStemGeo, whiteMat);
    earStem.position.y = 0.45;
    earGroup.add(earStem);

    const earTipGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const earTip = new THREE.Mesh(earTipGeo, whiteMat);
    earTip.position.y = 0.9;
    earGroup.add(earTip);

    const innerGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.7, 16);
    const inner = new THREE.Mesh(innerGeo, pinkMat);
    inner.position.y = 0.4;
    inner.position.z = 0.03;
    earGroup.add(inner);

    return earGroup;
  }

  const leftEar = makeEar();
  leftEar.position.set(-0.95, 1.1, 0);
  leftEar.rotation.z = 0.35;
  group.add(leftEar);

  const rightEar = makeEar();
  rightEar.position.set(-0.25, 1.1, 0);
  rightEar.rotation.z = -0.35;
  group.add(rightEar);

  const eyeWhiteGeo = new THREE.SphereGeometry(0.09, 16, 16);
  const eyePupilGeo = new THREE.SphereGeometry(0.05, 16, 16);

  function makeEye(localX) {
    const eyeGroup = new THREE.Group();
    const white = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    white.position.set(localX, 0.78, 0.72);
    eyeGroup.add(white);

    const pupil = new THREE.Mesh(eyePupilGeo, darkMat);
    pupil.position.set(localX, 0.8, 0.8);
    eyeGroup.add(pupil);

    return eyeGroup;
  }

  const leftEye = makeEye(-0.26 - 0.6);
  const rightEye = makeEye(0.26 - 0.6);
  group.add(leftEye);
  group.add(rightEye);

  const noseGeo = new THREE.SphereGeometry(0.09, 16, 16);
  const nose = new THREE.Mesh(noseGeo, pinkMat);
  nose.position.set(-0.6, 0.6, 0.78);
  group.add(nose);

  // Small smiling mouth under the nose (more visible)
  const mouthGeo = new THREE.TorusGeometry(0.18, 0.03, 16, 32, Math.PI);
  const mouth = new THREE.Mesh(mouthGeo, darkMat);
  mouth.rotation.x = Math.PI / 2;
  mouth.position.set(-0.6, 0.46, 0.82);
  group.add(mouth);

  const blushGeo = new THREE.SphereGeometry(0.11, 16, 16);
  const blushLeft = new THREE.Mesh(blushGeo, pinkMat.clone());
  blushLeft.material.transparent = true;
  blushLeft.material.opacity = 0.55;
  blushLeft.position.set(-0.94, 0.55, 0.6);
  group.add(blushLeft);

  const blushRight = blushLeft.clone();
  blushRight.position.x = -0.26;
  group.add(blushRight);

  const pawGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const leftPaw = new THREE.Mesh(pawGeo, whiteMat);
  leftPaw.position.set(-0.98, -0.9, 0.55);
  group.add(leftPaw);

  const rightPaw = leftPaw.clone();
  rightPaw.position.x = -0.22;
  group.add(rightPaw);

  // Girl figure with glasses (right side)
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffe0cf,
    roughness: 0.55,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x403046,
    roughness: 0.7,
  });
  const outfitMat = new THREE.MeshStandardMaterial({
    color: 0xffb7dd,
    roughness: 0.35,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
  });

  // Bondee-style torso (short & chunky, standing upright)
  const torsoGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.9, 24);
  const torso = new THREE.Mesh(torsoGeo, outfitMat);
  torso.position.set(0.7, -0.15, 0);
  group.add(torso);

  // Large round head
  const girlHeadGeo = new THREE.SphereGeometry(0.6, 32, 32);
  const girlHead = new THREE.Mesh(girlHeadGeo, skinMat);
  girlHead.position.set(0.7, 0.7, 0.15);
  group.add(girlHead);

  // Voluminous hair cap (no fringe covering face)
  const hairGeo = new THREE.SphereGeometry(0.68, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.2);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0.7, 0.85, -0.05);
  hair.rotation.x = 0.05;
  group.add(hair);

  // Additional volume layer on top
  const hairTopGeo = new THREE.SphereGeometry(0.65, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.4);
  const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
  hairTop.position.set(0.7, 0.88, -0.08);
  hairTop.rotation.x = 0.03;
  group.add(hairTop);

  // Cute visible hair pin (small heart) on left side
  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xff8fbf,
    roughness: 0.25,
    metalness: 0.35,
  });

  const pinCircleGeo = new THREE.SphereGeometry(0.09, 16, 16);
  const pinLeft = new THREE.Mesh(pinCircleGeo, pinMat);
  // Bring the pin clearly in front of the hair, near the left side of the face
  pinLeft.position.set(0.58, 0.82, 0.6);
  group.add(pinLeft);

  const pinRight = new THREE.Mesh(pinCircleGeo, pinMat);
  pinRight.position.set(0.66, 0.82, 0.6);
  group.add(pinRight);

  const pinHeartTipGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const pinTip = new THREE.Mesh(pinHeartTipGeo, pinMat);
  pinTip.position.set(0.62, 0.79, 0.64);
  group.add(pinTip);

  // Long flowing hair strands on both sides (much longer)
  const strandGeo = new THREE.CylinderGeometry(0.16, 0.14, 1.8, 16);
  const leftStrand1 = new THREE.Mesh(strandGeo, hairMat);
  leftStrand1.position.set(0.42, -0.3, 0.08);
  leftStrand1.rotation.z = 0.2;
  group.add(leftStrand1);

  const leftStrand2 = new THREE.Mesh(strandGeo, hairMat);
  leftStrand2.position.set(0.48, -0.25, 0.12);
  leftStrand2.rotation.z = 0.1;
  group.add(leftStrand2);

  const rightStrand1 = new THREE.Mesh(strandGeo, hairMat);
  rightStrand1.position.set(0.98, -0.3, 0.08);
  rightStrand1.rotation.z = -0.2;
  group.add(rightStrand1);

  const rightStrand2 = new THREE.Mesh(strandGeo, hairMat);
  rightStrand2.position.set(0.92, -0.25, 0.12);
  rightStrand2.rotation.z = -0.1;
  group.add(rightStrand2);

  // Back long hair flowing down
  const backHairGeo = new THREE.CylinderGeometry(0.18, 0.16, 1.6, 16);
  const backHair = new THREE.Mesh(backHairGeo, hairMat);
  backHair.position.set(0.7, -0.2, -0.15);
  backHair.rotation.x = 0.1;
  group.add(backHair);

  // Eyes for girl
  const gEyeWhiteGeo = new THREE.SphereGeometry(0.09, 16, 16);
  const gEyePupilGeo = new THREE.SphereGeometry(0.05, 16, 16);

  function makeGirlEye(offsetX) {
    const eyeGroup = new THREE.Group();
    const white = new THREE.Mesh(gEyeWhiteGeo, whiteMat);
    white.position.set(0.7 + offsetX, 0.78, 0.62);
    eyeGroup.add(white);

    const pupil = new THREE.Mesh(gEyePupilGeo, darkMat);
    pupil.position.set(0.7 + offsetX, 0.8, 0.7);
    eyeGroup.add(pupil);

    return eyeGroup;
  }

  const girlLeftEye = makeGirlEye(-0.12);
  const girlRightEye = makeGirlEye(0.12);
  group.add(girlLeftEye);
  group.add(girlRightEye);

  // Small smiling mouth for the girl
  const girlMouthGeo = new THREE.TorusGeometry(0.16, 0.03, 16, 32, Math.PI);
  const girlMouth = new THREE.Mesh(girlMouthGeo, darkMat);
  girlMouth.rotation.x = Math.PI / 2;
  girlMouth.position.set(0.7, 0.52, 0.68);
  group.add(girlMouth);

  // (Glasses removed by request)

  // Simple arms / sleeves (short & rounded)
  const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.55, 16);
  const leftArm = new THREE.Mesh(armGeo, outfitMat);
  leftArm.position.set(0.35, 0.05, 0.18);
  leftArm.rotation.set(0.4, 0.15, 0.7);
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, outfitMat);
  rightArm.position.set(1.05, 0.05, 0.18);
  rightArm.rotation.set(0.4, -0.15, -0.7);
  group.add(rightArm);

  // Hands at the end of the arms (skin tone), brought to the front
  const handGeo = new THREE.SphereGeometry(0.13, 18, 18);
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(0.32, -0.25, 0.55);
  group.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.set(1.08, -0.25, 0.55);
  group.add(rightHand);

  // Legs (more visible and standing upright)
  const legGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.65, 16);
  const leftLeg = new THREE.Mesh(legGeo, outfitMat);
  leftLeg.position.set(0.55, -0.8, 0.15);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, outfitMat);
  rightLeg.position.set(0.85, -0.8, 0.15);
  group.add(rightLeg);

  // Shoes (more visible)
  const shoeGeo = new THREE.SphereGeometry(0.24, 16, 16);
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(0.55, -1.15, 0.4);
  group.add(leftShoe);

  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0.85, -1.15, 0.4);
  group.add(rightShoe);

  // Face the camera directly
  group.rotation.set(0, 0, 0);

  function onResize() {
    const w = container.clientWidth || width;
    const h = container.clientHeight || height;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener("resize", onResize);

  // Simple breathing animation without spinning
  function animate() {
    requestAnimationFrame(animate);
    const t = Date.now() * 0.0012;
    group.position.y = 0.03 * Math.sin(t);
    renderer.render(scene, camera);
  }

  animate();
});

