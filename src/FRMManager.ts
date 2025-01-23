import JSZip from "jszip";
import { FRMFrame, FRM } from "./FRM";
import { SECOND } from "./constants";
import {
  FIRE_FAST_DELAY,
  FIRE_FAST_OFFSET,
  FIRE_SLOW_DELAY,
  FIRE_SLOW_OFFSET,
  MONITORS_DELAY,
  MONITORS_OFFSET,
  PALETTE_INDICES_OFFSET,
  SHORELINE_DELAY,
  SHORELINE_OFFSET,
  SLIME_DELAY,
  SLIME_OFFSET,
  changeTransparencyColor,
  createPaletteUpdater,
  fireFast,
  fireSlow,
  monitors,
  palette,
  shoreline,
  slime
} from "./palette";
import { constructPictureName } from "./utils";

type FileInfo = {
  name: string;
  blob: Blob;
}

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
  private activeFrmFrame: number = 0;

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
      // @TODO: convert to templates
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
  public addFrmFiles(files: File[]) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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

  /**
   * Deleting FRM which is currently selected
   */
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

    if (frmId === this.activeFrmId) {
      this.removeActiveFrmFile();
    } else {
      this.removeFrmFile(frmId);
    }
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
    // @TODO: This is force to start animated FRM from 0 frame
    // but for static - ok
    this.playFrmAnimation(this.activeFrmId, this.activeFrmDir);
  }

  public decreaseFrmScale() {
    if (this.frmScale <= 1) {
      return;
    }
    this.frmScale -= 1;
    this.frmCtx.resetTransform();
    this.frmCtx.scale(this.frmScale, this.frmScale);
    this.playFrmAnimation(this.activeFrmId, this.activeFrmDir);
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
      return;
    }

    this.renderSpecificFrame(this.activeFrmId, this.activeFrmDir, this.activeFrmFrame);
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
      Math.floor((this.frmCanvas.height - 200 / 2) / this.frmScale) + frm.frmHeader.pixelShiftY[dir] + this.userFrmShiftY,
    ];
  }

  public changeFrmTransparencyColor(isOn: boolean) {
    changeTransparencyColor(isOn);

    const frm = this.getFrmFile(this.activeFrmId);
    if (frm?.isStatic()) {
      this.playFrmAnimation(this.activeFrmId, this.activeFrmDir);
    }
  }

  public renderSpecificFrame(frmId: number, dir: number, specificFrame: number) {
    const frm = this.getFrmFile(frmId);

    if (!frm) {
      console.error('no such FRM in frm list');
      return;
    }

    const frames = frm.getFrames(dir);
    let [shiftX, shiftY] = this.getBaseShift(frmId, dir);

    shiftX -= Math.floor(frames[specificFrame].frameWidth / 2);
    shiftY -= frames[specificFrame].frameHeight;

    shiftX += frames[specificFrame].shiftX;
    shiftY += frames[specificFrame].shiftY;

    this.renderFrame(this.frmCtx, frames[specificFrame], shiftX, shiftY);
  }


  public renderStaticFrm(frmId: number, dir: number) {
    this.renderSpecificFrame(frmId, dir, 0);
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
    let shiftX = 0;
    let shiftY = 0;

    if (frm.isStatic() && !frm.frmFrames[0].hasSpecialColorIndices()) {
      this.renderStaticFrm(frmId, dir);
      return;
    }

    const slimeUpdater = createPaletteUpdater(palette, SLIME_OFFSET, slime, SLIME_DELAY);
    const monitorsUpdater = createPaletteUpdater(palette, MONITORS_OFFSET, monitors, MONITORS_DELAY);
    const fireSlowUpdater = createPaletteUpdater(palette, FIRE_SLOW_OFFSET, fireSlow, FIRE_SLOW_DELAY);
    const fireFastUpdater = createPaletteUpdater(palette, FIRE_FAST_OFFSET, fireFast, FIRE_FAST_DELAY);
    const shorelineUpdater = createPaletteUpdater(palette, SHORELINE_OFFSET, shoreline, SHORELINE_DELAY);

    const delay = SECOND / frm.frmHeader.fps;

    const render = (delta: number) => {
      const interval = delta - lastDelta;
      if (interval > delay) {
        lastDelta = delta;

        slimeUpdater(delta);
        monitorsUpdater(delta);
        fireSlowUpdater(delta);
        fireFastUpdater(delta);
        shorelineUpdater(delta);

        const [baseX, baseY] = this.getBaseShift(frmId, dir);

        shiftX += baseX;
        shiftY += baseY;

        shiftX -= Math.floor(frames[this.activeFrmFrame].frameWidth / 2);
        shiftY -= frames[this.activeFrmFrame].frameHeight;

        shiftX += frames[this.activeFrmFrame].shiftX;
        shiftY += frames[this.activeFrmFrame].shiftY;

        this.renderFrame(this.frmCtx, frames[this.activeFrmFrame], shiftX, shiftY);

        shiftX += Math.floor(frames[this.activeFrmFrame].frameWidth / 2);
        shiftY += frames[this.activeFrmFrame].frameHeight;

        shiftX -= baseX;
        shiftY -= baseY;

        this.activeFrmFrame += 1;

        if (this.activeFrmFrame >= frm.frmHeader.numFrames) {
          this.activeFrmFrame = 0;
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
    this.activeFrmFrame = 0;
  }

  /**
   * Render specific FRM frame
   */
  public renderFrame(ctx: CanvasRenderingContext2D, frame: FRMFrame, shiftX: number, shiftY: number) {
    ctx.clearRect(0, 0, this.frmCanvas.width, this.frmCanvas.height);

    for (let y = 0; y < frame.frameHeight; y++) {
      for (let x = 0; x < frame.frameWidth; x++) {
        const position = frame.getFrameIndex(y * frame.frameWidth + x) * PALETTE_INDICES_OFFSET /* palette array shift */;
        const r = palette[position];
        const g = palette[position + 1];
        const b = palette[position + 2];
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + shiftX, y + shiftY, 1, 1);
      }
    }
  }

  public generatImagesFromFrm() {
    const frm = this.getFrmFile(this.activeFrmId);
    if (frm) {
      const zip = new JSZip();

      const name = frm.name.split('.')[0];
      const framesCount = frm.frmHeader.numFrames;

      const imagePromises: Array<Promise<FileInfo>> = [];

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext('2d')!;

      for (let i = 0; i < frm.frmFrames.length; i++) {
        const frame = frm.frmFrames[i];

        const width = frame.frameWidth;
        const height = frame.frameHeight;

        canvas.width = width;
        canvas.height = height;

        const pixelArray = new Array();

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const position = frame.getFrameIndex(y * frame.frameWidth + x) * PALETTE_INDICES_OFFSET /* palette array shift */;
            const r = palette[position];
            const g = palette[position + 1];
            const b = palette[position + 2];

            const isWhite = [r, g, b].every((color) => color === 255);
            const a = isWhite ? 0 : 255;

            pixelArray.push(r, g, b, a);
          }
        }

        const imageData = new ImageData(new Uint8ClampedArray(pixelArray), width, height);
        ctx.putImageData(imageData, 0, 0);

        const fileName = constructPictureName(name, framesCount, i);
        let resolve: (value: FileInfo) => void;
        let reject: (value: string) => void;
        const picPromise = new Promise<FileInfo>((res, rej) => {
          resolve = res;
          reject = rej;
        })
        imagePromises.push(picPromise);
        canvas.toBlob((blob) => {
          if (blob) {
            return resolve({ name: fileName, blob: blob });
          }

          reject("Blob creation failed");
        });
      }

      Promise.all(imagePromises).then((files: FileInfo[]) => {
        files.forEach((fileInfo) => {
          zip.file(`${fileInfo.name}.png`, fileInfo.blob);
        })

        return zip.generateAsync({ type: "blob" })
      }).then((content) => {
        const link = document.createElement('a');
        link.download = `${name}.zip`;
        link.href = URL.createObjectURL(content);
        link.click();

        URL.revokeObjectURL(link.href);
      })
    }
  }
}