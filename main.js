import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  activateFunction1,
  deactivateFunction1,
  setModelForFunction1,
} from "./function1.js";
import {
  activateFunction2,
  deactivateFunction2,
  setModelForFunction2,
} from "./function2.js";
import {
  activateFunction3,
  deactivateFunction3,
  setModelForFunction3,
} from "./function3.js";

// ---------- Глобальные переменные ----------
export let scene, camera, renderer, controls;
export let currentModelObject = null;
export let currentModelIndex = 0;
let currentActiveFunction = null;

export const MODELS = [
  {
    url: "./model.glb",
    name: "Коттедж «Альфа»",
    desc: "220 м² • Кирпич • 2 этажа",
  },
  {
    url: "./house.glb",
    name: "Дом «Бета»",
    desc: "180 м² • Газоблок • 1 этаж",
  },
];

// ---------- Инициализация сцены ----------
scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a3a4a);

camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(3.5, 2.5, 5);

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 1.5;
controls.zoomSpeed = 1.2;
controls.enableZoom = true;
controls.enablePan = true;
controls.panSpeed = 0.8;
controls.target.set(0, 1.2, 0);

// ---------- Освещение ----------
const ambientLight = new THREE.AmbientLight(0x606080);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
mainLight.position.set(2, 4, 2);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
scene.add(mainLight);

const fillLight = new THREE.PointLight(0x6688aa, 0.4);
fillLight.position.set(1, 2, 2);
scene.add(fillLight);

const backLight = new THREE.PointLight(0xffaa66, 0.3);
backLight.position.set(-1, 2, -2);
scene.add(backLight);

const warmLight = new THREE.PointLight(0xff8866, 0.3);
warmLight.position.set(1, 1.5, 1.5);
scene.add(warmLight);

const bottomLight = new THREE.PointLight(0x88aaff, 0.15);
bottomLight.position.set(0, -0.2, 0);
scene.add(bottomLight);

// Тень
const shadowCatcher = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4),
  new THREE.ShadowMaterial({
    opacity: 0.3,
    color: 0x000000,
    transparent: true,
    side: THREE.DoubleSide,
  }),
);
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.position.y = -0.3;
shadowCatcher.receiveShadow = true;
scene.add(shadowCatcher);

// ---------- Прогресс-бар ----------
let progressContainer = null;

export function createProgressBar() {
  if (progressContainer) return;
  progressContainer = document.createElement("div");
  progressContainer.id = "progress-container";
  progressContainer.style.cssText = `
        position: fixed;
        bottom: 180px;
        left: 20px;
        right: 20px;
        background: rgba(0,0,0,0.7);
        border-radius: 30px;
        padding: 4px;
        z-index: 200;
        display: none;
        backdrop-filter: blur(10px);
    `;
  const progressBar = document.createElement("div");
  progressBar.id = "progress-bar";
  progressBar.style.cssText = `
        width: 0%;
        height: 8px;
        background: linear-gradient(90deg, #27ae60, #2ecc71);
        border-radius: 30px;
        transition: width 0.3s ease;
    `;
  const progressText = document.createElement("div");
  progressText.id = "progress-text";
  progressText.style.cssText = `
        text-align: center;
        color: white;
        font-size: 11px;
        margin-top: 8px;
        font-family: monospace;
    `;
  progressContainer.appendChild(progressBar);
  progressContainer.appendChild(progressText);
  document.body.appendChild(progressContainer);
}

export function showProgress(show, percent = 0, message = "") {
  const container = document.getElementById("progress-container");
  const bar = document.getElementById("progress-bar");
  const text = document.getElementById("progress-text");
  if (!container) return;
  if (show) {
    container.style.display = "block";
    if (bar) bar.style.width = percent + "%";
    if (text) text.innerHTML = message || `Загрузка... ${Math.round(percent)}%`;
  } else {
    container.style.display = "none";
  }
}

// ---------- Универсальное позиционирование ----------
export function normalizeModel(model) {
  const bbox = new THREE.Box3().setFromObject(model);
  const height = bbox.getSize(new THREE.Vector3()).y;
  const TARGET_HEIGHT = 1.2;
  const DESIRED_BOTTOM_Y = -0.2;
  let scale = TARGET_HEIGHT / height;
  scale = Math.min(scale, 0.8);
  scale = Math.max(scale, 0.3);
  model.scale.set(scale, scale, scale);
  const bboxScaled = new THREE.Box3().setFromObject(model);
  const minYScaled = bboxScaled.min.y;
  const finalY = DESIRED_BOTTOM_Y + -minYScaled;
  model.position.set(0, finalY, 0);
  return model;
}

// ---------- Загрузка модели ----------
const loader = new GLTFLoader();

export function loadModel(index) {
  const model = MODELS[index];
  showProgress(true, 0, `Загрузка: ${model.name}...`);
  document.getElementById("status").innerHTML = `📦 Загрузка: ${model.name}...`;

  let fakeProgress = 0;
  const fakeInterval = setInterval(() => {
    if (fakeProgress < 90) {
      fakeProgress += Math.random() * 10;
      if (fakeProgress > 90) fakeProgress = 90;
      showProgress(
        true,
        fakeProgress,
        `Загрузка: ${model.name}... ${Math.round(fakeProgress)}%`,
      );
    }
  }, 200);

  loader.load(
    model.url,
    (gltf) => {
      clearInterval(fakeInterval);
      if (currentModelObject) scene.remove(currentModelObject);
      currentModelObject = gltf.scene;
      normalizeModel(currentModelObject);
      currentModelObject.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(currentModelObject);

      // Передаём модель во все функции
      if (setModelForFunction1) setModelForFunction1(currentModelObject);
      if (setModelForFunction2) setModelForFunction2(currentModelObject);
      if (setModelForFunction3) setModelForFunction3(currentModelObject);

      showProgress(true, 100, `Готово! ${model.name}`);
      setTimeout(() => showProgress(false), 500);
      document.getElementById("status").innerHTML =
        `✅ ${model.name} загружена`;
      setTimeout(() => {
        document.getElementById("status").innerHTML =
          "Выберите функцию: Выбор дома, Разрез или Материалы";
      }, 2000);
    },
    (xhr) => {
      const percent = (xhr.loaded / xhr.total) * 100;
      showProgress(
        true,
        percent,
        `Загрузка: ${model.name}... ${Math.round(percent)}%`,
      );
    },
    (error) => {
      clearInterval(fakeInterval);
      showProgress(true, 100, `Ошибка: файл ${model.name} не найден!`);
      setTimeout(() => showProgress(false), 1500);
      document.getElementById("status").innerHTML =
        `⚠️ Файл ${model.url} не найден`;
    },
  );
}

// ---------- Переключение функций ----------
function switchToFunction(functionName, activateFn, deactivateFn, panelId) {
  // Деактивируем текущую функцию
  if (currentActiveFunction && currentActiveFunction.deactivate) {
    currentActiveFunction.deactivate();
  }

  // Скрываем все панели
  document.getElementById("panel-function1").classList.add("hidden");
  document.getElementById("panel-function2").classList.add("hidden");
  document.getElementById("panel-function3").classList.add("hidden");

  // Показываем нужную панель
  document.getElementById(panelId).classList.remove("hidden");

  // Активируем новую функцию
  if (activateFn) activateFn();

  currentActiveFunction = { name: functionName, deactivate: deactivateFn };

  // Подсвечиваем активную кнопку
  document
    .querySelectorAll(".feature-card")
    .forEach((btn) => btn.classList.remove("active"));
  if (functionName === "function1")
    document.getElementById("gallery-btn").classList.add("active");
  if (functionName === "function2")
    document.getElementById("section-btn").classList.add("active");
  if (functionName === "function3")
    document.getElementById("materials-btn").classList.add("active");
}

// ---------- Кнопки ----------
document.getElementById("gallery-btn").addEventListener("click", () => {
  // Для выбора дома открываем галерею, но не переключаем функцию
  document.getElementById("gallery").classList.add("active");
});
document.getElementById("section-btn").addEventListener("click", () => {
  switchToFunction(
    "function2",
    activateFunction2,
    deactivateFunction2,
    "panel-function2",
  );
});
document.getElementById("materials-btn").addEventListener("click", () => {
  switchToFunction(
    "function3",
    activateFunction3,
    deactivateFunction3,
    "panel-function3",
  );
});

// Сброс камеры (общий)
function resetCameraView() {
  camera.position.set(3.5, 2.5, 5);
  controls.target.set(0, 1.2, 0);
  controls.update();
  document.getElementById("status").innerHTML = "✅ Вид сброшен";
  setTimeout(() => {
    document.getElementById("status").innerHTML = currentActiveFunction
      ? currentActiveFunction.name === "function2"
        ? "Режим: разрез"
        : currentActiveFunction.name === "function3"
          ? "Режим: материалы"
          : "Выберите функцию"
      : "Выберите функцию";
  }, 2000);
}

document
  .getElementById("reset-camera-f1")
  .addEventListener("click", resetCameraView);
document
  .getElementById("reset-camera-f2")
  .addEventListener("click", resetCameraView);
document
  .getElementById("reset-camera-f3")
  .addEventListener("click", resetCameraView);

// Галерея
document.getElementById("close-gallery").addEventListener("click", () => {
  document.getElementById("gallery").classList.remove("active");
});

document.querySelectorAll(".gallery-card").forEach((card) => {
  card.addEventListener("click", () => {
    const modelUrl = card.dataset.model;
    const index = MODELS.findIndex((m) => m.url === modelUrl);
    if (index !== -1) {
      currentModelIndex = index;
      loadModel(currentModelIndex);
    }
    document.getElementById("gallery").classList.remove("active");
    // После выбора дома активируем функцию 1
    switchToFunction(
      "function1",
      activateFunction1,
      deactivateFunction1,
      "panel-function1",
    );
  });
});

// AR кнопка (заглушка)
document.getElementById("ar-btn").addEventListener("click", () => {
  document.getElementById("status").innerHTML =
    "🔜 AR режим будет добавлен позже";
  setTimeout(() => {
    document.getElementById("status").innerHTML = currentActiveFunction
      ? currentActiveFunction.name === "function2"
        ? "Режим: разрез"
        : currentActiveFunction.name === "function3"
          ? "Режим: материалы"
          : "Выберите функцию"
      : "Выберите функцию";
  }, 2000);
});

// ---------- Анимация ----------
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

createProgressBar();
loadModel(0);

console.log("Main.js загружен");
