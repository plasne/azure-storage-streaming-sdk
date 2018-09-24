
// includes
import { EventEmitter } from "events";

type anyfunc = () => any | void | undefined;

export default abstract class PromiseImposter {

    private events: EventEmitter = new EventEmitter();

    public resolve(...args: any[]) {
        this.events.emit("resolve", ...args);
        this.events.emit("finally", ...args);
    }

    public reject(...args: any[]) {
        this.events.emit("reject", ...args);
        this.events.emit("catch", ...args);
        this.events.emit("finally", ...args);
    }

    public then(resolve: anyfunc, reject?: anyfunc) {
        this.events.on("resolve", () => {
            resolve.call(this, ...arguments);
        });
        this.events.on("reject", () => {
            if (reject) reject.call(this, ...arguments);
        });
        return this;
    }

    public catch(reject: anyfunc) {
        this.events.on("catch", () => {
            if (reject) reject.call(this, ...arguments);
        });
        return this;
    }

    public finally(settled: anyfunc) {
        this.events.on("finally", () => {
            if (settled) settled.call(this, ...arguments);
        });
        return this;
    }

}