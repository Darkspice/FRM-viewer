import { FRMManager } from "./FRMManager";

const app = document.querySelector("#app") as HTMLDivElement;
const frmContainer = document.querySelector("#frm-container") as HTMLDivElement;
const input = document.querySelector("#frm-input") as HTMLInputElement;
const frmList = document.querySelector(".frm-list") as HTMLOListElement;
const canvas = document.querySelector("#frm-canvas") as HTMLCanvasElement;

const clockwiseButton = document.querySelector("#clockwise") as HTMLButtonElement;
const counterClockwiseButton = document.querySelector("#counter-clockwise") as HTMLButtonElement;

const frmManager = new FRMManager(frmList, canvas);

clockwiseButton.onclick = frmManager.changeFrmDirection.bind(frmManager, 1);
counterClockwiseButton.onclick = frmManager.changeFrmDirection.bind(frmManager, -1);

// Register hotkeys
document.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowDown') {
    event.preventDefault();
    frmManager.setNextFrm();
  }
  if (event.code === 'ArrowUp') {
    event.preventDefault();
    frmManager.setPreviousFrm();
  }
  if (event.code === 'ArrowRight') {
    event.preventDefault();
    frmManager.changeFrmDirection(1);
  }
  if (event.code === 'ArrowLeft') {
    event.preventDefault();
    frmManager.changeFrmDirection(-1);
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