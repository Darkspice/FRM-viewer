export const rangeToArray = (from: number, to: number, step: number = 1) => {
  const arr = [];
  for (let i = from; i <= to; i += step) {
    arr.push(i);
  }

  return arr;
}