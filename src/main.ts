// @TODO: Read frm frame separately

import { FRMManager } from "./FRMManager";

const FILE_TYPE = ".FRM";

const body = document.body;
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
const frmScaleDown = document.querySelector("#frm-scale-down") as HTMLButtonElement;
const frmScaleUp = document.querySelector("#frm-scale-up") as HTMLButtonElement;

frmMoveUp.onclick = () => frmManager.setUserShift(0, -5);
frmMoveBottom.onclick = () => frmManager.setUserShift(0, 5);
frmMoveLeft.onclick = () => frmManager.setUserShift(-5, 0);
frmMoveRight.onclick = () => frmManager.setUserShift(5, 0);
frmShiftReset.onclick = () => frmManager.resetUserShift();
frmScaleDown.onclick = () => frmManager.decreaseFrmScale();
frmScaleUp.onclick = () => frmManager.increaseFrmScale();


clockwiseButton.onclick = frmManager.changeFrmDirection.bind(frmManager, 1);
counterClockwiseButton.onclick = frmManager.changeFrmDirection.bind(frmManager, -1);

const addFiles = (files: FileList | null | undefined) => {
  if (files && files.length > 0) {
    const filteredFiles = Array.from(files).filter((file) => {
      const targetFileType = FILE_TYPE.toLocaleLowerCase();
      const fileType = file.type.toLocaleLowerCase();
      const fileName = file.name.toLocaleLowerCase();

      return fileType === targetFileType || fileName.endsWith(targetFileType);
    });

    if (filteredFiles.length === 0) {
      alert("No files with valid file type. Please upload a .FRM file type files")
      return;
    }

    frmManager.addFrmFiles(filteredFiles);
  }
};

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

canvas.onmousedown = (event) => {
  canvas.style.cursor = "grabbing";

  const scale = frmManager.frmScale;

  let lastX = event.pageX;
  let lastY = event.pageY;

  let accumX = 0;
  let accumY = 0;

  document.onmousemove = (e) => {
    const x = lastX - e.pageX;
    const y = lastY - e.pageY;
    lastX = e.pageX;
    lastY = e.pageY;

    accumX += x;
    accumY += y;

    if (Math.abs(accumX) >= scale) {
      const shiftX = Math.ceil(Math.abs(x) / scale) * Math.sign(x) * -1;
      frmManager.setUserShift(shiftX, 0);
      accumX = 0;
    }

    if (Math.abs(accumY) >= scale) {
      const shiftY = Math.ceil(Math.abs(y) / scale) * Math.sign(y) * -1;
      frmManager.setUserShift(0, shiftY);
      accumY = 0;
    }
  };

  canvas.onmouseup = () => {
    document.onmousemove = null;
    canvas.onmouseup = null;
    canvas.style.cursor = "";
  };
};

input.onchange = (event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  addFiles(files);

  // unlink files from input
  target.value = '';
};

const transparencyCheckbox = document.querySelector("#transparency") as HTMLInputElement;

transparencyCheckbox.onchange = (event) => {
  const currentTarget = event.currentTarget as HTMLInputElement;
  if (currentTarget) {
    frmManager.changeFrmTransparencyColor(currentTarget.checked);
  }
}

const imageGenerator = document.querySelector("#image-generator") as HTMLBRElement;

imageGenerator.onclick = () => {
  frmManager.generatImagesFromFrm();
};

// Drag and drop
const dropZone = document.querySelector(".drop-zone") as HTMLBodyElement;
let dragCounter = 0;


body.addEventListener("dragenter", (event) => {
  event.preventDefault();

  if (dragCounter > 1) return;

  dragCounter++;

  dropZone.classList.remove("drop-zone-hidden");
});

body.addEventListener("dragleave", (event) => {
  event.preventDefault();

  dragCounter--;

  if (dragCounter === 0) {
    dropZone.classList.add("drop-zone-hidden");
  }
})

body.addEventListener("dragover", (event) => {
  event.preventDefault();
});

body.addEventListener("drop", (event) => {
  event.preventDefault();

  const files = event.dataTransfer?.files;
  addFiles(files);

  dragCounter = 0;

  dropZone.classList.add("drop-zone-hidden");
})