import { shortDirections } from "./constants";

export const rangeToArray = (from: number, to: number, step: number = 1) => {
  const arr = [];
  for (let i = from; i <= to; i += step) {
    arr.push(i);
  }

  return arr;
}

export const formatNumberWithLeadingZero = (index: number) => {
  return index < 10 ? `0${index}` : `${index}`;
}

export const constructPictureName = (picName: string, framesCount: number, frameIndex: number) => {
  const number = formatNumberWithLeadingZero(frameIndex % framesCount);
  const dirName = shortDirections[Math.floor(frameIndex / framesCount)];
  return [picName, dirName, number].join("_");
}