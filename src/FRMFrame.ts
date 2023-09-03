export class FRMFrame {
  private readonly viewer: DataView;

  public frameWidth: number;
  public frameHeight: number;
  public size: number;
  public shiftX: number;
  public shiftY: number;

  public frmBuffer: ArrayBuffer;
  public offset: number;

  public frameSize: number;

  // Color indices start at 12 position
  public frameHeaderLength: number = 12;

  constructor(buffer: ArrayBuffer, offset: number) {
    this.frmBuffer = buffer;
    this.offset = offset;

    this.viewer = new DataView(this.frmBuffer, this.offset);

    this.frameWidth = this.viewer.getUint16(0);
    this.frameHeight = this.viewer.getUint16(2);
    this.size = this.viewer.getUint32(4);
    this.shiftX = this.viewer.getInt16(8);
    this.shiftY = this.viewer.getInt16(10);

    this.frameSize = this.size + this.frameHeaderLength;
  }

  public *getFrameIndices() {
    for (let i = 0; i < this.size; i++) {
      yield this.viewer.getUint8(this.frameHeaderLength + i);
    }
  }

  public getFrameIndex(indexPosition: number) {
    if (indexPosition >= this.frameSize || indexPosition < 0) {
      console.error(`frame color index position: ${indexPosition} out of range`);
    }

    return this.viewer.getUint8(this.frameHeaderLength + indexPosition);
  }

  public print() {
    console.log(this);
  }
}