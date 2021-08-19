
export type TBPF = string | number | number[] | number[][];
export type TBPFPoint = [number, number, number];
export type TStrictBPF = TBPFPoint[];

export const isNumberArray = (x: any): x is number[] => Array.isArray(x) && x.every(e => typeof e === "number");

/**
 * A BPF can be described as a succesion of three number tuples.
 * i.e. `1 1 0.5 2 1 1` curve mode means go to 0 immediately then go to 1 in 1s with a curve of e^0.5, then go to 2 in 1s linear.
 * The function transform the string to number[][], i.e. `[[1, 1, 0.5], [2, 1, 1]]`
 */
 export const decodeBPF = (sIn: TBPF, tupleLength: number): number[][] => {
    if (typeof sIn === "number") return [[sIn]];
    if (isNumberArray(sIn)) return [sIn];
    if (Array.isArray(sIn) && sIn.every(a => isNumberArray(a))) return sIn;
    if (typeof sIn !== "string") throw new Error("Failed to decode curve.");
    const numbers = sIn.split(" ").filter(s => !!s).map(s => +s);
    if (numbers.find(v => !isFinite(v))) throw new Error("BPF contains invalid number.");
    const tuples: number[][] = [];
    for (let i = 0; i < numbers.length; i++) {
        const $tuple = ~~(i / tupleLength);
        const $ = i % tupleLength;
        if (!tuples[$tuple]) tuples[$tuple] = [];
        tuples[$tuple][$] = numbers[i];
    }
    return tuples;
};
export const decodeCurve = (sIn: TBPF) => decodeBPF(sIn, 3);
export const decodeLine = (sIn: TBPF) => decodeBPF(sIn, 2);
