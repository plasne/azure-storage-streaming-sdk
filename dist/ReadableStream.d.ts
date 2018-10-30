import Stream, { IStreamOptions } from './Stream';
export declare type state = 'initializing' | 'readable' | 'canceled' | 'paused' | 'ended';
export default class ReadableStream<T, U> extends Stream<T, U> {
    private isPaused;
    private isCanceled;
    constructor(obj?: IStreamOptions<T, U>);
    readonly state: state;
    cancel(): void;
    pause(): void;
    resume(): void;
    push(input: T, ...args: any[]): U | null;
}
