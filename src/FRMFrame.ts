export class FRMFrame {
  frameWidth: number;
  frameHeight: number;
  size: number;
  shiftX: number;
  shiftY: number;

  frmBuffer: ArrayBuffer;
  offset: number;

  frameSize: number;

  static readonly frameHeaderLength: number = 12;

  constructor(buffer: ArrayBuffer, offset: number) {
    this.frmBuffer = buffer;
    this.offset = offset;

    const viewer = new DataView(this.frmBuffer, this.offset);

    this.frameWidth = viewer.getUint16(0);
    this.frameHeight = viewer.getUint16(2);
    this.size = viewer.getUint32(4);
    this.shiftX = viewer.getInt16(8);
    this.shiftY = viewer.getInt16(10);

    this.frameSize = this.getFrameSize();
  }

  getFrameSize() {
    return this.size + FRMFrame.frameHeaderLength;
  }

  print() {
    console.log(this);
  }
}