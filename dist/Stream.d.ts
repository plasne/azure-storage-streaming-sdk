/// <reference types="node" />
import { EventEmitter } from 'events';
export declare type StreamTransform<T, U> = (obj: T, metadata?: any) => U | null;
export interface IStreamOptions<T, U> {
    transform?: StreamTransform<T, U>;
    maxBuffer?: number;
    batchSize?: number;
    processAfter?: Promise<any>;
}
export default abstract class Stream<T, U> extends EventEmitter {
    options: IStreamOptions<T, U>;
    buffer: U[];
    processing: Array<Promise<any>>;
    protected isEnded: boolean;
    protected isReadable: boolean;
    abstract readonly state: string;
    constructor(obj?: IStreamOptions<T, U>);
    push(input: T, ...args: any[]): U | null;
    process(work: () => Promise<any> | null, concurrency?: number): Promise<void>;
    process(from: Stream<any, any>, work: () => Promise<any> | null, concurrency?: number): Promise<void>;
    pipe(stream: Stream<U, any>, propogateEnd?: boolean): void;
    waitForEnd(ms?: number): Promise<void>;
    waitForIdle(ms?: number): Promise<void>;
}
