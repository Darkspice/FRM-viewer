export class FRMHeader {
  public version: number;
  public defaultFps: number = 10;
  public fps: number;
  public actionFrame: number;
  public defaultNumFrames: number = 1;
  public numFrames: number;
  public pixelShiftX: number[] = Array(6).fill(0);
  public pixelShiftY: number[] = Array(6).fill(0);
  public dirrOffest: number[] = Array(6).fill(0);
  public totalSize: number;

  private readonly frameDataStart: number = 0x003E; // File header length
  private readonly directionCount: number = 6; // FRM has always 6 directions

  constructor(buffer: ArrayBuffer) {
    const viewer = new DataView(buffer);
    this.version = viewer.getUint32(0);

    this.fps = viewer.getUint16(4) || this.defaultFps;
    // @TODO: static frm always has 1 fps, we make it 10 for
    // colors animation
    if (this.fps === 1) {
      this.fps = this.defaultFps;
    }

    this.actionFrame = viewer.getUint16(6);
    this.numFrames = viewer.getUint16(8) || this.defaultNumFrames;

    for (let i = 0; i < this.directionCount; i++) {
      this.pixelShiftX[i] = viewer.getInt16(10 + (i * 2));
      this.pixelShiftY[i] = viewer.getInt16(22 + (i * 2));

      // That is because the "frame area" begins from offset 0x003E.
      // As instance first dirrOffest will be "0", but "0" is start address
      // of our file, that is why we need to add whole header length - 0x003E.
      this.dirrOffest[i] = viewer.getUint32(34 + (i * 4)) + this.frameDataStart;
    }

    this.totalSize = viewer.getUint32(58);
  }

  public print() {
    console.log(this);
  }
}