import * as THREE from "three";
import { camera } from "./main.js";

let currentModel = null;
let isActive = false;
let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();
let toastTimeout = null;
let handlersInitialized = false;

export function activateFunction3() {
  isActive = true;
  document.getElementById("status").innerHTML =
    "🧱 Режим: материалы | Нажмите на любую часть дома";
  console.log("Function3 активирована");
}

export function deactivateFunction3() {
  isActive = false;
  // Скрываем тост если был открыт
  const toast = document.getElementById("info-toast");
  if (toast) toast.classList.remove("show");
  console.log("Function3 деактивирована");
}

export function setModelForFunction3(model) {
  currentModel = model;
  console.log("Function3: модель получена");
}

function handleTap(event) {
  if (!isActive) return;
  if (!currentModel) return;

  let clientX, clientY;
  if (event.touches) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
    event.preventDefault();
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  const rect = document.querySelector("canvas").getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(currentModel, true);

  const toast = document.getElementById("info-toast");
  const infoText = document.getElementById("info-text");

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const materialName =
      hit.userData?.material || getMaterialByPartName(hit.name);
    const square = hit.userData?.square || getSquareByPartName(hit.name);

    infoText.innerHTML = `
            <strong>${hit.name || "Элемент конструкции"}</strong><br>
            📐 Материал: ${materialName}<br>
            📏 Площадь: ${square}<br>
            🏠 Общая площадь: 220 м²
        `;
    toast.classList.add("show");

    if (hit.material && hit.material.color) {
      const originalColor = hit.material.color.clone();
      hit.material.color.setHex(0xffaa44);
      setTimeout(() => {
        if (hit.material.color) hit.material.color = originalColor;
      }, 500);
    }

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }
}

function getMaterialByPartName(name) {
  if (!name) return "Кирпич";
  const n = name.toLowerCase();
  if (n.includes("roof")) return "Металлочерепица";
  if (n.includes("wall")) return "Газоблок D400";
  if (n.includes("window")) return "Стеклопакет";
  if (n.includes("door")) return "Дуб массив";
  if (n.includes("foundation")) return "Железобетон";
  return "Кирпич керамический";
}

function getSquareByPartName(name) {
  if (!name) return "—";
  const n = name.toLowerCase();
  if (n.includes("roof")) return "65 м²";
  if (n.includes("wall")) return "45 м²";
  if (n.includes("window")) return "1.5 м²";
  if (n.includes("door")) return "2 м²";
  return "—";
}

// Инициализируем обработчики один раз
function initHandlers() {
  if (handlersInitialized) return;
  handlersInitialized = true;

  window.addEventListener("click", handleTap);
  window.addEventListener("touchstart", handleTap);
}

initHandlers();
