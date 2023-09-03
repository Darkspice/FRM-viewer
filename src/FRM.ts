import { FRMFrame } from "./FRMFrame";
import { FRMHeader } from "./FRMHeader";

export class FRM {
  public name: string;
  public isLoaded: boolean;
  public frmHeader: FRMHeader;
  public frmFrames: FRMFrame[];

  public directions = 6;

  public onLoad: (() => void) | null = null;

  public FRMBuffer: ArrayBuffer;

  constructor(file: File) {
    // @TODO: how about file.arrayBuffer ?
    this.name = file.name;

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      this.isLoaded = true;

      this.FRMBuffer = reader.result as ArrayBuffer;
      this.frmHeader = new FRMHeader(this.FRMBuffer);

      const hasOneDirection = this.frmHeader.dirrOffest.every((offset) => offset === this.frmHeader.dirrOffest[0]);
      if (hasOneDirection) {
        this.directions = 1;
      }

      this.frmFrames = this.createAllFrmFrames();

      if (this.onLoad) {
        this.onLoad();
      }
    };

  }

  private createAllFrmFrames() {
    const frames: FRMFrame[] = Array(this.directions * this.frmHeader.numFrames);

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