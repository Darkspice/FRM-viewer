import { FRM } from "./FRM";
import { FRMFrame } from "./FRMFrame";
import { palette } from "./palette";

export class FRMManager {
  public frmListContainer: HTMLOListElement;

  public frmCanvas: HTMLCanvasElement;
  public frmCtx: CanvasRenderingContext2D;
  public frmScale: number = 1;
  public userFrmShiftX: number = 0;
  public userFrmShiftY: number = 0;

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
    this.getLiByFrmId(frmId)?.remove();

    if (this.activeFrmId === frmId) {
      this.stopFrmAnimation();
    }
  }

  public removeActiveFrmFile() {
    const deletingdActiveId = this.activeFrmId;

    this.removeFrmFile(deletingdActiveId);

    if (!this.frmFiles.size) {
      return;
    }

    const frmIdList = [...this.frmFiles.keys()]
    const maxId = Math.max(...frmIdList);

    if (maxId === deletingdActiveId - 1) {
      this.setActiveFrm(frmIdList[frmIdList.length - 1]);
      return;
    }

    for (let id = deletingdActiveId + 1; id <= maxId; id++) {
      if (this.frmFiles.has(id)) {
        this.setActiveFrm(id);
        return;
      }
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
    this.setActiveFrm(frmId);
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
   * Get li from ul list
   */
  public getLiByFrmId(frmId: number): HTMLLIElement | null {
    return this.frmListContainer.querySelector(`[data-frm-id="${frmId}"]`);
  }

  /**
   * Set active FRM, toggle styles to li, play FRM animation
   */
  public setActiveFrm(frmId: number) {
    const li = this.getLiByFrmId(frmId);
    const activeFrmLi = this.getLiByFrmId(this.activeFrmId);

    if (li) {
      li.classList.toggle('frm-active');
      li.tabIndex = 0;
      li.focus();
    }

    if (activeFrmLi) {
      activeFrmLi.classList.toggle('frm-active');
    }

    this.activeFrmId = frmId;
    this.playFrmAnimation(frmId, this.activeFrmDir = 0);
  }

  public setNextFrm() {
    if (!this.frmFiles.size) {
      return;
    }

    const frmListId = [...this.frmFiles.keys()];
    const activeIdIndex = frmListId.findIndex((key) => key === this.activeFrmId);
    const nextId = frmListId[activeIdIndex + 1];

    if (nextId === undefined) {
      this.setActiveFrm(frmListId[0]);
      return;
    }

    this.setActiveFrm(nextId);
  }

  public setPreviousFrm() {
    if (!this.frmFiles.size) {
      return;
    }

    const frmListId = [...this.frmFiles.keys()];
    const activeIdIndex = frmListId.findIndex((key) => key === this.activeFrmId);
    const prevId = frmListId[activeIdIndex - 1];

    if (prevId === undefined) {
      this.setActiveFrm(frmListId[frmListId.length - 1]);
      return;
    }

    this.setActiveFrm(prevId);
  }

  public increaseFrmScale() {
    if (this.frmScale >= 5) {
      return;
    }
    this.frmScale += 1;
    this.frmCtx.resetTransform();
    this.frmCtx.scale(this.frmScale, this.frmScale);
  }

  public decreaseFrmScale() {
    if (this.frmScale <= 1) {
      return;
    }
    this.frmScale -= 1;
    this.frmCtx.resetTransform();
    this.frmCtx.scale(this.frmScale, this.frmScale);
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

    this.playFrmAnimation(this.activeFrmId, direction);
    this.activeFrmDir = direction;
  }

  public setUserShift(x: number, y: number) {
    this.userFrmShiftX += x;
    this.userFrmShiftY += y;

    const frm = this.getFrmFile(this.activeFrmId);

    if (!frm) {
      return;
    }

    if (frm.isStatic()) {
      this.renderStaticFrm(this.activeFrmId, this.activeFrmDir);
    }
  }

  public resetUserShift() {
    this.userFrmShiftX = 0;
    this.userFrmShiftY = 0;

    const frm = this.getFrmFile(this.activeFrmId);

    if (!frm) {
      return;
    }

    if (frm.isStatic()) {
      this.renderStaticFrm(this.activeFrmId, this.activeFrmDir);
    }
  }

  public getBaseShift(frmId: number, dir: number) {
    const frm = this.getFrmFile(frmId);

    if (!frm) {
      console.error('can\'t get shifts');
      return [0, 0];
    }

    return [
      Math.floor((this.frmCanvas.width / 2) / this.frmScale) + frm.frmHeader.pixelShiftX[dir] + this.userFrmShiftX,
      Math.floor((this.frmCanvas.height - 200 / 2 ) / this.frmScale) + frm.frmHeader.pixelShiftY[dir] + this.userFrmShiftY,
    ];
  }


  public renderStaticFrm(frmId: number, dir: number) {
    const frm = this.getFrmFile(frmId);

    if (!frm) {
      console.error('no such FRM in frm list');
      return;
    }

    const frames = frm.getFrames(dir);
    const currentFrame = 0;

    let [shiftX, shiftY] = this.getBaseShift(frmId, dir);

      shiftX -= Math.floor(frames[currentFrame].frameWidth / 2);
      shiftY -= frames[currentFrame].frameHeight;

      shiftX += frames[currentFrame].shiftX;
      shiftY += frames[currentFrame].shiftY;

      this.renderFrame(frames[0], shiftX, shiftY);
  }

  /**
   * Start playing FRM in canvas
   */
  public playFrmAnimation(frmId: number, dir: number) {
    this.stopFrmAnimation();
    const frm = this.getFrmFile(frmId);

    if (!frm) {
      console.error('no such FRM in frm list');
      return;
    }

    const frames = frm.getFrames(dir);

    let lastDelta = 0;
    let currentFrame = 0;
    let shiftX = 0;
    let shiftY = 0;

    if (frm.isStatic()) {
      this.renderStaticFrm(frmId, dir);
      return;
    }

    const delay = 1000 / frm.frmHeader.fps;

    const render = (delta: number) => {
      const interval = delta - lastDelta;
      if (interval > delay) {
        lastDelta = delta;

        const [baseX, baseY] = this.getBaseShift(frmId, dir);

        shiftX += baseX;
        shiftY += baseY;

        shiftX -= Math.floor(frames[currentFrame].frameWidth / 2);
        shiftY -= frames[currentFrame].frameHeight;

        shiftX += frames[currentFrame].shiftX;
        shiftY += frames[currentFrame].shiftY;

        this.renderFrame(frames[currentFrame], shiftX, shiftY);

        shiftX += Math.floor(frames[currentFrame].frameWidth / 2);
        shiftY += frames[currentFrame].frameHeight;

        shiftX -= baseX;
        shiftY -= baseY;

        currentFrame += 1;

        if (currentFrame >= frm.frmHeader.numFrames) {
          currentFrame = 0;
          shiftX = 0;
          shiftY = 0;
        }
      }

      this.rafId = window.requestAnimationFrame(render);
    }

    this.rafId = window.requestAnimationFrame(render);
  }

  /**
   * Stop rendering FRM in canvas
   */
  public stopFrmAnimation() {
    window.cancelAnimationFrame(this.rafId);
    this.frmCtx.clearRect(0, 0, this.frmCanvas.width, this.frmCanvas.height);
  }

  /**
   * Render specific FRM frame
   */
  public renderFrame(frame: FRMFrame, shiftX: number, shiftY: number) {

    const viewer = new DataView(frame.frmBuffer, frame.offset + FRMFrame.frameHeaderLength);
    this.frmCtx.clearRect(0, 0, this.frmCanvas.width, this.frmCanvas.height);

    for (let y = 0; y < frame.frameHeight; y++) {
      for (let x = 0; x < frame.frameWidth; x++) {
        const position = viewer.getUint8(y * frame.frameWidth + x) * 3 /* palette array shift */;
        const r = palette[position];
        const g = palette[position + 1];
        const b = palette[position + 2];
        this.frmCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.frmCtx.fillRect(x + shiftX, y + shiftY, 1, 1);
      }
    }
  }
}