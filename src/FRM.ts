import { FRMFrame } from "./FRMFrame";
import { FRMHeader } from "./FRMHeader";

export class FRM {
  name: string;
  isLoaded: boolean;
  frmHeader: FRMHeader;
  frmFrames: FRMFrame[];

  directions = 6;

  onLoad: (() => void) | null = null;

  FRMBuffer: ArrayBuffer;

  constructor(file: File) {
    // @TODO: how about file.arrayBuffer ?
    this.name = file.name;

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      this.isLoaded = true;

      this.FRMBuffer = reader.result as ArrayBuffer;
      this.frmHeader = this.createFrmHeader(this.FRMBuffer);

      const isOneDirection = this.frmHeader.dirrOffest.every((offset) => offset === this.frmHeader.dirrOffest[0]);
      if (isOneDirection) {
        this.directions = 1;
      }

      this.frmFrames = this.createAllFrmFrames();

      if (this.onLoad) {
        this.onLoad();
      }
    };

  }

  private createFrmHeader(buffer: ArrayBuffer) {
    return new FRMHeader(buffer);
  }

  private createAllFrmFrames() {
    const frames: FRMFrame[] = Array(this.directions);
    for(let dir = 0; dir < this.directions; dir++) {
      const dirOffset = this.frmHeader.dirrOffest[dir];
      let frameOffset = 0;
      for (let frame = 0; frame < this.frmHeader.numFrames; frame++) {
        const currentOffset = dirOffset + frameOffset;
        const index = dir * this.frmHeader.numFrames + frame;
        frames[index] = new FRMFrame(this.FRMBuffer, currentOffset);
        frameOffset += frames[index].frameSize;
      }
    }

    return frames;
  }

  public getFrames(dir: number) {
    dir %= this.directions;

    const start = this.frmHeader.numFrames * dir;
    const end = start + this.frmHeader.numFrames;

    return this.frmFrames.slice(start, end);
  }

  public isStatic() {
    return this.frmHeader.numFrames <= 1;
  }
}