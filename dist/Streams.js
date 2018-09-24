"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// includes
const events_1 = require("events");
const es6_promise_pool_1 = __importDefault(require("es6-promise-pool"));
class Stream extends events_1.EventEmitter {
    constructor(obj) {
        super();
        this.buffer = [];
        this.isEnded = false;
        this.isReadable = false;
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
    push(input) {
        // announce when there is data that can be read
        if (!this.isReadable) {
            this.isReadable = true;
            this.emit("readable");
        }
        // transform if a function was provided
        let output = input;
        if (this.options.transform)
            output = this.options.transform(input);
        // emit or push to buffer
        if (output) { // transform can return null to suppress
            if (this.listenerCount("data") > 0) {
                this.emit("data", output);
            }
            else {
                this.buffer.push(output);
            }
        }
        return output;
    }
    process() {
        return __awaiter(this, arguments, void 0, function* () {
            // get arguments
            let from = this;
            let work;
            let concurrency = 10;
            if (arguments[0] && typeof arguments[0] === "object")
                from = arguments[0];
            if (arguments[0] && typeof arguments[0] === "function")
                work = arguments[0];
            if (arguments[1] && typeof arguments[1] === "function")
                work = arguments[1];
            if (arguments[1] && typeof arguments[1] === "number")
                concurrency = arguments[1];
            if (arguments[2] && typeof arguments[2] === "number")
                concurrency = arguments[2];
            // produce promises to load the files
            const producer = () => {
                // if the consumer canceled or ended, then no need to continue
                if (from != this && (this.state === "canceled" || this.state === "ended"))
                    return undefined;
                // if the consumer paused, then wait for them to resume
                if (this.state === "paused")
                    return new Promise(resolve => setTimeout(resolve, 1000));
                // a custom function will determine the work to do
                const promise = work();
                if (promise)
                    return promise;
                // if no more records are going to come, it, no need to continue
                if (from.state === "ended")
                    return undefined;
                // wait for more records
                return new Promise(resolve => setTimeout(resolve, 1000));
            };
            // start processing
            //if (this..startAfter) await in_options.startAfter;
            const pool = new es6_promise_pool_1.default(producer, concurrency);
            yield pool.start();
            if (!this.isEnded)
                this.emit("end");
        });
    }
    processSelf(work, concurrency = 10) {
        return __awaiter(this, void 0, void 0, function* () {
            // produce promises to load the files
            const producer = () => {
                // a custom function will determine the work to do
                const promise = work();
                if (promise)
                    return promise;
                // if no more records are going to come, it, no need to continue
                if (this.state === "ended")
                    return undefined;
                // wait for more records
                return new Promise(resolve => setTimeout(resolve, 1000));
            };
            // respect process after
            if (this.options.processAfter)
                yield this.options.processAfter;
            // start processing
            const pool = new es6_promise_pool_1.default(producer, concurrency);
            yield pool.start();
        });
    }
    processFrom(from, work, concurrency = 10) {
        return __awaiter(this, void 0, void 0, function* () {
            // produce promises to load the files
            const producer = () => {
                // if the consumer canceled or ended, then no need to continue
                if (this.state === "canceled" || this.state === "ended")
                    return undefined;
                // if the consumer paused, then wait for them to resume
                if (this.state === "paused")
                    return new Promise(resolve => setTimeout(resolve, 1000));
                // a custom function will determine the work to do
                const promise = work();
                if (promise)
                    return promise;
                // if no more records are going to come, it, no need to continue
                if (from.state === "ended")
                    return undefined;
                // wait for more records
                return new Promise(resolve => setTimeout(resolve, 1000));
            };
            // respect process after
            if (from.options.processAfter)
                yield from.options.processAfter;
            if (this.options.processAfter)
                yield this.options.processAfter;
            // start processing
            const pool = new es6_promise_pool_1.default(producer, concurrency);
            yield pool.start();
            this.emit("end");
        });
    }
    pipe(stream, propogateEnd = true) {
        this.on("data", (data) => {
            stream.push(data);
        });
        if (propogateEnd) {
            this.on("end", () => {
                stream.emit("end");
            });
        }
    }
    waitForEnd() {
        return new Promise((resolve) => {
            this.on("end", () => {
                resolve();
            });
        });
    }
}
class ReadableStream extends Stream {
    constructor(obj) {
        super(obj);
        this.isPaused = false;
        this.isCanceled = false;
    }
    get state() {
        if (this.isEnded)
            return "ended";
        if (this.isCanceled)
            return "canceled";
        if (this.isPaused)
            return "paused";
        if (this.isReadable)
            return "readable";
        return "initializing";
    }
    cancel() {
        this.emit("canceled");
        this.isCanceled = true;
    }
    pause() {
        this.emit("paused");
        this.isPaused = true;
    }
    resume() {
        this.emit("resumed");
        this.isPaused = false;
    }
    push(input) {
        const output = super.push(input);
        const max = this.options.maxBuffer || 50000;
        if (this.buffer.length >= max)
            this.pause();
        return output;
    }
}
exports.ReadableStream = ReadableStream;
class WriteableStream extends Stream {
    constructor(obj) {
        super(obj);
    }
    get state() {
        if (this.isEnded)
            return "ended";
        if (this.isReadable)
            return "readable";
        return "initializing";
    }
    end() {
        this.emit("end");
    }
}
exports.WriteableStream = WriteableStream;
