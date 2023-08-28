import { palette } from "./palette";

const app = document.querySelector("#app") as HTMLDivElement;
const input = document.querySelector("#frm-input") as HTMLInputElement;

class FRMHeader {
  version: number;
  fps: number;
  actionFrame: number;
  numFrames: number;
  pixelShiftX: number[] = Array(6).fill(0);
  pixelShiftY: number[] = Array(6).fill(0);
  dirrOffest: number[] = Array(6).fill(0);
  totalSize: number;

  private readonly frameDataStart: number = 0x003E;

  constructor(buffer: ArrayBuffer) {
    const viewer = new DataView(buffer);
    this.version = viewer.getUint32(0);
    this.fps = viewer.getUint16(4);
    this.actionFrame = viewer.getUint16(6);
    this.numFrames = viewer.getUint16(8);

    for (let i = 0; i < 6; i++) {
      this.pixelShiftX[i] = viewer.getUint16(10 + (i * 2));
      this.pixelShiftY[i] = viewer.getUint16(22 + (i * 2));
      this.dirrOffest[i] = viewer.getUint32(34 + (i * 4)) + this.frameDataStart;
    }

    this.totalSize = viewer.getUint32(58);
  }

  print() {
    console.log(this);
  }
}


class FRMFrame {
  frameWidth: number;
  frameHeight: number;
  size: number;
  shiftX: number;
  shiftY: number;
  indices: number[];

  readonly frameHeaderLength: number = 12;

  constructor(buffer: ArrayBuffer, offset: number) {
    const viewer = new DataView(buffer, offset);

    this.frameWidth = viewer.getUint16(0);
    this.frameHeight = viewer.getUint16(2);
    this.size = viewer.getUint32(4);
    this.shiftX = viewer.getUint16(8);
    this.shiftY = viewer.getUint16(10);

    this.indices = Array(this.size);
    for (let i = 0; i < this.size; i++) {
      this.indices[i] = (viewer.getUint8(12 + i))
    }
  }

  getFrameSize() {
    return this.size + this.frameHeaderLength;
  }

  print() {
    console.log(this);
  }
}

class FRMFrameAnim {
  frmFrames: FRMFrame[];

  constructor(frmHeader: FRMHeader, dir: number, buffer: ArrayBuffer) {
    dir %= 6;
    this.frmFrames = Array(frmHeader.numFrames);

    let offset = 0;
    for (let i = 0; i < frmHeader.numFrames; i++) {
      this.frmFrames[i] = new FRMFrame(buffer, frmHeader.dirrOffest[dir] + offset);
      offset += this.frmFrames[i].getFrameSize();
    }
  }
}

input.onchange = (event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  const reader = new FileReader();

  reader.readAsArrayBuffer(files[0])

  reader.onload = () => {
    const buffer = reader.result as ArrayBuffer;

    const frmHeader = new FRMHeader(buffer);
    frmHeader.print();

    const anim1 = new FRMFrameAnim(frmHeader, 0, buffer);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    window.requestAnimationFrame(render);

    let lastDelta = 0;
    let currentFrame = 0;
    const delay = 1000 / (frmHeader.fps || 1);
    function render (delta: number) {
      const interval = delta - lastDelta;
      if (interval > delay) {
        lastDelta = delta;

        canvas.width = anim1.frmFrames[currentFrame].frameWidth;
        canvas.height = anim1.frmFrames[currentFrame].frameHeight;

        for (let y = 0; y < anim1.frmFrames[currentFrame].frameHeight; ++y) {
          for (let x = 0; x < anim1.frmFrames[currentFrame].frameWidth; ++x) {
            const position = anim1.frmFrames[currentFrame].indices[y * anim1.frmFrames[currentFrame].frameWidth + x] * 3;
            const r = palette[position];
            const g = palette[position + 1];
            const b = palette[position + 2];
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }

        currentFrame += 1;

        if (currentFrame >= frmHeader.numFrames) {
          currentFrame = 0;
        }
      }

      window.requestAnimationFrame(render);
    }



    app.append(canvas);
  }
};