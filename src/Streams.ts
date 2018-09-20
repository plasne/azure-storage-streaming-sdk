
// includes
import { EventEmitter } from "events";
import PromisePool from "es6-promise-pool";

export type StreamTransform<T, U> = (obj: T, metadata?: any) => U | null;

export interface StreamOptions<T, U> {
    transform?:    StreamTransform<T, U>,
    maxBuffer?:    number,
    processAfter?: Promise<any>
}

abstract class Stream<T, U> extends EventEmitter {

    public    options:    StreamOptions<T, U>;
    public    buffer:     U[]     = [];
    protected isEnded:    boolean = false;
    protected isReadable: boolean = false;

    abstract get state(): string;

    public push(input: T) {

        // announce when there is data that can be read
        if (!this.isReadable) {
            this.isReadable = true;
            this.emit("readable");
        }

        // transform if a function was provided
        let output: U | null = input as any;
        if (this.options.transform) output = this.options.transform(input);

        // emit or push to buffer
        if (output) { // transform can return null to suppress
            if (this.listenerCount("data") > 0) {
                this.emit("data", output);
            } else {
                this.buffer.push(output);
            }
        }

        return output;
    }

    public async process(work: () => Promise<any> | null): Promise<void>;
    public async process(from: Stream<any, any>, work: () => Promise<any> | null): Promise<void>;
    public async process(work: () => Promise<any> | null, concurrency: number): Promise<void>;
    public async process(from: Stream<any, any>, work: () => Promise<any> | null, concurrency: number): Promise<void>;
    public async process(): Promise<void> {

        // get arguments
        let from: Stream<any, any> = this;
        let work: () => Promise<any> | null;
        let concurrency: number = 10;
        if (arguments[0] && typeof arguments[0] === "object") from = arguments[0];
        if (arguments[0] && typeof arguments[0] === "function") work = arguments[0];
        if (arguments[1] && typeof arguments[1] === "function") work = arguments[1];
        if (arguments[1] && typeof arguments[1] === "number") concurrency = arguments[1];
        if (arguments[2] && typeof arguments[2] === "number") concurrency = arguments[2];

        // produce promises to load the files
        const producer = () => {

            // if the consumer canceled or ended, then no need to continue
            if (from != this && (this.state === "canceled" || this.state === "ended")) return undefined;

            // if the consumer paused, then wait for them to resume
            if (this.state === "paused") return new Promise(resolve => setTimeout(resolve, 1000));

            // a custom function will determine the work to do
            const promise = work();
            if (promise) return promise;

            // if no more records are going to come, it, no need to continue
            if (from.state === "ended") return undefined;

            // wait for more records
            return new Promise(resolve => setTimeout(resolve, 1000));

        }

        // start processing
        //if (this..startAfter) await in_options.startAfter;
        const pool = new PromisePool(producer, concurrency);
        await pool.start();
        if (!this.isEnded) this.emit("end");

    }

    public async processSelf(work: () => Promise<any> | null, concurrency: number = 10) {

        // produce promises to load the files
        const producer = () => {

            // a custom function will determine the work to do
            const promise = work();
            if (promise) return promise;

            // if no more records are going to come, it, no need to continue
            if (this.state === "ended") return undefined;

            // wait for more records
            return new Promise(resolve => setTimeout(resolve, 1000));

        }

        // respect process after
        if (this.options.processAfter) await this.options.processAfter;

        // start processing
        const pool = new PromisePool(producer, concurrency);
        await pool.start();

    }

    public async processFrom(from: Stream<any, any>, work: () => Promise<any> | null, concurrency: number = 10) {

        // produce promises to load the files
        const producer = () => {

            // if the consumer canceled or ended, then no need to continue
            if (this.state === "canceled" || this.state === "ended") return undefined;

            // if the consumer paused, then wait for them to resume
            if (this.state === "paused") return new Promise(resolve => setTimeout(resolve, 1000));

            // a custom function will determine the work to do
            const promise = work();
            if (promise) return promise;

            // if no more records are going to come, it, no need to continue
            if (from.state === "ended") return undefined;

            // wait for more records
            return new Promise(resolve => setTimeout(resolve, 1000));

        }

        // respect process after
        if (from.options.processAfter) await from.options.processAfter;
        if (this.options.processAfter) await this.options.processAfter;

        // start processing
        const pool = new PromisePool(producer, concurrency);
        await pool.start();
        this.emit("end");

    }

    public pipe(stream: Stream<U, any>, propogateEnd: boolean = true) {
        this.on("data", (data: U) => {
            stream.push(data);
        });
        if (propogateEnd) {
            this.on("end", () => {
                stream.emit("end");
            });
        }
    }

    public waitForEnd() {
        return new Promise((resolve) => {
            this.on("end", () => {
                resolve();
            });
        });
    }

    constructor(obj?: StreamOptions<T, U>) {
        super();

        // apply settings
        this.options = obj || {};

        // raise errors, but don't throw them
        this.on("error", () => {
            // prevents: https://nodejs.org/api/events.html#events_error_events
        });

        // wire up internal events
        this.on("end", () => {
            this.emit("close");
            this.isEnded = true;
        });

    }

}

export class ReadableStream<T, U> extends Stream<T, U> {

    private isPaused:   boolean = false;
    private isCanceled: boolean = false;

    public get state(): "initializing" | "readable" | "canceled" | "paused" | "ended" {
        if (this.isEnded) return "ended";
        if (this.isCanceled) return "canceled";
        if (this.isPaused) return "paused";
        if (this.isReadable) return "readable";
        return "initializing";
    }

    public cancel() {
        this.emit("canceled");
        this.isCanceled = true;
    }

    public pause() {
        this.emit("paused");
        this.isPaused = true;
    }

    public resume() {
        this.emit("resumed");
        this.isPaused = false;
    }

    public push(input: T) {
        const output = super.push(input);
        const max = this.options.maxBuffer || 50000;
        if (this.buffer.length >= max) this.pause();
        return output;
    }

    constructor(obj?: StreamOptions<T, U>) {
        super(obj);
    }

}

export class WriteableStream<T, U> extends Stream<T, U> {

    public get state(): "initializing" | "readable" | "ended" {
        if (this.isEnded) return "ended";
        if (this.isReadable) return "readable";
        return "initializing";
    }

    public end() {
        this.emit("end");
    }

    constructor(obj?: StreamOptions<T, U>) {
        super(obj);
    }

}
