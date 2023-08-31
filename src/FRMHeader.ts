export class FRMHeader {
  version: number;
  defaultFps: number = 10;
  fps: number;
  actionFrame: number;
  defaultNumFrames: number = 1;
  numFrames: number;
  pixelShiftX: number[] = Array(6).fill(0);
  pixelShiftY: number[] = Array(6).fill(0);
  dirrOffest: number[] = Array(6).fill(0);
  totalSize: number;

  private readonly frameDataStart: number = 0x003E;

  constructor(buffer: ArrayBuffer) {
    const viewer = new DataView(buffer);
    this.version = viewer.getUint32(0);
    this.fps = viewer.getUint16(4) || this.defaultFps;
    this.actionFrame = viewer.getUint16(6);
    this.numFrames = viewer.getUint16(8) || this.defaultNumFrames;

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