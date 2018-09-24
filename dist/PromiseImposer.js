"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// includes
const events_1 = require("events");
class PromiseImposter {
    constructor() {
        this.events = new events_1.EventEmitter();
    }
    resolve(...args) {
        this.events.emit("resolve", ...args);
        this.events.emit("finally", ...args);
    }
    reject(...args) {
        this.events.emit("reject", ...args);
        this.events.emit("catch", ...args);
        this.events.emit("finally", ...args);
    }
    then(resolve, reject) {
        this.events.on("resolve", () => {
            resolve.call(this, ...arguments);
        });
        this.events.on("reject", () => {
            if (reject)
                reject.call(this, ...arguments);
        });
        return this;
    }
    catch(reject) {
        this.events.on("catch", () => {
            if (reject)
                reject.call(this, ...arguments);
        });
        return this;
    }
    finally(settled) {
        this.events.on("finally", () => {
            if (settled)
                settled.call(this, ...arguments);
        });
        return this;
    }
}
exports.default = PromiseImposter;
