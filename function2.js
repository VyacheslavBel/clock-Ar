import * as THREE from "three";
import { controls, scene } from "./main.js";

let currentModel = null;
let isActive = false;
let clippingPlane = null;
let sectionEnabled = false;
let sectionSlider = null;
let sectionContainer = null;
let sectionPlaneMesh = null;
let sectionPlaneTexture = null;

export function activateFunction2() {
  isActive = true;
  document.getElementById("status").innerHTML =
    '✂️ Режим: разрез | Нажмите "Включить сечение" для активации';
  console.log("Function2 активирована");
}

export function deactivateFunction2() {
  if (sectionEnabled) {
    if (currentModel) removeClipping(currentModel);
    if (sectionContainer) sectionContainer.style.display = "none";
    if (sectionPlaneMesh) sectionPlaneMesh.visible = false;
    sectionEnabled = false;
    const sectionBtn = document.getElementById("toggle-section");
    if (sectionBtn) sectionBtn.style.background = "#ff8844";
  }
  isActive = false;
  console.log("Function2 деактивирована");
}

export function setModelForFunction2(model) {
  currentModel = model;
  if (isActive && sectionEnabled && clippingPlane) {
    applyClippingToModel(currentModel, clippingPlane);
    updateSectionPlanePosition(clippingPlane.constant);
  }
}

// Создание визуальной плоскости разреза
function createSectionPlane() {
  if (!scene) {
    console.error("Scene is not available yet");
    return false;
  }

  if (sectionPlaneMesh) return true;

  console.log("Creating section plane...");

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Заливка полупрозрачным красным
  ctx.fillStyle = "rgba(255, 80, 80, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Рисуем сетку
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 2;
  const step = 64;
  for (let x = step; x < canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = step; y < canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Диагональные линии
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(canvas.width, 0);
  ctx.lineTo(0, canvas.height);
  ctx.stroke();

  // Стрелки
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "bold 28px Arial";
  ctx.fillText("◀", canvas.width / 2 - 60, canvas.height / 2);
  ctx.fillText("▶", canvas.width / 2 + 40, canvas.height / 2);

  // Текст
  ctx.font = "bold 18px Arial";
  ctx.fillStyle = "rgba(255, 200, 200, 0.9)";
  ctx.fillText("РАЗРЕЗ", canvas.width / 2 - 45, canvas.height - 25);

  sectionPlaneTexture = new THREE.CanvasTexture(canvas);
  sectionPlaneTexture.wrapS = THREE.RepeatWrapping;
  sectionPlaneTexture.wrapT = THREE.RepeatWrapping;
  sectionPlaneTexture.repeat.set(2, 2);

  // Плоскость будет стоять вертикально по оси X
  const geometry = new THREE.PlaneGeometry(2.5, 2.5);
  const material = new THREE.MeshStandardMaterial({
    map: sectionPlaneTexture,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    emissive: 0x442222,
    emissiveIntensity: 0.3,
  });

  sectionPlaneMesh = new THREE.Mesh(geometry, material);
  sectionPlaneMesh.visible = false;
  sectionPlaneMesh.position.set(0, 0.6, 0);
  // Поворачиваем плоскость, чтобы она была перпендикулярна оси X
  sectionPlaneMesh.rotation.y = Math.PI / 2;
  scene.add(sectionPlaneMesh);

  console.log("Section plane created");
  return true;
}

function updateSectionPlanePosition(xPos) {
  if (!sectionPlaneMesh) return;
  sectionPlaneMesh.position.set(xPos, 0.6, 0);
  sectionPlaneMesh.visible = sectionEnabled;

  if (sectionPlaneTexture && sectionEnabled) {
    sectionPlaneTexture.offset.x += 0.02;
  }
}

function createSectionUI() {
  if (sectionContainer) return;

  sectionContainer = document.createElement("div");
  sectionContainer.id = "section-container";
  sectionContainer.style.cssText = `
        position: fixed;
        bottom: 280px;
        left: 20px;
        right: 20px;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 12px 16px;
        z-index: 150;
        display: none;
        border: 1px solid rgba(255,80,80,0.5);
    `;

  const label = document.createElement("div");
  label.style.cssText = `color: #ff8888; font-size: 12px; margin-bottom: 8px; text-align: center;`;
  label.innerHTML = "✂️ ПЕРЕМЕЩАЙТЕ ПОЛЗУНОК — плоскость разрезает дом";

  sectionSlider = document.createElement("input");
  sectionSlider.type = "range";
  sectionSlider.min = "-1.5";
  sectionSlider.max = "1.5";
  sectionSlider.step = "0.01";
  sectionSlider.value = "0";
  sectionSlider.style.cssText = `width: 100%; margin: 8px 0; accent-color: #ff5555;`;

  const sectionValue = document.createElement("div");
  sectionValue.style.cssText = `color: #aaa; font-size: 10px; text-align: center; margin-top: 5px;`;
  sectionValue.innerHTML = "💠 сечение: центр дома";

  sectionSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    if (clippingPlane && currentModel) {
      // Обновляем плоскость отсечения
      clippingPlane.constant = val;
      applyClippingToModel(currentModel, clippingPlane);
      // Перемещаем визуальную плоскость
      updateSectionPlanePosition(val);

      if (val > 0.8) sectionValue.innerHTML = "✂️ сечение: правая часть скрыта";
      else if (val < -0.8)
        sectionValue.innerHTML = "✂️ сечение: левая часть скрыта";
      else if (val > 0.3)
        sectionValue.innerHTML = "✂️ сечение: правая часть частично скрыта";
      else if (val < -0.3)
        sectionValue.innerHTML = "✂️ сечение: левая часть частично скрыта";
      else sectionValue.innerHTML = "💠 сечение: центр дома, всё видно";
    }
  });

  sectionContainer.appendChild(label);
  sectionContainer.appendChild(sectionSlider);
  sectionContainer.appendChild(sectionValue);
  document.body.appendChild(sectionContainer);
}

function applyClippingToModel(model, plane) {
  model.traverse((child) => {
    if (child.isMesh) {
      if (!child.material.clippingPlanes) {
        child.material.clippingPlanes = [];
      }
      // Устанавливаем плоскость отсечения
      child.material.clippingPlanes = [plane];
      child.material.clipShadows = true;
      // Включаем двойную сторону, чтобы видеть внутренности при разрезе
      child.material.side = THREE.DoubleSide;
    }
  });
}

function removeClipping(model) {
  model.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.clippingPlanes = [];
      child.material.side = THREE.FrontSide;
    }
  });
}

let animationRunning = false;
function animateSectionTexture() {
  if (animationRunning) return;
  animationRunning = true;

  function animate() {
    if (sectionPlaneTexture && sectionPlaneMesh && sectionPlaneMesh.visible) {
      sectionPlaneTexture.offset.x += 0.02;
      requestAnimationFrame(animate);
    } else {
      animationRunning = false;
    }
  }
  animate();
}

let handlersInitialized = false;

function initHandlers() {
  if (handlersInitialized) return;
  handlersInitialized = true;

  createSectionUI();

  document.getElementById("toggle-section").addEventListener("click", () => {
    if (!isActive) return;
    toggleSection();
  });

  document.getElementById("toggle-roof").addEventListener("click", () => {
    if (!isActive) return;
    toggleRoof();
  });

  document.getElementById("toggle-walls").addEventListener("click", () => {
    if (!isActive) return;
    toggleWalls();
  });

  document.getElementById("toggle-partitions").addEventListener("click", () => {
    if (!isActive) return;
    togglePartitions();
  });

  document.getElementById("reset-layers").addEventListener("click", () => {
    if (!isActive) return;
    resetLayers();
  });
}

function toggleSection() {
  if (!currentModel) {
    document.getElementById("status").innerHTML = "⚠️ Сначала загрузите модель";
    return;
  }

  if (!clippingPlane) {
    // Создаём плоскость отсечения по оси X
    clippingPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  }

  if (sectionEnabled) {
    // ВЫКЛЮЧАЕМ сечение
    removeClipping(currentModel);
    sectionContainer.style.display = "none";
    if (sectionPlaneMesh) sectionPlaneMesh.visible = false;
    sectionEnabled = false;
    document.getElementById("status").innerHTML = "✂️ Режим сечения выключен";
    const sectionBtn = document.getElementById("toggle-section");
    if (sectionBtn) {
      sectionBtn.style.background = "#ff8844";
      sectionBtn.innerHTML = "✂️ ВКЛЮЧИТЬ СЕЧЕНИЕ";
    }
  } else {
    // ВКЛЮЧАЕМ сечение
    const planeCreated = createSectionPlane();
    if (!planeCreated) {
      document.getElementById("status").innerHTML =
        "⚠️ Ошибка создания плоскости сечения";
      return;
    }

    applyClippingToModel(currentModel, clippingPlane);
    sectionContainer.style.display = "block";
    if (sectionPlaneMesh) {
      sectionPlaneMesh.visible = true;
      updateSectionPlanePosition(clippingPlane.constant);
      animateSectionTexture();
    }
    sectionEnabled = true;
    document.getElementById("status").innerHTML =
      "✂️ Режим сечения активен. Двигайте ползунок!";
    const sectionBtn = document.getElementById("toggle-section");
    if (sectionBtn) {
      sectionBtn.style.background = "#2c3e50";
      sectionBtn.innerHTML = "🔴 ВЫКЛЮЧИТЬ СЕЧЕНИЕ";
    }
  }
}

function toggleRoof() {
  if (!currentModel) return;
  let found = false;
  currentModel.traverse((child) => {
    if (
      child.isMesh &&
      child.name &&
      child.name.toLowerCase().includes("roof")
    ) {
      child.visible = !child.visible;
      found = true;
    }
  });
  if (!found) {
    currentModel.traverse((child) => {
      if (child.isMesh && child.position.y > 0.3) {
        child.visible = !child.visible;
      }
    });
  }
  document.getElementById("status").innerHTML = "🏠 Крыша скрыта/показана";
  setTimeout(() => {
    if (isActive) document.getElementById("status").innerHTML = "Режим: разрез";
  }, 1500);
}

function toggleWalls() {
  if (!currentModel) return;
  currentModel.traverse((child) => {
    if (
      child.isMesh &&
      child.name &&
      child.name.toLowerCase().includes("wall")
    ) {
      child.visible = !child.visible;
    }
  });
  document.getElementById("status").innerHTML = "🧱 Фасад скрыт/показан";
  setTimeout(() => {
    if (isActive) document.getElementById("status").innerHTML = "Режим: разрез";
  }, 1500);
}

function togglePartitions() {
  if (!currentModel) return;
  currentModel.traverse((child) => {
    if (
      child.isMesh &&
      child.name &&
      (child.name.toLowerCase().includes("partition") ||
        child.name.toLowerCase().includes("inner"))
    ) {
      child.visible = !child.visible;
    }
  });
  document.getElementById("status").innerHTML =
    "🚪 Перегородки скрыты/показаны";
  setTimeout(() => {
    if (isActive) document.getElementById("status").innerHTML = "Режим: разрез";
  }, 1500);
}

function resetLayers() {
  if (!currentModel) return;
  currentModel.traverse((child) => {
    if (child.isMesh) {
      child.visible = true;
    }
  });
  if (sectionEnabled && clippingPlane) {
    applyClippingToModel(currentModel, clippingPlane);
    if (sectionPlaneMesh) updateSectionPlanePosition(clippingPlane.constant);
  }
  document.getElementById("status").innerHTML = "✅ Все слои восстановлены";
  setTimeout(() => {
    if (isActive) document.getElementById("status").innerHTML = "Режим: разрез";
  }, 1500);
}

initHandlers();
