interface Base { a: number; b: string; c: Set<string>; d?: { x: number }; }
interface MState2 extends Base { drugs?: string[]; [key: string]: unknown; }
declare const b: Base;
const m: MState2 = b;
console.log(m);
