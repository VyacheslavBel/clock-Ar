import { controls } from "./main.js";

let currentModel = null;
let isActive = false;

export function activateFunction1() {
  isActive = true;
  document.getElementById("status").innerHTML =
    "🏘️ Режим: выбор дома | Вращайте, приближайте, перемещайте";
  controls.target.set(0, 1.2, 0);
  controls.update();
  console.log("Function1 активирована");
}

export function deactivateFunction1() {
  isActive = false;
  console.log("Function1 деактивирована");
}

export function setModelForFunction1(model) {
  currentModel = model;
  console.log("Function1: модель получена");
}
