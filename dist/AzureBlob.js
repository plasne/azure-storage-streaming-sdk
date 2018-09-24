"use strict";
// notes:
// There is no good way to document overloads: https://github.com/Microsoft/TypeScript/issues/407
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// includes
const azs = __importStar(require("azure-storage"));
const util = __importStar(require("util"));
const Streams_1 = require("./Streams");
const PromiseImposer_1 = __importDefault(require("./PromiseImposer"));
const overarg_1 = require("overarg");
class AzureBlobCommitOperation extends PromiseImposer_1.default {
    /** This class designates a write operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     * */
    constructor(type, container, filename, content) {
        super();
        this.type = type;
        this.container = container;
        this.filename = filename;
        this.content = content;
    }
}
exports.AzureBlobCommitOperation = AzureBlobCommitOperation;
class AzureBlobLoadOperation extends PromiseImposer_1.default {
    /** This class designates a load operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     * */
    constructor(container, filename) {
        super();
        this.container = container;
        this.filename = filename;
    }
}
exports.AzureBlobLoadOperation = AzureBlobLoadOperation;
class AzureBlobListOperation extends PromiseImposer_1.default {
    /** This class designates a list operation that can be queued, streamed, etc.
     * You may optionally specify a prefix to restrict the operation to objects that start with a certain string.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     * */
    constructor(container, prefix) {
        super();
        this.container = container;
        this.prefix = prefix;
    }
}
exports.AzureBlobListOperation = AzureBlobListOperation;
class AzureBlob {
    commitStream() {
        // get arguments
        const in_options = arguments[0] || {};
        const out_options = arguments[1] || {};
        // create the streams
        const streams = {
            in: new Streams_1.WriteableStream(in_options),
            out: new Streams_1.ReadableStream(out_options)
        };
        // promisify
        const createBlockBlobFromText = util.promisify(azs.BlobService.prototype.createBlockBlobFromText).bind(this.service);
        const createOrReplaceAppendBlob = util.promisify(azs.BlobService.prototype.createOrReplaceAppendBlob).bind(this.service);
        const appendBlockFromText = util.promisify(azs.BlobService.prototype.appendBlockFromText).bind(this.service);
        const deleteBlob = util.promisify(azs.BlobService.prototype.deleteBlob).bind(this.service);
        // produce promises to commit the operations
        streams.out.processFrom(streams.in, () => {
            const op = streams.in.buffer.pop();
            // process a block write
            if (op && op.type === "block" && op.content) {
                return createBlockBlobFromText(op.container, op.filename, op.content)
                    .then(() => {
                    op.resolve();
                    streams.out.emit("data", op);
                })
                    .catch(error => {
                    op.reject(error);
                    streams.out.emit("error", error, op);
                });
            }
            // process an append
            if (op && op.type === "append") {
                return createOrReplaceAppendBlob(op.container, op.filename).then(() => {
                    if (op.content) {
                        const write = appendBlockFromText(op.container, op.filename, op.content);
                        return write;
                    }
                    else {
                        return Promise.resolve();
                    }
                })
                    .then(() => {
                    op.resolve();
                    streams.out.emit("data", op);
                })
                    .catch(error => {
                    op.reject(error);
                    streams.out.emit("error", error, op);
                });
            }
            // process a delete
            if (op && op.type === "delete") {
                return deleteBlob(op.container, op.filename)
                    .then(() => {
                    op.resolve();
                    streams.out.emit("data", op);
                })
                    .catch(error => {
                    op.reject(error);
                    streams.out.emit("error", error, op);
                });
            }
            // nothing else to do
            return null;
        });
        return streams;
    }
    commit() {
        // get arguments
        const operation = overarg_1.overarg("object", ...arguments);
        const operations = overarg_1.overarg("array", ...arguments) || [];
        const options = overarg_1.overarg(1, "object", ...arguments) || {};
        if (operation)
            operations.push(operation);
        // immediately funnel everything provided
        const streams = this.commitStream(options, {});
        for (const operation of operations) {
            streams.in.push(operation);
        }
        streams.in.end();
        return streams.out;
    }
    commitAsync() {
        return new Promise((resolve, reject) => {
            try {
                // start querying
                const stream = this.commit.call(this, ...arguments);
                // resolve when done
                stream.on("end", () => {
                    resolve();
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /** A Promise to create a block blob with content. */
    createBlockBlob(container, filename, content) {
        const createBlockBlobFromText = util.promisify(azs.BlobService.prototype.createBlockBlobFromText).bind(this.service);
        return createBlockBlobFromText(container, filename, content);
    }
    /** A Promise to append to an existing append blob. */
    append(container, filename, content) {
        const appendBlockFromText = util.promisify(azs.BlobService.prototype.appendBlockFromText).bind(this.service);
        return appendBlockFromText(container, filename, content);
    }
    /** A Promise to create an append blob, with or without content. Use append to add future content. */
    createAppendBlob(container, filename, content) {
        const createOrReplaceAppendBlob = util.promisify(azs.BlobService.prototype.createOrReplaceAppendBlob).bind(this.service);
        const appendBlockFromText = util.promisify(azs.BlobService.prototype.appendBlockFromText).bind(this.service);
        return createOrReplaceAppendBlob(container, filename).then(() => {
            if (content) {
                const write = appendBlockFromText(container, filename, content);
                return write;
            }
            else {
                return Promise.resolve();
            }
        });
    }
    /** A Promise to delete a blob. */
    delete(container, filename) {
        const deleteBlob = util.promisify(azs.BlobService.prototype.deleteBlob).bind(this.service);
        return deleteBlob(container, filename);
    }
    loadStream() {
        // get arguments
        const in_options = arguments[0] || {};
        const out_options = arguments[1] || {};
        // create the streams
        const streams = {
            in: new Streams_1.WriteableStream(in_options),
            out: new Streams_1.ReadableStream(out_options)
        };
        // promisify
        const getBlobToText = util.promisify(azs.BlobService.prototype.getBlobToText).bind(this.service);
        // produce promises to load the files
        streams.out.processFrom(streams.in, () => {
            // if there is a file, process it
            const op = streams.in.buffer.pop();
            if (op) {
                return getBlobToText(op.container, op.filename)
                    .then(contents => {
                    const result = streams.out.push(contents);
                    op.resolve(result);
                })
                    .catch(error => {
                    op.reject(error);
                    streams.out.emit("error", error, op);
                });
            }
            // nothing else to do
            return null;
        });
        return streams;
    }
    load(container, filenames) {
        // get arguments
        const transform = overarg_1.overarg("function", ...arguments);
        const options = overarg_1.overarg("object", ...arguments) || {};
        if (transform)
            options.transform = transform;
        // get arguments
        let out_options = {};
        if (arguments[1] && typeof arguments[1] === "object")
            out_options = arguments[1];
        if (arguments[2] && typeof arguments[2] === "object")
            out_options = arguments[2];
        if (arguments[1] && typeof arguments[1] === "function")
            out_options.transform = arguments[1];
        // immediately funnel everything provided
        const streams = this.loadStream({
            transform: data => {
                return new AzureBlobLoadOperation(container, data);
            }
        }, out_options);
        for (const filename of filenames) {
            streams.in.push(filename);
        }
        streams.in.end();
        return streams.out;
    }
    loadAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    // start querying
                    const stream = this.load.call(this, ...arguments);
                    // only allow up to maxBuffer
                    stream.on("paused", () => {
                        stream.cancel();
                    });
                    // resolve when done
                    stream.on("end", () => {
                        resolve(stream.buffer);
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    /** A Promise to load a file as a string. */
    loadFile(container, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const getBlobToText = util.promisify(azs.BlobService.prototype.getBlobToText).bind(this.service);
            return getBlobToText(container, filename);
        });
    }
    listStream() {
        // get arguments
        const in_options = arguments[0] || {};
        const out_options = arguments[1] || {};
        // create the streams
        const streams = {
            in: new Streams_1.WriteableStream(in_options),
            out: new Streams_1.ReadableStream(out_options)
        };
        // the work counter tracks open-ended work (may have continuation tokens)
        let work_counter = 0;
        // create the work stream, it starts with work from in, but will get more from continuation tokens
        const work = new Streams_1.WriteableStream();
        streams.in.on("data", (data) => {
            work.push(data);
            work_counter++;
        });
        // promify
        const listBlobsSegmented = util.promisify(azs.BlobService.prototype.listBlobsSegmented).bind(this.service);
        const listBlobsSegmentedWithPrefix = util.promisify(azs.BlobService.prototype.listBlobsSegmentedWithPrefix).bind(this.service);
        // define the recursive fetch function
        const fetch = (op) => __awaiter(this, void 0, void 0, function* () {
            try {
                // get next batch
                const result = (op.prefix) ?
                    yield listBlobsSegmentedWithPrefix(op.container, op.prefix, op.token) :
                    yield listBlobsSegmented(op.container, op.token);
                // step through each entry and push to the stream
                for (const entry of result.entries) {
                    streams.out.push(entry);
                }
                // recur
                if (result.continuationToken) {
                    op.token = result.continuationToken;
                    work.buffer.push(op);
                }
                else {
                    op.resolve();
                    work_counter--;
                }
            }
            catch (error) {
                op.reject(error);
                streams.out.emit("error", error, op);
                work_counter--; // errors prevent it from continuing fetch operations
            }
        });
        // produce promises to load the files
        streams.out.processFrom(streams.in, () => {
            // get an operation from the work stream
            const op = work.buffer.pop();
            if (op)
                return fetch(op);
            // delay if there is still work in progress
            if (work_counter > 0)
                return new Promise(resolve => setTimeout(resolve, 1000));
            // nothing else to do
            return null;
        });
        return streams;
    }
    list(container) {
        // get arguments
        const prefix = overarg_1.overarg(1, "string", ...arguments);
        const transform = overarg_1.overarg("function", ...arguments);
        const options = overarg_1.overarg("object", ...arguments) || {};
        if (transform)
            options.transform = transform;
        // immediately funnel everything provided
        const streams = this.listStream({}, options);
        streams.in.push(new AzureBlobListOperation(container, prefix));
        streams.in.end();
        return streams.out;
    }
    listAsync() {
        return new Promise((resolve, reject) => {
            try {
                // start querying
                const stream = this.list.call(this, ...arguments);
                // only allow up to maxBuffer
                stream.on("paused", () => {
                    stream.cancel();
                });
                // resolve when done
                stream.on("end", () => {
                    resolve(stream.buffer);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    listFiltered(container) {
        return new Promise((resolve, reject) => {
            try {
                // get arguments
                const options = {};
                const prefix = overarg_1.overarg(1, "string", ...arguments);
                const pattern = overarg_1.overarg(RegExp, ...arguments);
                // define the transform
                options.transform = (data) => {
                    if (pattern) {
                        pattern.lastIndex = 0; // reset
                        if (pattern.test(data.name)) {
                            return data;
                        }
                        else {
                            return null;
                        }
                    }
                    else {
                        return data;
                    }
                };
                // start querying
                const stream = (prefix) ?
                    this.list(container, prefix, options) :
                    this.list(container, options);
                // only allow up to maxBuffer
                stream.on("paused", () => {
                    stream.cancel();
                });
                // resolve when done
                stream.on("end", () => {
                    resolve(stream.buffer);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /** A Promise to list all blobs in a container as BlobResult[]. This is the same as listFiltered() with no additional options. */
    listAll(container) {
        return this.listFiltered(container);
    }
    /** A Promise to create a container if it does not exist. */
    createContainerIfNotExists(container) {
        const createContainerIfNotExists = util.promisify(azs.BlobService.prototype.createContainerIfNotExists).bind(this.service);
        return createContainerIfNotExists(container);
    }
    /**
This class must be instantiated via an AzureBlobOptions object which defines a BlobService or
the criteria to create a BlobService.

You may instantiate with any of the following:

```typescript
new AzureBlob({ service: existingService });
new AzureBlob({ connectionString: connectionString });
new AzureBlob({ account: storageAccountName, key: storageAccountKey });
new AzureBlob({ account: storageAccountName, sas: sasStartingWithQuestionMark });
```

You may also set useGlobalAgent to true to specify maxSockets or similar (keepAlive is used anyway):

```typescript
const httpsAgent: any = https.globalAgent;
httpsAgent.keepAlive = true;
httpsAgent.maxSockets = 20;
```
     */
    constructor(obj) {
        // establish the service
        if (obj.service) {
            this.service = obj.service;
        }
        else if (obj.connectionString) {
            this.service = azs.createBlobService(obj.connectionString);
            if (obj.useGlobalAgent)
                this.service.enableGlobalHttpAgent = true;
        }
        else if (obj.account && obj.sas) {
            const host = `https://${obj.account}.blob.core.windows.net`;
            this.service = azs.createBlobServiceWithSas(host, obj.sas);
            if (obj.useGlobalAgent)
                this.service.enableGlobalHttpAgent = true;
        }
        else if (obj.account && obj.key) {
            this.service = azs.createBlobService(obj.account, obj.key);
            if (obj.useGlobalAgent)
                this.service.enableGlobalHttpAgent = true;
        }
        else {
            throw new Error(`You must specify service, connectionString, account/sas, or account/key.`);
        }
    }
}
exports.AzureBlob = AzureBlob;
