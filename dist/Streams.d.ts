/// <reference types="node" />
import { EventEmitter } from "events";
export declare type StreamTransform<T, U> = (obj: T, metadata?: any) => U | null;
export interface StreamOptions<T, U> {
    transform?: StreamTransform<T, U>;
    maxBuffer?: number;
    processAfter?: Promise<any>;
}
declare abstract class Stream<T, U> extends EventEmitter {
    options: StreamOptions<T, U>;
    buffer: U[];
    protected isEnded: boolean;
    protected isReadable: boolean;
    abstract readonly state: string;
    push(input: T): U | null;
    process(work: () => Promise<any> | null): Promise<void>;
    process(from: Stream<any, any>, work: () => Promise<any> | null): Promise<void>;
    process(work: () => Promise<any> | null, concurrency: number): Promise<void>;
    process(from: Stream<any, any>, work: () => Promise<any> | null, concurrency: number): Promise<void>;
    processSelf(work: () => Promise<any> | null, concurrency?: number): Promise<void>;
    processFrom(from: Stream<any, any>, work: () => Promise<any> | null, concurrency?: number): Promise<void>;
    pipe(stream: Stream<U, any>, propogateEnd?: boolean): void;
    waitForEnd(): Promise<{}>;
    constructor(obj?: StreamOptions<T, U>);
}
export declare class ReadableStream<T, U> extends Stream<T, U> {
    private isPaused;
    private isCanceled;
    readonly state: "initializing" | "readable" | "canceled" | "paused" | "ended";
    cancel(): void;
    pause(): void;
    resume(): void;
    push(input: T): U | null;
    constructor(obj?: StreamOptions<T, U>);
}
export declare class WriteableStream<T, U> extends Stream<T, U> {
    readonly state: "initializing" | "readable" | "ended";
    end(): void;
    constructor(obj?: StreamOptions<T, U>);
}
export {};
