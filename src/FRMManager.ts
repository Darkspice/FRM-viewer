import { FRM } from "./FRM";
import { FRMFrame } from "./FRMFrame";
import { palette } from "./palette";

export class FRMManager {
  public frmListContainer: HTMLOListElement;
  public frmCanvas: HTMLCanvasElement;
  public frmCtx: CanvasRenderingContext2D;

  public readonly frmFiles: Map<number, FRM> = new Map();

  private frmId = 0;

  private rafId: number = 0;

  private activeFrmId: number = -1;
  private activeFrmDir: number = 0;

  constructor(listContainer: HTMLOListElement, frmCanvas: HTMLCanvasElement) {
    this.frmListContainer = listContainer;
    this.frmListContainer.addEventListener('click', this.handleChooseFrm.bind(this));

    this.frmCanvas = frmCanvas;
    this.frmCtx = frmCanvas.getContext('2d') as CanvasRenderingContext2D;
  }

  /**
   * Add FRM file to the list
   */
  public addFrmFile(file: File) {
    const frm = new FRM(file);
    frm.onLoad = () => {
      // @TODO: переделать на темплейты
      const li = document.createElement('li');
      li.dataset.frmId = String(this.frmId);

      const div = document.createElement('div');
      div.classList.add('file-item');

      const span = document.createElement('span');
      span.textContent = file.name;

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.textContent = 'x';
      removeButton.classList.add('remove-button');
      removeButton.addEventListener('click', this.handleRemoveFrm.bind(this));

      div.append(span, removeButton);

      li.append(div);

      this.frmListContainer.append(li);

      this.frmFiles.set(this.frmId, frm);
      this.frmId++;
    }
  }

  /**
   * Add FRM files from list or array
   */
  public addFrmFilesList(frmFileList: FileList) {
    for (let i = 0; i < frmFileList.length; i++) {
      const file = frmFileList.item(i);
      if (file) {
        this.addFrmFile(file);
      }
    }
  }

  /**
   * Get FRM file by id
   */
  public getFrmFile(frmId: number) {
    return this.frmFiles.get(frmId);
  }

  /**
   * Remove FRM file from list
   */
  public removeFrmFile(frmId: number) {
    if (Number.isNaN(frmId)) {
      console.error('incorrect file id');
    }

    this.frmFiles.delete(frmId);
    this.frmListContainer.querySelector(`[data-frm-id="${frmId}"]`)?.remove();

    if (this.activeFrmId === frmId) {
      this.stopFrm();
    }
  }

  /**
   * Choose frm file from the list
   */
  public handleChooseFrm(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const li = target.closest('li');

    if (!li) {
      return;
    }
    const frmId = Number(li.dataset.frmId);

    this.playFrm(frmId, this.activeFrmDir = 0);
  }

  /**
   * Remove frm file from the list
   */
  public handleRemoveFrm(event: MouseEvent) {
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const button = target.closest('button');
    const li = target.closest('li');

    if (!button || !li) {
      return;
    }

    const frmId = Number(li.dataset.frmId);
    this.removeFrmFile(frmId);
  }

  /**
   * Turn FRM clockwise or counter-clockwise
   */
  public changeFrmDirection(turnTo: -1 | 1) {
    const frm = this.getFrmFile(this.activeFrmId);

    if (!frm) {
      return;
    }

    const direction = (frm.directions + this.activeFrmDir + turnTo) % frm.directions;

    if (direction === this.activeFrmDir || frm.directions === 1) {
      return;
    }

    this.playFrm(this.activeFrmId, direction);
    this.activeFrmDir = direction;
  }

  /**
   * Start playing FRM in canvas
   */
  public playFrm(frmId: number, dir: number) {
    this.stopFrm();
    this.activeFrmId = frmId;
    const frm = this.getFrmFile(frmId);

    if (!frm) {
      console.error('no such FRM in frm list');
      return;
    }

    const frames = frm.getFrames(dir);

    let lastDelta = 0;
    let currentFrame = 0;
    const delay = 1000 / (frm.frmHeader.fps || 1);

    const render = (delta: number) => {
      const interval = delta - lastDelta;
      if (interval > delay) {
        lastDelta = delta;

        this.renderFrame(frames[currentFrame])

        currentFrame += 1;

        if (currentFrame >= frm.frmHeader.numFrames) {
          currentFrame = 0;
        }
      }

      this.rafId = window.requestAnimationFrame(render);
    }

    this.rafId = window.requestAnimationFrame(render);
  }

  /**
   * Stop rendering FRM in canvas
   */
  public stopFrm() {
    window.cancelAnimationFrame(this.rafId);
    this.frmCtx.clearRect(0, 0, this.frmCanvas.width, this.frmCanvas.height);
  }

  /**
   * Render specific FRM frame
   */
  public renderFrame(frame: FRMFrame) {
    this.frmCanvas.width = frame.frameWidth;
    this.frmCanvas.height = frame.frameHeight;

    const viewer = new DataView(frame.frmBuffer, frame.offset + FRMFrame.frameHeaderLength);

    for (let y = 0; y < frame.frameHeight; y++) {
      for (let x = 0; x < frame.frameWidth; x++) {
        const position = viewer.getUint8(y * frame.frameWidth + x) * 3 /* palette array shift */;
        const r = palette[position];
        const g = palette[position + 1];
        const b = palette[position + 2];
        this.frmCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.frmCtx.fillRect(x, y, 1, 1);
      }
    }
  }
}