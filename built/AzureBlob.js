"use strict";
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
const argumentor_1 = __importDefault(require("./argumentor"));
class AzureBlobStreamWriteOperation extends PromiseImposer_1.default {
    constructor(mode, filename, content) {
        super();
        this.mode = mode;
        this.filename = filename;
        this.content = content;
    }
}
exports.AzureBlobStreamWriteOperation = AzureBlobStreamWriteOperation;
class AzureBlobStreamLoadOperation extends PromiseImposer_1.default {
    constructor(filename) {
        super();
        this.filename = filename;
    }
}
exports.AzureBlobStreamLoadOperation = AzureBlobStreamLoadOperation;
class AzureBlobStreamListOperation extends PromiseImposer_1.default {
    constructor(prefix) {
        super();
        this.prefix = prefix;
    }
}
exports.AzureBlobStreamListOperation = AzureBlobStreamListOperation;
class AzureBlob {
    writeStream() {
        // get arguments
        let options = {};
        if (arguments[0] && typeof arguments[0] === "object")
            options = arguments[0];
        if (arguments[1] && typeof arguments[1] === "object")
            options = arguments[1];
        if (arguments[0] && typeof arguments[0] === "function")
            options.transform = arguments[0];
        if (arguments[1] && typeof arguments[1] === "function")
            options.transform = arguments[1];
        // create stream
        const stream = new Streams_1.WriteableStream(options);
        // promisify
        const createBlockBlobFromText = util.promisify(azs.BlobService.prototype.createBlockBlobFromText).bind(this.service);
        const createOrReplaceAppendBlob = util.promisify(azs.BlobService.prototype.createOrReplaceAppendBlob).bind(this.service);
        const appendBlockFromText = util.promisify(azs.BlobService.prototype.appendBlockFromText).bind(this.service);
        const deleteBlob = util.promisify(azs.BlobService.prototype.deleteBlob).bind(this.service);
        // produce promises to save the files
        stream.processSelf(() => {
            const op = stream.buffer.pop();
            // process a block write
            if (op && op.mode === "block" && op.content) {
                return createBlockBlobFromText(this.container, op.filename, op.content)
                    .then(() => {
                    op.resolve();
                })
                    .catch(error => {
                    op.reject(error);
                    stream.emit("error", error);
                });
            }
            // process an append
            if (op && op.mode === "append") {
                return createOrReplaceAppendBlob(this.container, op.filename).then(() => {
                    if (op.content) {
                        const write = appendBlockFromText(this.container, op.filename, op.content);
                        return write;
                    }
                    else {
                        return Promise.resolve();
                    }
                })
                    .then(() => {
                    op.resolve();
                })
                    .catch(error => {
                    op.reject(error);
                    stream.emit("error", error);
                });
            }
            // process a delete
            if (op && op.mode === "delete") {
                return deleteBlob(this.container, op.filename)
                    .then(() => {
                    op.resolve();
                })
                    .catch(error => {
                    op.reject(error);
                    stream.emit("error", error);
                });
            }
            // nothing else to do
            return null;
        });
        return stream;
    }
    write() {
        // get arguments
        let operations = [];
        let options = {};
        if (arguments[1] && typeof arguments[1] === "object")
            options = arguments[1];
        if (arguments[0] && Array.isArray(arguments[0])) {
            operations = arguments[0];
        }
        else {
            operations.push(arguments[0]);
        }
        // immediately funnel everything provided
        const stream = this.writeStream(options);
        for (const operation of operations) {
            stream.push(operation);
        }
        stream.end();
        return stream;
    }
    writeAsync() {
        return new Promise((resolve, reject) => {
            try {
                // start querying
                const stream = this.write.call(this, ...arguments);
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
    create(filename, content) {
        const createBlockBlobFromText = util.promisify(azs.BlobService.prototype.createBlockBlobFromText).bind(this.service);
        return createBlockBlobFromText(this.container, filename, content);
    }
    append(filename, content) {
        const createOrReplaceAppendBlob = util.promisify(azs.BlobService.prototype.createOrReplaceAppendBlob).bind(this.service);
        const appendBlockFromText = util.promisify(azs.BlobService.prototype.appendBlockFromText).bind(this.service);
        return createOrReplaceAppendBlob(this.container, filename).then(() => {
            if (content) {
                const write = appendBlockFromText(this.container, filename, content);
                return write;
            }
            else {
                return Promise.resolve();
            }
        });
    }
    delete(filename) {
        const deleteBlob = util.promisify(azs.BlobService.prototype.deleteBlob).bind(this.service);
        return deleteBlob(this.container, filename);
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
                return getBlobToText(this.container, op.filename)
                    .then(contents => {
                    const result = streams.out.push(contents);
                    op.resolve(result);
                })
                    .catch(error => {
                    op.reject(error);
                    streams.out.emit("error", error);
                });
            }
            // nothing else to do
            return null;
        });
        return streams;
    }
    load(filenames) {
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
                return new AzureBlobStreamLoadOperation(data);
            }
        }, out_options);
        for (const filename of filenames) {
            streams.in.push(filename);
        }
        streams.in.end();
        return streams.out;
    }
    async loadAsync() {
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
        const fetch = async (op) => {
            try {
                // get next batch
                const result = (op.prefix) ?
                    await listBlobsSegmentedWithPrefix(this.container, op.prefix, op.token) :
                    await listBlobsSegmented(this.container, op.token);
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
                streams.out.emit("error", error);
                work_counter--; // errors prevent it from continuing fetch operations
            }
        };
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
    list() {
        // get arguments
        let { 0: prefix, 1: transform, 2: options } = argumentor_1.default(["string", "function", "object"], ...arguments);
        options = options || {};
        if (transform)
            options.transform = transform;
        // immediately funnel everything provided
        const streams = this.listStream({}, options);
        streams.in.push(new AzureBlobStreamListOperation(prefix));
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
    listFiltered() {
        return new Promise((resolve, reject) => {
            try {
                // get arguments
                const options = {};
                let { 0: prefix, 1: pattern } = argumentor_1.default(["string", RegExp], ...arguments);
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
                    this.list(prefix, options) :
                    this.list(options);
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
    listAll() {
        return this.listFiltered();
    }
    // create the container if it doesn't already exist
    createContainerIfNotExists() {
        const createContainerIfNotExists = util.promisify(azs.BlobService.prototype.createContainerIfNotExists).bind(this.service);
        return createContainerIfNotExists(this.container);
    }
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
        // record the container name
        this.container = obj.container;
    }
}
exports.default = AzureBlob;
