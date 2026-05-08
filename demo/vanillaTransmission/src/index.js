// A simplified version of https://twitter.com/0xca0a/status/1611390744518078466
// It lacks custom buffers and resolution control (which made it possible for
// transmissive materials to "see" other transmissive and transparent objects),
// but otherwise it's the same.

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MeshTransmissionMaterial } from '../../../src/main/resources/static/js/futurecube/MeshTransmissionMaterial'
import './styles.css'

THREE.ColorManagement.legacyMode = false

async function app() {
  const ambientLight = new THREE.AmbientLight()
  const pointLight = new THREE.PointLight()
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#f0f0f0')
  const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(5, 0, 20)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputEncoding = THREE.sRGBEncoding
  document.getElementById('root').appendChild(renderer.domElement)
  const controls = new OrbitControls(camera, renderer.domElement)

  const envLoader = new RGBELoader()
  const gltfLoader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()

  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')
  gltfLoader.setDRACOLoader(dracoLoader)

  const [{ scene: gltfScene }, env] = await Promise.all([
    /*
    Author: glenatron (https://sketchfab.com/glenatron)
    License: CC-BY-NC-4.0 (http://creativecommons.org/licenses/by-nc/4.0/)
    Source: https://sketchfab.com/3d-models/gelatinous-cube-e08385238f4d4b59b012233a9fbdca21
    Title: Gelatinous Cube
    */
    new Promise((res) => gltfLoader.load('/gelatinous_cube-transformed.glb', res)),
    new Promise((res) => envLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr', res))
  ])

  scene.environment = env
  scene.environment.mapping = THREE.EquirectangularReflectionMapping

  scene.add(ambientLight)
  scene.add(pointLight)
  scene.add(gltfScene)

  pointLight.position.set(10, 10, 10)
  gltfScene.position.set(1, -3.45, 0)
  const cube1 = gltfScene.getObjectByName('cube1')
  cube1.material = Object.assign(new MeshTransmissionMaterial(10), {
    clearcoat: 1,
    clearcoatRoughness: 0,
    transmission: 1,
    chromaticAberration: 0.03,
    anisotrophicBlur: 0.1,
    // Set to > 0 for diffuse roughness
    roughness: 0,
    thickness: 4.5,
    ior: 1.5,
    // Set to > 0 for animation
    distortion: 0.1,
    distortionScale: 0.2,
    temporalDistortion: 0.2
  })

  function resize() {
    const width = window.innerWidth
    const height = window.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  window.addEventListener('resize', resize)
  resize()

  function animate(t) {
    requestAnimationFrame(animate)
    cube1.material.time = t / 1000
    controls.update()
    renderer.render(scene, camera)
  }

  animate()
}

app()
