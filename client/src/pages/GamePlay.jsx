import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'

// ─── Game metadata ────────────────────────────────────────────────────────────
const GAME_INFO = {
  obby: {
    title: 'Obstacle Course',
    controls: 'WASD / Arrows: Move   |   Space: Jump',
    color: '#ff6b35',
  },
  sandbox: {
    title: 'Sandbox Builder',
    controls: 'WASD: Pan Camera   |   Left Click: Place Block   |   Right Click: Remove   |   Scroll: Zoom',
    color: '#4caf50',
  },
  racing: {
    title: 'Racing Circuit',
    controls: 'W/↑: Accelerate   |   S/↓: Brake   |   A/←D/→: Steer',
    color: '#2196f3',
  },
}

function getGameMode(id) {
  const n = parseInt(id, 10)
  if (n >= 1 && n <= 4) return 'obby'
  if (n >= 5 && n <= 8) return 'sandbox'
  if (n >= 9 && n <= 12) return 'racing'
  return 'obby'
}

// ─── OBBY ──────────────────────────────────────────────────────────────────
function initObby(scene, camera, renderer) {
  const state = {
    player: null,
    playerVelocity: new THREE.Vector3(),
    onGround: false,
    platforms: [],
    spawnPos: new THREE.Vector3(0, 2, 0),
    won: false,
    score: 0,
    keys: new Set(),
    animId: null,
    cleanupFns: [],
  }

  // Sky
  renderer.setClearColor(0x87ceeb)
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.018)

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambient)
  const sun = new THREE.DirectionalLight(0xffd580, 1.2)
  sun.position.set(40, 80, 40)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 0.5
  sun.shadow.camera.far = 400
  sun.shadow.camera.left = -100
  sun.shadow.camera.right = 100
  sun.shadow.camera.top = 100
  sun.shadow.camera.bottom = -100
  scene.add(sun)

  // Helper: create a platform
  function makePlatform(x, y, z, w, h, d, color) {
    const geo = new THREE.BoxGeometry(w, h, d)
    const mat = new THREE.MeshLambertMaterial({ color })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    state.platforms.push({ mesh, x, y: y + h / 2, z, w, d })
    return mesh
  }

  // Start platform (green)
  makePlatform(0, 0, 0, 8, 1, 8, 0x4caf50)

  // Course platforms – hand-crafted to be challenging but fun
  const course = [
    [8,  1,  0, 4, 1, 4, 0xff6b35],
    [14, 2,  2, 3, 1, 3, 0x2196f3],
    [19, 3, -1, 4, 1, 4, 0xf44336],
    [25, 4,  3, 3, 1, 3, 0x9c27b0],
    [30, 3,  0, 4, 1, 4, 0xff9800],
    [36, 5,  2, 3, 1, 3, 0x03a9f4],
    [42, 4, -2, 3, 1, 3, 0x8bc34a],
    [47, 6,  1, 4, 1, 4, 0xe91e63],
    [53, 5, -3, 3, 1, 3, 0xffeb3b],
    [58, 7,  2, 3, 1, 3, 0x00bcd4],
    [64, 6, -1, 4, 1, 4, 0xff5722],
    [70, 8,  3, 3, 1, 3, 0x673ab7],
    [76, 7,  0, 3, 1, 3, 0x4db6ac],
    [82, 9,  2, 4, 1, 4, 0xffc107],
    [88,10,  0, 4, 1, 4, 0x7c4dff],
    [94,11, -1, 3, 1, 3, 0xff6090],
    [100,12, 1, 5, 1, 5, 0x4caf50], // finish
  ]
  course.forEach(([x,y,z,w,h,d,c]) => makePlatform(x, y, z, w, h, d, c))

  // Finish flag
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 5)
  const poleMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const pole = new THREE.Mesh(poleGeo, poleMat)
  pole.position.set(100, 14.5, 0)
  scene.add(pole)
  const flagGeo = new THREE.PlaneGeometry(2, 1.5)
  const flagMat = new THREE.MeshLambertMaterial({ color: 0xff0000, side: THREE.DoubleSide })
  const flag = new THREE.Mesh(flagGeo, flagMat)
  flag.position.set(101, 16, 0)
  scene.add(flag)

  // Player (colored block: 1 × 2 × 1)
  const playerGeo = new THREE.BoxGeometry(1, 2, 1)
  const playerMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 })
  state.player = new THREE.Mesh(playerGeo, playerMat)
  state.player.castShadow = true
  state.player.position.copy(state.spawnPos)
  scene.add(state.player)

  // Camera initial
  camera.position.set(0, 6, 10)
  camera.lookAt(0, 2, 0)

  // Physics constants
  const GRAVITY = -28
  const JUMP_FORCE = 10
  const MOVE_SPEED = 7
  const PLAYER_HALF_H = 1   // half of 2-unit height
  const PLAYER_HALF_W = 0.5

  function respawn() {
    state.player.position.copy(state.spawnPos)
    state.playerVelocity.set(0, 0, 0)
    state.onGround = false
    state.won = false
  }

  function checkPlatformCollision(pos) {
    const bottom = pos.y - PLAYER_HALF_H
    for (const plat of state.platforms) {
      const halfW = plat.w / 2
      const halfD = plat.d / 2
      if (
        pos.x > plat.x - halfW - PLAYER_HALF_W &&
        pos.x < plat.x + halfW + PLAYER_HALF_W &&
        pos.z > plat.z - halfD - PLAYER_HALF_W &&
        pos.z < plat.z + halfD + PLAYER_HALF_W &&
        bottom <= plat.y + 0.15 &&
        bottom >= plat.y - 0.8
      ) {
        return plat.y
      }
    }
    return null
  }

  function checkWin(pos) {
    return pos.x > 97 && pos.x < 103 && pos.y > 11 && pos.y < 15
  }

  let lastTime = performance.now()

  function loop() {
    state.animId = requestAnimationFrame(loop)
    const now = performance.now()
    const dt = Math.min((now - lastTime) / 1000, 0.05)
    lastTime = now

    if (!state.won) {
      // Build move direction from keys
      const forward = new THREE.Vector3()
      const right = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

      const moveDir = new THREE.Vector3()
      if (state.keys.has('w') || state.keys.has('arrowup')) moveDir.add(forward)
      if (state.keys.has('s') || state.keys.has('arrowdown')) moveDir.sub(forward)
      if (state.keys.has('a') || state.keys.has('arrowleft')) moveDir.sub(right)
      if (state.keys.has('d') || state.keys.has('arrowright')) moveDir.add(right)

      if (moveDir.length() > 0) {
        moveDir.normalize().multiplyScalar(MOVE_SPEED)
        state.playerVelocity.x = moveDir.x
        state.playerVelocity.z = moveDir.z
        // Face direction of movement
        const angle = Math.atan2(moveDir.x, moveDir.z)
        state.player.rotation.y = angle
      } else {
        state.playerVelocity.x *= 0.8
        state.playerVelocity.z *= 0.8
      }

      // Gravity
      state.playerVelocity.y += GRAVITY * dt

      // Jump
      if ((state.keys.has(' ') || state.keys.has('space')) && state.onGround) {
        state.playerVelocity.y = JUMP_FORCE
        state.onGround = false
      }

      // Move player
      const newPos = state.player.position.clone()
      newPos.addScaledVector(state.playerVelocity, dt)

      // Platform collision (Y)
      state.onGround = false
      if (state.playerVelocity.y <= 0) {
        const platTop = checkPlatformCollision(newPos)
        if (platTop !== null) {
          newPos.y = platTop + PLAYER_HALF_H
          state.playerVelocity.y = 0
          state.onGround = true
        }
      }

      state.player.position.copy(newPos)

      // Fall → respawn
      if (state.player.position.y < -20) {
        respawn()
      }

      // Win check
      if (checkWin(state.player.position)) {
        state.won = true
        state.score = 1
      }
    }

    // Camera follow (third-person, behind player)
    const camOffset = new THREE.Vector3(0, 5, 10)
    camOffset.applyQuaternion(state.player.quaternion)
    const targetCamPos = state.player.position.clone().add(camOffset)
    camera.position.lerp(targetCamPos, 0.12)
    camera.lookAt(state.player.position.clone().add(new THREE.Vector3(0, 1, 0)))

    renderer.render(scene, camera)
  }

  // Keyboard listeners
  function onKeyDown(e) {
    state.keys.add(e.key.toLowerCase())
    if (e.key === ' ') e.preventDefault()
  }
  function onKeyUp(e) {
    state.keys.delete(e.key.toLowerCase())
  }
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  state.cleanupFns.push(() => {
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
    if (state.animId) cancelAnimationFrame(state.animId)
  })

  loop()
  return state
}

// ─── SANDBOX ──────────────────────────────────────────────────────────────
function initSandbox(scene, camera, renderer) {
  const state = {
    blocks: [],
    selectedColor: '#ff6b35',
    keys: new Set(),
    animId: null,
    cleanupFns: [],
    isDragging: false,
    lastMousePos: { x: 0, y: 0 },
    cameraTheta: 0,
    cameraPhi: Math.PI / 4,
    cameraRadius: 30,
    cameraTarget: new THREE.Vector3(0, 0, 0),
  }

  renderer.setClearColor(0x87ceeb)
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.008)

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambient)
  const sun = new THREE.DirectionalLight(0xffd580, 1.0)
  sun.position.set(60, 100, 60)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 400
  sun.shadow.camera.left = -80
  sun.shadow.camera.right = 80
  sun.shadow.camera.top = 80
  sun.shadow.camera.bottom = -80
  scene.add(sun)

  // Ground (large green plane)
  const groundGeo = new THREE.PlaneGeometry(100, 100)
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // Grid helper
  const grid = new THREE.GridHelper(100, 50, 0x388e3c, 0x388e3c)
  grid.position.y = 0.01
  scene.add(grid)

  // Ghost block (preview)
  const ghostGeo = new THREE.BoxGeometry(1, 1, 1)
  const ghostMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
  })
  const ghostBlock = new THREE.Mesh(ghostGeo, ghostMat)
  scene.add(ghostBlock)

  // Raycaster for block placement
  const raycaster = new THREE.Raycaster()

  // Snap to grid
  function snapToGrid(pos) {
    return new THREE.Vector3(
      Math.round(pos.x),
      Math.round(pos.y),
      Math.round(pos.z)
    )
  }

  // Find placement position from mouse
  function getPlacementPos(mouseX, mouseY, canvas) {
    const rect = canvas.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((mouseX - rect.left) / rect.width) * 2 - 1,
      -((mouseY - rect.top) / rect.height) * 2 + 1
    )
    raycaster.setFromCamera(ndc, camera)

    // Check existing blocks first
    const blockMeshes = state.blocks.map(b => b.mesh)
    const blockHits = raycaster.intersectObjects(blockMeshes)
    if (blockHits.length > 0) {
      const hit = blockHits[0]
      const pos = hit.object.position.clone().add(hit.face.normal)
      return { pos: snapToGrid(pos), existing: hit.object }
    }

    // Check ground
    const groundHits = raycaster.intersectObject(ground)
    if (groundHits.length > 0) {
      const pos = groundHits[0].point
      pos.y = 0.5
      return { pos: snapToGrid(pos), existing: null }
    }
    return null
  }

  // Place block
  function placeBlock(pos, color) {
    // Don't stack duplicate
    const existing = state.blocks.find(b =>
      b.mesh.position.x === pos.x &&
      b.mesh.position.y === pos.y &&
      b.mesh.position.z === pos.z
    )
    if (existing) return
    const geo = new THREE.BoxGeometry(1, 1, 1)
    const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(pos)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    state.blocks.push({ mesh, pos })
  }

  // Remove block
  function removeBlock(mesh) {
    scene.remove(mesh)
    mesh.geometry.dispose()
    mesh.material.dispose()
    const idx = state.blocks.findIndex(b => b.mesh === mesh)
    if (idx !== -1) state.blocks.splice(idx, 1)
  }

  // Mouse events
  let currentMouseX = 0, currentMouseY = 0

  function onMouseMove(e) {
    currentMouseX = e.clientX
    currentMouseY = e.clientY

    if (state.isDragging) {
      const dx = e.clientX - state.lastMousePos.x
      const dy = e.clientY - state.lastMousePos.y
      state.cameraTheta -= dx * 0.008
      state.cameraPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, state.cameraPhi - dy * 0.008))
      state.lastMousePos = { x: e.clientX, y: e.clientY }
    }
  }

  function onMouseDown(e) {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      state.isDragging = true
      state.lastMousePos = { x: e.clientX, y: e.clientY }
    } else if (e.button === 0) {
      // Place
      const result = getPlacementPos(e.clientX, e.clientY, renderer.domElement)
      if (result) placeBlock(result.pos, state.selectedColor)
    } else if (e.button === 2) {
      // Remove
      const rect = renderer.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(ndc, camera)
      const hits = raycaster.intersectObjects(state.blocks.map(b => b.mesh))
      if (hits.length > 0) removeBlock(hits[0].object)
    }
  }

  function onMouseUp() { state.isDragging = false }
  function onContextMenu(e) { e.preventDefault() }
  function onWheel(e) {
    state.cameraRadius = Math.max(5, Math.min(80, state.cameraRadius + e.deltaY * 0.05))
  }

  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mouseup', onMouseUp)
  renderer.domElement.addEventListener('contextmenu', onContextMenu)
  renderer.domElement.addEventListener('wheel', onWheel, { passive: true })

  // Keyboard pan
  function onKeyDown(e) { state.keys.add(e.key.toLowerCase()) }
  function onKeyUp(e) { state.keys.delete(e.key.toLowerCase()) }
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  state.cleanupFns.push(() => {
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('mousedown', onMouseDown)
    renderer.domElement.removeEventListener('mouseup', onMouseUp)
    renderer.domElement.removeEventListener('contextmenu', onContextMenu)
    renderer.domElement.removeEventListener('wheel', onWheel)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
    if (state.animId) cancelAnimationFrame(state.animId)
  })

  function loop() {
    state.animId = requestAnimationFrame(loop)

    // WASD camera pan
    const panSpeed = 0.15
    const panForward = new THREE.Vector3(
      Math.sin(state.cameraTheta), 0, Math.cos(state.cameraTheta)
    )
    const panRight = new THREE.Vector3(
      Math.cos(state.cameraTheta), 0, -Math.sin(state.cameraTheta)
    )
    if (state.keys.has('w') || state.keys.has('arrowup')) state.cameraTarget.addScaledVector(panForward, -panSpeed)
    if (state.keys.has('s') || state.keys.has('arrowdown')) state.cameraTarget.addScaledVector(panForward, panSpeed)
    if (state.keys.has('a') || state.keys.has('arrowleft')) state.cameraTarget.addScaledVector(panRight, -panSpeed)
    if (state.keys.has('d') || state.keys.has('arrowright')) state.cameraTarget.addScaledVector(panRight, panSpeed)

    // Orbit camera
    const cx = state.cameraTarget.x + state.cameraRadius * Math.sin(state.cameraPhi) * Math.sin(state.cameraTheta)
    const cy = state.cameraTarget.y + state.cameraRadius * Math.cos(state.cameraPhi)
    const cz = state.cameraTarget.z + state.cameraRadius * Math.sin(state.cameraPhi) * Math.cos(state.cameraTheta)
    camera.position.set(cx, cy, cz)
    camera.lookAt(state.cameraTarget)

    // Ghost block (preview)
    const result = getPlacementPos(currentMouseX, currentMouseY, renderer.domElement)
    if (result) {
      ghostBlock.position.copy(result.pos)
      ghostBlock.material.color.set(new THREE.Color(state.selectedColor))
      ghostBlock.visible = true
    } else {
      ghostBlock.visible = false
    }

    renderer.render(scene, camera)
  }

  loop()
  return state
}

// ─── RACING ───────────────────────────────────────────────────────────────
function initRacing(scene, camera, renderer) {
  const state = {
    car: null,
    carSpeed: 0,
    carAngle: 0,
    lapTime: 0,
    lapCount: 0,
    lastLapCheck: false,
    keys: new Set(),
    animId: null,
    cleanupFns: [],
    aiCars: [],
    aiProgress: [],
    trackPoints: [],
  }

  renderer.setClearColor(0x87ceeb)
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.006)

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const sun = new THREE.DirectionalLight(0xffd580, 1.2)
  sun.position.set(100, 150, 100)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 600
  sun.shadow.camera.left = -120
  sun.shadow.camera.right = 120
  sun.shadow.camera.top = 120
  sun.shadow.camera.bottom = -120
  scene.add(sun)

  // Ground (grass)
  const grassGeo = new THREE.PlaneGeometry(300, 300)
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 })
  const grass = new THREE.Mesh(grassGeo, grassMat)
  grass.rotation.x = -Math.PI / 2
  grass.receiveShadow = true
  scene.add(grass)

  // Track: oval loop made of road segments
  // Define track center-line as a series of points
  const trackWidth = 16
  const numStraights = 32

  // Build oval: two long straights + two semicircles
  const centerLine = []
  // Front straight (Z = -trackRadius+20 ... +trackRadius-20, X = 0)
  // Oval: parametric
  for (let i = 0; i <= numStraights; i++) {
    const t = (i / numStraights) * Math.PI * 2
    centerLine.push(new THREE.Vector3(
      Math.sin(t) * 80,
      0,
      Math.cos(t) * 50
    ))
  }
  state.trackPoints = centerLine

  // Build road segments
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x555555 })
  const lineMat = new THREE.MeshLambertMaterial({ color: 0xffff00 })

  for (let i = 0; i < centerLine.length - 1; i++) {
    const a = centerLine[i]
    const b = centerLine[i + 1]
    const dir = b.clone().sub(a).normalize()
    const len = a.distanceTo(b)

    // Road segment
    const seg = new THREE.Mesh(
      new THREE.PlaneGeometry(len + 0.1, trackWidth),
      roadMat
    )
    seg.rotation.x = -Math.PI / 2
    seg.position.set((a.x + b.x) / 2, 0.02, (a.z + b.z) / 2)
    const angle = Math.atan2(dir.x, dir.z)
    seg.rotation.z = angle
    seg.receiveShadow = true
    scene.add(seg)

    // Center line dash (every other)
    if (i % 3 === 0) {
      const dash = new THREE.Mesh(
        new THREE.PlaneGeometry(len * 0.5, 0.4),
        lineMat
      )
      dash.rotation.x = -Math.PI / 2
      dash.position.set((a.x + b.x) / 2, 0.04, (a.z + b.z) / 2)
      dash.rotation.z = angle
      scene.add(dash)
    }
  }

  // Start/finish line
  const sfMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const sf = new THREE.Mesh(new THREE.PlaneGeometry(0.8, trackWidth), sfMat)
  sf.rotation.x = -Math.PI / 2
  sf.position.set(centerLine[0].x, 0.05, centerLine[0].z)
  scene.add(sf)

  // Player car
  function makeCar(color, x, z) {
    const carGroup = new THREE.Group()
    // Body
    const bodyGeo = new THREE.BoxGeometry(2.2, 0.7, 4)
    const bodyMat = new THREE.MeshLambertMaterial({ color })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.5
    body.castShadow = true
    carGroup.add(body)
    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.6, 2)
    const cabinMat = new THREE.MeshLambertMaterial({ color: 0xaaddff })
    const cabin = new THREE.Mesh(cabinGeo, cabinMat)
    cabin.position.set(0, 1.05, -0.2)
    cabin.castShadow = true
    carGroup.add(cabin)
    // Wheels (4)
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12)
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 })
    const wheelPositions = [[-1.2, 0.35, 1.2], [1.2, 0.35, 1.2], [-1.2, 0.35, -1.2], [1.2, 0.35, -1.2]]
    for (const [wx, wy, wz] of wheelPositions) {
      const w = new THREE.Mesh(wheelGeo, wheelMat)
      w.rotation.z = Math.PI / 2
      w.position.set(wx, wy, wz)
      w.castShadow = true
      carGroup.add(w)
    }
    carGroup.position.set(x, 0, z)
    scene.add(carGroup)
    return carGroup
  }

  state.car = makeCar(0xff6b35, centerLine[0].x, centerLine[0].z)
  // Set initial car orientation along track
  const dir0 = centerLine[1].clone().sub(centerLine[0]).normalize()
  state.carAngle = Math.atan2(dir0.x, dir0.z)
  state.car.rotation.y = state.carAngle

  // AI cars
  const aiColors = [0x2196f3, 0x9c27b0, 0xf44336]
  const aiOffsets = [0.1, 0.2, 0.3]
  for (let i = 0; i < 3; i++) {
    const startIdx = Math.floor(aiOffsets[i] * centerLine.length)
    const sp = centerLine[startIdx % (centerLine.length - 1)]
    const aiCar = makeCar(aiColors[i], sp.x, sp.z)
    state.aiCars.push(aiCar)
    state.aiProgress.push(aiOffsets[i])
  }

  // Keyboard
  function onKeyDown(e) { state.keys.add(e.key.toLowerCase()) }
  function onKeyUp(e) { state.keys.delete(e.key.toLowerCase()) }
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  state.cleanupFns.push(() => {
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
    if (state.animId) cancelAnimationFrame(state.animId)
  })

  const MAX_SPEED = 30
  const ACCEL = 18
  const BRAKE = 24
  const DRAG = 6
  const TURN_SPEED = 1.8
  let playerProgress = 0 // eslint-disable-line no-unused-vars
  let lastTime2 = performance.now()

  function updateCarAlongTrack(progress, car) {
    const pts = state.trackPoints
    const n = pts.length - 1
    const t = ((progress % 1) + 1) % 1
    const idx = Math.floor(t * n)
    const nextIdx = (idx + 1) % n
    const frac = t * n - idx
    const pos = pts[idx].clone().lerp(pts[nextIdx], frac)
    car.position.set(pos.x, 0, pos.z)
    const dir = pts[nextIdx].clone().sub(pts[idx]).normalize()
    const angle = Math.atan2(dir.x, dir.z)
    car.rotation.y = angle
  }

  function loop() {
    state.animId = requestAnimationFrame(loop)
    const now = performance.now()
    const dt = Math.min((now - lastTime2) / 1000, 0.05)
    lastTime2 = now
    state.lapTime += dt

    // Player input
    const accel = state.keys.has('w') || state.keys.has('arrowup')
    const brake = state.keys.has('s') || state.keys.has('arrowdown')
    const left = state.keys.has('a') || state.keys.has('arrowleft')
    const right = state.keys.has('d') || state.keys.has('arrowright')

    if (accel) {
      state.carSpeed = Math.min(MAX_SPEED, state.carSpeed + ACCEL * dt)
    } else if (brake) {
      state.carSpeed = Math.max(-MAX_SPEED * 0.4, state.carSpeed - BRAKE * dt)
    } else {
      state.carSpeed *= Math.pow(1 - DRAG / MAX_SPEED, dt * 60 / 60)
      if (Math.abs(state.carSpeed) < 0.1) state.carSpeed = 0
    }

    if (Math.abs(state.carSpeed) > 0.5) {
      const turn = TURN_SPEED * dt * Math.sign(state.carSpeed)
      if (left) state.carAngle += turn
      if (right) state.carAngle -= turn
    }

    state.car.rotation.y = state.carAngle

    // Move car
    const moveX = Math.sin(state.carAngle) * state.carSpeed * dt
    const moveZ = Math.cos(state.carAngle) * state.carSpeed * dt
    state.car.position.x += moveX
    state.car.position.z += moveZ

    // Track progress (for lap detection - find closest point)
    playerProgress += (state.carSpeed / (Math.PI * 2 * 80)) * dt

    // Lap detection: player crosses start/finish
    const distToStart = state.car.position.distanceTo(centerLine[0])
    if (distToStart < 6) {
      if (!state.lastLapCheck) {
        if (state.lapTime > 5) {
          state.lapCount++
          state.lapTime = 0
        }
        state.lastLapCheck = true
      }
    } else {
      state.lastLapCheck = false
    }

    // AI movement
    for (let i = 0; i < state.aiCars.length; i++) {
      state.aiProgress[i] += (0.0003 + i * 0.00005)
      updateCarAlongTrack(state.aiProgress[i], state.aiCars[i])
    }

    // Third-person camera behind car
    const camDist = 12
    const camHeight = 5
    const camX = state.car.position.x - Math.sin(state.carAngle) * camDist
    const camZ = state.car.position.z - Math.cos(state.carAngle) * camDist
    const targetCamPos = new THREE.Vector3(camX, state.car.position.y + camHeight, camZ)
    camera.position.lerp(targetCamPos, 0.1)
    camera.lookAt(state.car.position.clone().add(new THREE.Vector3(0, 1, 0)))

    renderer.render(scene, camera)
  }

  loop()
  return state
}

// ─── Avatar color helper ──────────────────────────────────────────────────────
function playerColor(str = '') {
  const palette = [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
    '#1abc9c', '#3498db', '#9b59b6', '#e91e63',
    '#00bcd4', '#ff5722', '#8bc34a', '#673ab7',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

// ─── Players Online Panel ─────────────────────────────────────────────────────
function PlayersPanel({ players, currentUsername, isOffline }) {
  return (
    <div style={{
      position: 'fixed',
      top: 68,
      right: 12,
      width: 200,
      background: 'rgba(10, 10, 24, 0.82)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      overflow: 'hidden',
      zIndex: 200,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: 13 }}>🎮</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>
          Players ({isOffline ? '—' : players.length})
        </span>
      </div>

      {/* List */}
      <div style={{ maxHeight: 260, overflowY: 'auto', padding: '6px 0' }}>
        {isOffline ? (
          <div style={{ padding: '10px 12px', color: '#555577', fontSize: 11, textAlign: 'center' }}>
            Offline mode
          </div>
        ) : players.length === 0 ? (
          <div style={{ padding: '10px 12px', color: '#555577', fontSize: 11, textAlign: 'center' }}>
            Waiting for players…
          </div>
        ) : (
          players.map((p, i) => {
            const isMe = p.username === currentUsername
            const isHost = i === 0
            const color = playerColor(p.username)
            const initial = (p.username || 'P').charAt(0).toUpperCase()
            return (
              <div
                key={p.socketId || p.username}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px',
                  background: isMe ? 'rgba(0,162,255,0.08)' : 'transparent',
                  borderLeft: isMe ? '2px solid #00a2ff' : '2px solid transparent',
                }}
              >
                {/* Avatar circle */}
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  {initial}
                </div>

                <span style={{
                  color: isMe ? '#00a2ff' : '#c8c8e0',
                  fontSize: 12,
                  fontWeight: isMe ? 700 : 500,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {p.username}
                  {isMe && <span style={{ color: '#8888aa', fontWeight: 400 }}> (you)</span>}
                </span>

                {isHost && (
                  <span title="Host" style={{ fontSize: 12 }}>👑</span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── In-game Chat ─────────────────────────────────────────────────────────────
function GameChat({ socket, gameId, currentUsername }) {
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!socket) return

    function onChat(msg) {
      setMessages(prev => [...prev.slice(-49), msg])
    }
    socket.on('game-chat', onChat)
    return () => socket.off('game-chat', onChat)
  }, [socket])

  // Auto-scroll
  useEffect(() => {
    if (!collapsed) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, collapsed])

  function sendMessage() {
    const text = input.trim()
    if (!text || !socket) return
    socket.emit('game-chat', { gameId, message: text })
    setInput('')
  }

  function handleKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  const visible = messages.slice(-5)

  return (
    <div style={{
      position: 'fixed',
      bottom: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 420,
      maxWidth: 'calc(100vw - 24px)',
      background: 'rgba(8, 8, 20, 0.82)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      overflow: 'hidden',
      zIndex: 200,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      transition: 'all 0.2s ease',
    }}>
      {/* Header / toggle */}
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.07)',
          userSelect: 'none',
        }}
      >
        <span style={{ color: '#8888aa', fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
          💬 CHAT
        </span>
        <span style={{ color: '#555577', fontSize: 10 }}>{collapsed ? '▲' : '▼'}</span>
      </div>

      {!collapsed && (
        <>
          {/* Messages */}
          <div style={{
            padding: '6px 10px',
            minHeight: 72,
            maxHeight: 110,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}>
            {visible.length === 0 ? (
              <span style={{ color: '#333355', fontSize: 11, alignSelf: 'center', marginTop: 16 }}>
                No messages yet
              </span>
            ) : (
              visible.map((msg, i) => (
                <div key={i} style={{ fontSize: 12, lineHeight: 1.4 }}>
                  <span style={{
                    color: playerColor(msg.username),
                    fontWeight: 700,
                    marginRight: 6,
                  }}>
                    {msg.username}
                  </span>
                  <span style={{ color: '#d0d0e8' }}>{msg.message}</span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            display: 'flex',
            gap: 6,
            padding: '6px 8px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={socket ? 'Say something...' : 'Offline mode'}
              disabled={!socket}
              maxLength={200}
              style={{
                flex: 1,
                height: 30,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#fff',
                fontSize: 12,
                padding: '0 10px',
                outline: 'none',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!socket || !input.trim()}
              style={{
                height: 30,
                padding: '0 12px',
                background: socket && input.trim() ? '#00a2ff' : 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: 6,
                color: socket && input.trim() ? '#fff' : '#555577',
                fontSize: 12,
                fontWeight: 700,
                cursor: socket && input.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Username label overlay (canvas) ──────────────────────────────────────────
function useLabelsOverlay(canvasRef, labelsCanvasRef, players, threeRef) {
  useEffect(() => {
    const labelsCanvas = labelsCanvasRef.current
    const gameCanvas   = canvasRef.current
    if (!labelsCanvas || !gameCanvas) return

    function drawLabels() {
      const { renderer, camera } = threeRef.current
      if (!renderer || !camera) return

      const ctx = labelsCanvas.getContext('2d')
      const w   = labelsCanvas.width
      const h   = labelsCanvas.height
      ctx.clearRect(0, 0, w, h)

      players.forEach(p => {
        if (!p.position) return
        // Project world position to screen
        const pos3d = new THREE.Vector3(p.position.x, p.position.y + 2.5, p.position.z)
        pos3d.project(camera)

        const sx = (pos3d.x * 0.5 + 0.5) * w
        const sy = (-pos3d.y * 0.5 + 0.5) * h

        // Behind camera or off-screen
        if (pos3d.z > 1) return
        if (sx < 0 || sx > w || sy < 0 || sy > h) return

        const text  = p.username || ''
        const pad   = 5
        ctx.font    = 'bold 12px Segoe UI, sans-serif'
        const tw    = ctx.measureText(text).width
        const bw    = tw + pad * 2
        const bh    = 18

        // Pill background
        ctx.fillStyle = 'rgba(0,0,0,0.65)'
        ctx.beginPath()
        const rx = sx - bw / 2, ry = sy - bh / 2, rr = 4
        if (ctx.roundRect) {
          ctx.roundRect(rx, ry, bw, bh, rr)
        } else {
          ctx.rect(rx, ry, bw, bh)
        }
        ctx.fill()

        // Text
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, sx, sy)
      })
    }

    // Run on animation frame
    let raf
    function tick() { drawLabels(); raf = requestAnimationFrame(tick) }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [players, canvasRef, labelsCanvasRef, threeRef])
}

// ─── React component ──────────────────────────────────────────────────────────
export default function GamePlay() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { socket }   = useSocket()

  const canvasRef       = useRef(null)
  const labelsCanvasRef = useRef(null)
  const threeRef        = useRef({})    // holds renderer, scene, camera, gameState

  const [loading,    setLoading]    = useState(true)
  const [gameState,  setGameState]  = useState({ won: false, score: 0, lapCount: 0, lapTime: 0, carSpeed: 0 })
  const [players,    setPlayers]    = useState([])

  // Sandbox color picker state
  const [selectedColor, setSelectedColor] = useState('#ff6b35')

  const gameMode = getGameMode(id)
  const info     = GAME_INFO[gameMode]
  const currentUsername = user?.username || user?.displayName || 'Player'

  // ── Socket: join/leave game room ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    socket.emit('join-game', { gameId: id, username: currentUsername })

    function onJoinedGame(data) {
      // Server sends existing player list
      if (Array.isArray(data?.players)) setPlayers(data.players)
      else if (Array.isArray(data)) setPlayers(data)
    }

    function onPlayerJoined(data) {
      setPlayers(prev => {
        const exists = prev.find(p => p.socketId === data.socketId || p.username === data.username)
        if (exists) return prev
        return [...prev, data]
      })
    }

    function onPlayerLeft(data) {
      setPlayers(prev => prev.filter(
        p => p.socketId !== data.socketId && p.username !== data.username
      ))
    }

    socket.on('joined-game', onJoinedGame)
    socket.on('player-joined', onPlayerJoined)
    socket.on('player-left',  onPlayerLeft)

    return () => {
      socket.emit('leave-game', { gameId: id })
      socket.off('joined-game', onJoinedGame)
      socket.off('player-joined', onPlayerJoined)
      socket.off('player-left',  onPlayerLeft)
    }
  }, [socket, id, currentUsername])

  // ── HUD polling for game-specific state ───────────────────────────────────
  useEffect(() => {
    if (loading) return
    const interval = setInterval(() => {
      const gs = threeRef.current.gameState
      if (!gs) return
      if (gameMode === 'obby') {
        setGameState(s => ({ ...s, won: gs.won, score: gs.score }))
      } else if (gameMode === 'racing') {
        setGameState(s => ({
          ...s,
          lapCount: gs.lapCount,
          lapTime:  gs.lapTime,
          carSpeed: Math.abs(gs.carSpeed),
        }))
      }
    }, 100)
    return () => clearInterval(interval)
  }, [loading, gameMode])

  // ── Propagate color picker changes to sandbox state ───────────────────────
  useEffect(() => {
    if (gameMode === 'sandbox' && threeRef.current.gameState) {
      threeRef.current.gameState.selectedColor = selectedColor
    }
  }, [selectedColor, gameMode])

  // ── Three.js initialization ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const NAVBAR_HEIGHT = 60
    const w = window.innerWidth
    const h = window.innerHeight - NAVBAR_HEIGHT

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Scene
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 1000)

    // Init game
    let gameStateObj
    if (gameMode === 'obby')   gameStateObj = initObby(scene, camera, renderer)
    else if (gameMode === 'sandbox') gameStateObj = initSandbox(scene, camera, renderer)
    else if (gameMode === 'racing')  gameStateObj = initRacing(scene, camera, renderer)

    threeRef.current = { renderer, scene, camera, gameState: gameStateObj }
    setLoading(false)

    // Sync labels canvas size
    function syncLabels() {
      const lc = labelsCanvasRef.current
      if (lc) { lc.width = window.innerWidth; lc.height = window.innerHeight - NAVBAR_HEIGHT }
    }
    syncLabels()

    // Resize handler
    function onResize() {
      const nw = window.innerWidth
      const nh = window.innerHeight - NAVBAR_HEIGHT
      renderer.setSize(nw, nh)
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      syncLabels()
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      // Game-specific cleanup
      if (gameStateObj && gameStateObj.cleanupFns) {
        gameStateObj.cleanupFns.forEach(fn => fn())
      }
      renderer.dispose()
    }
  }, [gameMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Username label overlay ────────────────────────────────────────────────
  useLabelsOverlay(canvasRef, labelsCanvasRef, players, threeRef)

  const handleLeave = useCallback(() => navigate('/games'), [navigate])

  // Sandbox palette colors
  const palette = [
    '#ff6b35', '#e91e63', '#9c27b0', '#673ab7',
    '#2196f3', '#03a9f4', '#00bcd4', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107',
    '#ff9800', '#ff5722', '#795548', '#ffffff',
    '#9e9e9e', '#607d8b', '#212121', '#f44336',
  ]

  const isOffline = !socket

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <Navbar />

      {/* Game canvas container */}
      <div style={{ position: 'relative', flex: 1 }}>
        {/* Three.js canvas */}
        <canvas
          id="game-canvas"
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />

        {/* 2D username label overlay */}
        <canvas
          id="labels-canvas"
          ref={labelsCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            width: '100%',
            height: '100%',
          }}
        />

        {/* Loading screen */}
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, #0a0e1a, #16213e)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}>
            <div style={{
              width: 60, height: 60,
              border: '5px solid #1e2a3a',
              borderTopColor: info.color,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: 24,
            }} />
            <p style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>
              Loading {info.title}...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* HUD overlay */}
        {!loading && (
          <>
            {/* Top-left: game title + controls */}
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(6px)',
              border: `1px solid ${info.color}44`,
              borderRadius: 10,
              padding: '10px 16px',
              maxWidth: 420,
            }}>
              <div style={{
                color: info.color,
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: 1,
                marginBottom: 4,
                fontFamily: 'Segoe UI, sans-serif',
              }}>
                {info.title} — Game #{id}
              </div>
              <div style={{
                color: '#94a3b8',
                fontSize: 11,
                fontFamily: 'monospace',
                lineHeight: 1.5,
              }}>
                {info.controls}
              </div>
            </div>

            {/* Top-right: score/timer + leave button */}
            <div style={{
              position: 'absolute', top: 12, right: 12,
              display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
            }}>
              {/* Score box */}
              <div style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                border: `1px solid ${info.color}44`,
                borderRadius: 10,
                padding: '10px 16px',
                minWidth: 140,
              }}>
                {gameMode === 'obby' && (
                  <div style={{ color: '#f1f5f9', fontFamily: 'Segoe UI, sans-serif', fontSize: 14 }}>
                    {gameState.won
                      ? <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 16 }}>YOU WIN!</span>
                      : <span style={{ color: '#94a3b8' }}>Reach the flag!</span>
                    }
                  </div>
                )}
                {gameMode === 'sandbox' && (
                  <div style={{ color: '#94a3b8', fontFamily: 'Segoe UI, sans-serif', fontSize: 13 }}>
                    Blocks placed: {threeRef.current.gameState?.blocks?.length ?? 0}
                  </div>
                )}
                {gameMode === 'racing' && (
                  <div style={{ color: '#f1f5f9', fontFamily: 'Segoe UI, sans-serif', fontSize: 13, lineHeight: 1.7 }}>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Speed: </span>
                      <span style={{ color: info.color, fontWeight: 700 }}>
                        {Math.round(gameState.carSpeed * 3.6)} km/h
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Lap: </span>
                      <span style={{ color: '#facc15', fontWeight: 700 }}>{gameState.lapCount}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8' }}>Time: </span>
                      <span style={{ fontWeight: 600 }}>{gameState.lapTime.toFixed(1)}s</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Leave button */}
              <button
                onClick={handleLeave}
                style={{
                  background: 'rgba(233,69,96,0.85)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: 'Segoe UI, sans-serif',
                  letterSpacing: 0.5,
                  boxShadow: '0 2px 12px rgba(233,69,96,0.4)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,69,96,1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(233,69,96,0.85)' }}
              >
                Leave Game
              </button>
            </div>

            {/* Sandbox color picker (bottom center) */}
            {gameMode === 'sandbox' && (
              <div style={{
                position: 'absolute', bottom: 72, left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'Segoe UI, sans-serif', marginRight: 4 }}>
                  Color:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 260 }}>
                  {palette.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      style={{
                        width: 22, height: 22,
                        background: c,
                        border: selectedColor === c ? '2px solid #fff' : '2px solid transparent',
                        borderRadius: 4,
                        cursor: 'pointer',
                        padding: 0,
                        outline: selectedColor === c ? '2px solid #3b82f6' : 'none',
                        outlineOffset: 1,
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                    />
                  ))}
                </div>
                {/* Custom color input */}
                <input
                  type="color"
                  value={selectedColor}
                  onChange={e => setSelectedColor(e.target.value)}
                  style={{
                    width: 28, height: 28,
                    border: 'none',
                    padding: 0,
                    background: 'none',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                  title="Custom color"
                />
              </div>
            )}

            {/* Win banner (Obby) */}
            {gameMode === 'obby' && gameState.won && (
              <div style={{
                position: 'absolute',
                top: '35%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: '3px solid #fff',
                borderRadius: 20,
                padding: '32px 56px',
                textAlign: 'center',
                boxShadow: '0 8px 48px rgba(34,197,94,0.5)',
                zIndex: 5,
              }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
                <div style={{ color: '#fff', fontSize: 28, fontWeight: 900, fontFamily: 'Segoe UI, sans-serif' }}>
                  Course Complete!
                </div>
                <div style={{ color: '#dcfce7', fontSize: 15, marginTop: 8 }}>
                  You reached the finish flag!
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      const gs = threeRef.current.gameState
                      if (gs) {
                        gs.won = false
                        gs.player.position.copy(gs.spawnPos)
                        gs.playerVelocity.set(0, 0, 0)
                      }
                    }}
                    style={{
                      background: '#fff',
                      color: '#16a34a',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 24px',
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    Play Again
                  </button>
                  <button
                    onClick={handleLeave}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      border: '2px solid #fff',
                      borderRadius: 8,
                      padding: '10px 24px',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    Leave
                  </button>
                </div>
              </div>
            )}

            {/* Players Online Panel */}
            <PlayersPanel
              players={players}
              currentUsername={currentUsername}
              isOffline={isOffline}
            />

            {/* In-game Chat */}
            <GameChat
              socket={socket}
              gameId={id}
              currentUsername={currentUsername}
            />
          </>
        )}
      </div>
    </div>
  )
}
