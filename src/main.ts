import { FRMManager } from "./FRMManager";

// const app = document.querySelector("#app") as HTMLDivElement;
const frmContainer = document.querySelector("#frm-container") as HTMLDivElement;
const frmContainerWidth = frmContainer.clientWidth;
const frmContainerHeight = frmContainer.clientHeight;

const input = document.querySelector("#frm-input") as HTMLInputElement;
const frmList = document.querySelector(".frm-list") as HTMLOListElement;
const canvas = document.querySelector("#frm-canvas") as HTMLCanvasElement;
canvas.width = frmContainerWidth;
canvas.height = frmContainerHeight;

const frmManager = new FRMManager(frmList, canvas);

// Buttons
const clockwiseButton = document.querySelector("#clockwise") as HTMLButtonElement;
const counterClockwiseButton = document.querySelector("#counter-clockwise") as HTMLButtonElement;

const frmMoveUp = document.querySelector("#frm-move-up") as HTMLButtonElement;
const frmMoveBottom = document.querySelector("#frm-move-bottom") as HTMLButtonElement;
const frmMoveLeft = document.querySelector("#frm-move-left") as HTMLButtonElement;
const frmMoveRight = document.querySelector("#frm-move-right") as HTMLButtonElement;
const frmShiftReset = document.querySelector("#frm-shift-reset") as HTMLButtonElement;

frmMoveUp.onclick = () => frmManager.setUserShift(0, -5);
frmMoveBottom.onclick = () => frmManager.setUserShift(0, 5);
frmMoveLeft.onclick = () => frmManager.setUserShift(-5, 0);
frmMoveRight.onclick = () => frmManager.setUserShift(5, 0);
frmShiftReset.onclick = () => frmManager.resetUserShift();


clockwiseButton.onclick = frmManager.changeFrmDirection.bind(frmManager, 1);
counterClockwiseButton.onclick = frmManager.changeFrmDirection.bind(frmManager, -1);

// Register hotkeys
document.addEventListener('keydown', (event) => {
  // Choose FRM
  if (event.code === 'ArrowDown' && !event.shiftKey) {
    event.preventDefault();
    frmManager.setNextFrm();
  }
  if (event.code === 'ArrowUp' && !event.shiftKey) {
    event.preventDefault();
    frmManager.setPreviousFrm();
  }

  // Rotate FRM
  // @TODO: Нужно ли начинать заного воспроизводить анимацию при повороте?
  if (event.code === 'ArrowRight' && !event.shiftKey) {
    event.preventDefault();
    frmManager.changeFrmDirection(1);
    clockwiseButton.focus();
  }
  if (event.code === 'ArrowLeft' && !event.shiftKey) {
    event.preventDefault();
    frmManager.changeFrmDirection(-1);
    counterClockwiseButton.focus();
  }

  // Detele FRM
  if (event.code === 'Backspace' || event.code === 'Delete') {
    event.preventDefault();
    frmManager.removeActiveFrmFile();
  }

  // Zoom FRM
  if (event.code === 'Minus') {
    event.preventDefault();
    frmManager.decreaseFrmScale();
  }
  if (event.code === 'Equal') {
    event.preventDefault();
    frmManager.increaseFrmScale();
  }

  // Shift FRM
  if (event.code === 'ArrowDown' && event.shiftKey) {
    event.preventDefault();
    frmManager.setUserShift(0, 5);
    frmMoveBottom.focus();
  }
  if (event.code === 'ArrowUp' && event.shiftKey) {
    event.preventDefault();
    frmManager.setUserShift(0, -5);
    frmMoveUp.focus();
  }
  if (event.code === 'ArrowRight' && event.shiftKey) {
    event.preventDefault();
    frmManager.setUserShift(5, 0);
    frmMoveRight.focus();
  }
  if (event.code === 'ArrowLeft' && event.shiftKey) {
    event.preventDefault();
    frmManager.setUserShift(-5, 0);
    frmMoveLeft.focus();
  }

  // Reset FRM Shift
  if (event.code === 'KeyR' && event.shiftKey) {
    event.preventDefault();
    frmManager.resetUserShift();
    frmShiftReset.focus();
  }
});

input.onchange = (event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (files) {
    frmManager.addFrmFilesList(files);

    // unlink files from input
    target.value = '';

    console.log(frmManager);
  }
};