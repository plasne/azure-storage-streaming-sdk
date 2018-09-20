
// includes
import * as azs from "azure-storage";
import * as util from "util";
import { ReadableStream, WriteableStream, StreamOptions, StreamTransform } from "./Streams";
import PromiseImposter from "./PromiseImposer";

export type formats = "json" | "text";

export interface AzureBlobJSON {
    service?:          azs.BlobService,
    useGlobalAgent?:   boolean,
    connectionString?: string,
    account?:          string,
    sas?:              string,
    key?:              string,
    container:         string
}

export type AzureBlobStreamWriteOperationModes = "append" | "block" | "delete";

export class AzureBlobStreamWriteOperation extends PromiseImposter {

    public mode:     AzureBlobStreamWriteOperationModes;
    public filename: string;
    public content?: string;

    constructor(mode: AzureBlobStreamWriteOperationModes, filename: string, content?: string) {
        super();
        this.mode = mode;
        this.filename = filename;
        this.content = content;
    }

}

export class AzureBlobStreamLoadOperation extends PromiseImposter {

    public filename: string;

    constructor(filename: string) {
        super();
        this.filename = filename;
    }

}

export type AzureBlobLoadStreams<T, U> = {
    in:  WriteableStream<T, AzureBlobStreamLoadOperation>,
    out: ReadableStream<string, U>
}

export class AzureBlobStreamListOperation extends PromiseImposter {

    public prefix?: string;
    public token?:  azs.common.ContinuationToken;

    constructor(prefix?: string) {
        super();
        this.prefix = prefix;
    }

}

export type AzureBlobListStreams<T, U> = {
    in:  WriteableStream<T, AzureBlobStreamListOperation>,
    out: ReadableStream<azs.BlobService.BlobResult, U>
}

export default class AzureBlob {

    public service:   azs.BlobService;
    public container: string;

    public writeStream<T>(): WriteableStream<T, AzureBlobStreamWriteOperation>;
    public writeStream<T>(transform: StreamTransform<T, AzureBlobStreamWriteOperation>): WriteableStream<T, AzureBlobStreamWriteOperation>;
    public writeStream<T>(options: StreamOptions<T, AzureBlobStreamWriteOperation>): WriteableStream<T, AzureBlobStreamWriteOperation>;
    public writeStream<T>(transform: StreamTransform<T, AzureBlobStreamWriteOperation>, options: StreamOptions<T, AzureBlobStreamWriteOperation>): WriteableStream<T, AzureBlobStreamWriteOperation>;
    public writeStream<T>(): WriteableStream<T, AzureBlobStreamWriteOperation> {

        // get arguments
        let options: StreamOptions<T, AzureBlobStreamWriteOperation> = {};
        if (arguments[0] && typeof arguments[0] === "object") options = arguments[0];
        if (arguments[1] && typeof arguments[1] === "object") options = arguments[1];
        if (arguments[0] && typeof arguments[0] === "function") options.transform = arguments[0];
        if (arguments[1] && typeof arguments[1] === "function") options.transform = arguments[1];

        // create stream
        const stream = new WriteableStream<T, AzureBlobStreamWriteOperation>(options);

        // promisify
        const createBlockBlobFromText: (container: string, blob: string, text: string) => Promise<azs.BlobService.BlobResult> =
            util.promisify(azs.BlobService.prototype.createBlockBlobFromText).bind(this.service);
        const createOrReplaceAppendBlob: (container: string, blob: string) => Promise<void> =
            util.promisify(azs.BlobService.prototype.createOrReplaceAppendBlob).bind(this.service);
        const appendBlockFromText: (container: string, blob: string, content: string) => Promise<azs.BlobService.BlobResult> =
            util.promisify(azs.BlobService.prototype.appendBlockFromText).bind(this.service);
        const deleteBlob: (container: string, blob: string) => Promise<void> =
            util.promisify(azs.BlobService.prototype.deleteBlob).bind(this.service);

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
                        const write: Promise<any> = appendBlockFromText(this.container, op.filename, op.content);
                        return write;
                    } else {
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

    public write<T>(operation: T): WriteableStream<T, AzureBlobStreamWriteOperation>;
    public write<T>(operations: T[]): WriteableStream<T, AzureBlobStreamWriteOperation>;
    public write<T>(operation: T, options: StreamOptions<T, AzureBlobStreamWriteOperation>): WriteableStream<T, AzureBlobStreamWriteOperation>;
    public write<T>(operations: T[], options: StreamOptions<T, AzureBlobStreamWriteOperation>): WriteableStream<T, AzureBlobStreamWriteOperation>;
    public write<T>(): WriteableStream<T, AzureBlobStreamWriteOperation> {

        // get arguments
        let operations: T[] = [];
        let options: StreamOptions<T, AzureBlobStreamWriteOperation> = {};
        if (arguments[1] && typeof arguments[1] === "object") options = arguments[1];
        if (arguments[0] && Array.isArray(arguments[0])) {
            operations = arguments[0];
        } else {
            operations.push(arguments[0]);
        }

        // immediately funnel everything provided
        const stream = this.writeStream<T>(options);
        for (const operation of operations) {
            stream.push(operation);
        }
        stream.end();
        return stream;

    }

    public writeAsync<T>(operation: T): Promise<void>;
    public writeAsync<T>(operations: T[]): Promise<void>;
    public writeAsync<T>(operation: T, options: StreamOptions<T, AzureBlobStreamWriteOperation>): Promise<void>;
    public writeAsync<T>(operations: T[], options: StreamOptions<T, AzureBlobStreamWriteOperation>): Promise<void>;
    public writeAsync<T>(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {

                // start querying
                const stream: WriteableStream<T, AzureBlobStreamWriteOperation> = this.write.call(this, ...arguments);

                // resolve when done
                stream.on("end", () => {
                    resolve();
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    public create(filename: string, content: string) {
        const createBlockBlobFromText: (container: string, blob: string, text: string) => Promise<azs.BlobService.BlobResult> =
            util.promisify(azs.BlobService.prototype.createBlockBlobFromText).bind(this.service);
        return createBlockBlobFromText(this.container, filename, content);
    }

    public append(filename: string, content?: string) {
        const createOrReplaceAppendBlob: (container: string, blob: string) => Promise<void> =
            util.promisify(azs.BlobService.prototype.createOrReplaceAppendBlob).bind(this.service);
        const appendBlockFromText: (container: string, blob: string, content: string) => Promise<azs.BlobService.BlobResult> =
            util.promisify(azs.BlobService.prototype.appendBlockFromText).bind(this.service);
        return createOrReplaceAppendBlob(this.container, filename).then(() => {
            if (content) {
                const write: Promise<any> = appendBlockFromText(this.container, filename, content);
                return write;
            } else {
                return Promise.resolve();
            }
        });
    }

    public delete(filename: string) {
        const deleteBlob: (container: string, blob: string) => Promise<void> =
            util.promisify(azs.BlobService.prototype.deleteBlob).bind(this.service);
        return deleteBlob(this.container, filename);
    }

    public loadStream<T, U>(): AzureBlobLoadStreams<T, U>;
    public loadStream<T, U>(in_options: StreamOptions<T, AzureBlobStreamLoadOperation>, out_options: StreamOptions<string, U>): AzureBlobLoadStreams<T, U>;
    public loadStream<T, U>(): AzureBlobLoadStreams<T, U> {

        // get arguments
        const in_options: StreamOptions<T, AzureBlobStreamLoadOperation> = arguments[0] || {};
        const out_options: StreamOptions<string, U> = arguments[1] || {};

        // create the streams
        const streams: AzureBlobLoadStreams<T, U> = {
            in:  new WriteableStream<T, AzureBlobStreamLoadOperation>(in_options),
            out: new ReadableStream<string, U>(out_options)
        };

        // promisify
        const getBlobToText: (container: string, blob: string) => Promise<string> =
            util.promisify(azs.BlobService.prototype.getBlobToText).bind(this.service);

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

    public load<T>(filenames: string[]): ReadableStream<string, T>;
    public load<T>(filenames: string[], transform: StreamTransform<string, T>): ReadableStream<string, T>;
    public load<T>(filenames: string[], options: StreamOptions<string, T>): ReadableStream<string, T>;
    public load<T>(filenames: string[], transform: StreamTransform<string, T>, options: StreamOptions<string, T>): ReadableStream<string, T>;
    public load<T>(filenames: string[]): ReadableStream<string, T> {

        // get arguments
        let out_options: StreamOptions<string, T> = {};
        if (arguments[1] && typeof arguments[1] === "object") out_options = arguments[1];
        if (arguments[2] && typeof arguments[2] === "object") out_options = arguments[2];
        if (arguments[1] && typeof arguments[1] === "function") out_options.transform = arguments[1];

        // immediately funnel everything provided
        const streams = this.loadStream<string, T>({
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

    public async loadAsync<T>(filenames: string[]): Promise<T[]>;
    public async loadAsync<T>(filenames: string[], transform: StreamTransform<string, T>): Promise<T[]>;
    public async loadAsync<T>(filenames: string[], options: StreamOptions<string, T>): Promise<T[]>;
    public async loadAsync<T>(filenames: string[], transform: StreamTransform<string, T>, options: StreamOptions<string, T>): Promise<T[]>;
    public async loadAsync<T>(): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            try {

                // start querying
                const stream: ReadableStream<string, T> = this.load.call(this, ...arguments);

                // only allow up to maxBuffer
                stream.on("paused", () => {
                    stream.cancel();
                });

                // resolve when done
                stream.on("end", () => {
                    resolve(stream.buffer);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    public listStream<T, U>(): AzureBlobListStreams<T, U>;
    public listStream<T, U>(in_options: StreamOptions<T, AzureBlobStreamListOperation>, out_options: StreamOptions<azs.BlobService.BlobResult, U>): AzureBlobListStreams<T, U>;
    public listStream<T, U>(): AzureBlobListStreams<T, U> {

        // get arguments
        const in_options: StreamOptions<T, AzureBlobStreamListOperation> = arguments[0] || {};
        const out_options: StreamOptions<azs.BlobService.BlobResult, U> = arguments[1] || {};

        // create the streams
        const streams: AzureBlobListStreams<T, U> = {
            in:  new WriteableStream<T, AzureBlobStreamListOperation>(in_options),
            out: new ReadableStream<azs.BlobService.BlobResult, U>(out_options)
        };

        // the work counter tracks open-ended work (may have continuation tokens)
        let work_counter = 0;

        // create the work stream, it starts with work from in, but will get more from continuation tokens
        const work = new WriteableStream<AzureBlobStreamListOperation, AzureBlobStreamListOperation>();
        streams.in.on("data", (data: AzureBlobStreamListOperation) => {
            work.push(data);
            work_counter++;
        });

        // promify
        const listBlobsSegmented: (container: string, token?: azs.common.ContinuationToken) =>
            Promise<azs.BlobService.ListBlobsResult> = util.promisify(azs.BlobService.prototype.listBlobsSegmented).bind(this.service);
        const listBlobsSegmentedWithPrefix: (container: string, prefix: string, token?: azs.common.ContinuationToken) =>
            Promise<azs.BlobService.ListBlobsResult> = util.promisify(azs.BlobService.prototype.listBlobsSegmentedWithPrefix).bind(this.service);

        // define the recursive fetch function
        const fetch = async (op: AzureBlobStreamListOperation) => {
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
                } else {
                    op.resolve();
                    work_counter--;
                }

            } catch (error) {
                op.reject(error);
                streams.out.emit("error", error);
                work_counter--; // errors prevent it from continuing fetch operations
            }
        }

        // produce promises to load the files
        streams.out.processFrom(streams.in, () => {

            // get an operation from the work stream
            const op = work.buffer.pop();
            if (op) return fetch(op);

            // delay if there is still work in progress
            if (work_counter > 0) return new Promise(resolve => setTimeout(resolve, 1000));

            // nothing else to do
            return null;

        });

        return streams;
    }

    // list the blobs via a streaming pattern
    public list<T>(): ReadableStream<azs.BlobService.BlobResult, T>;
    public list<T>(prefix: string): ReadableStream<azs.BlobService.BlobResult, T>;
    public list<T>(transform: StreamTransform<azs.BlobService.BlobResult, T>): ReadableStream<azs.BlobService.BlobResult, T>;
    public list<T>(options: StreamOptions<azs.BlobService.BlobResult, T>): ReadableStream<azs.BlobService.BlobResult, T>;
    public list<T>(prefix: string, options: StreamOptions<azs.BlobService.BlobResult, T>): ReadableStream<azs.BlobService.BlobResult, T>;
    public list<T>(prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, T>): ReadableStream<azs.BlobService.BlobResult, T>;
    public list<T>(transform: StreamTransform<azs.BlobService.BlobResult, T>, options: StreamOptions<azs.BlobService.BlobResult, T>): ReadableStream<azs.BlobService.BlobResult, T>;
    public list<T>(prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, T>, options: StreamOptions<azs.BlobService.BlobResult, T>): ReadableStream<azs.BlobService.BlobResult, T>;
    public list<T>(): ReadableStream<azs.BlobService.BlobResult, T> {

        // get arguments
        let prefix: string | undefined = undefined;
        let out_options: StreamOptions<azs.BlobService.BlobResult, T> = {};
        if (arguments[0] && typeof arguments[0] === "object") out_options = arguments[0];
        if (arguments[1] && typeof arguments[1] === "object") out_options = arguments[1];
        if (arguments[2] && typeof arguments[2] === "object") out_options = arguments[2];
        if (arguments[0] && typeof arguments[0] === "string") prefix = arguments[0];
        if (arguments[0] && typeof arguments[0] === "function") out_options.transform = arguments[0];
        if (arguments[1] && typeof arguments[1] === "function") out_options.transform = arguments[1];

        // immediately funnel everything provided
        const streams = this.listStream<AzureBlobStreamListOperation, T>({}, out_options);
        streams.in.push(new AzureBlobStreamListOperation(prefix));
        streams.in.end();
        return streams.out;

    }

    // list the blobs via a Promise pattern
    public listAsync<T>(): Promise<T[]>;
    public listAsync<T>(prefix: string): Promise<T[]>;
    public listAsync<T>(transform: StreamTransform<azs.BlobService.BlobResult, T>): Promise<T[]>;
    public listAsync<T>(options: StreamOptions<azs.BlobService.BlobResult, T>): Promise<T[]>;
    public listAsync<T>(prefix: string, options: StreamOptions<azs.BlobService.BlobResult, T>): Promise<T[]>;
    public listAsync<T>(prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, T>): Promise<T[]>;
    public listAsync<T>(transform: StreamTransform<azs.BlobService.BlobResult, T>, options: StreamOptions<azs.BlobService.BlobResult, T>): Promise<T[]>;
    public listAsync<T>(prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, T>, options: StreamOptions<azs.BlobService.BlobResult, T>): Promise<T[]>;
    public listAsync<T>(): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            try {

                // start querying
                const stream: ReadableStream<azs.BlobService.BlobResult, T> = this.list.call(this, ...arguments);

                // only allow up to maxBuffer
                stream.on("paused", () => {
                    stream.cancel();
                });

                // resolve when done
                stream.on("end", () => {
                    resolve(stream.buffer);
                });
   
            } catch (error) {
                reject(error);
            }
        });
    }

    public listFiltered(prefix: string): Promise<azs.BlobService.BlobResult[]>
    public listFiltered(pattern: RegExp): Promise<azs.BlobService.BlobResult[]>
    public listFiltered(prefix: string, pattern: RegExp): Promise<azs.BlobService.BlobResult[]>
    public listFiltered(): Promise<azs.BlobService.BlobResult[]> {
        return new Promise<azs.BlobService.BlobResult[]>((resolve, reject) => {
            try {

                // get arguments
                let prefix: string | undefined = undefined;
                let pattern: RegExp | undefined = undefined;
                const options: StreamOptions<azs.BlobService.BlobResult, azs.BlobService.BlobResult> = {};
                if (arguments[0] && typeof arguments[0] === "string") prefix = arguments[0];
                if (arguments[0] && arguments[0] instanceof RegExp) pattern = arguments[0];
                if (arguments[1] && arguments[1] instanceof RegExp) pattern = arguments[1];

                // define the transform
                options.transform = (data: azs.BlobService.BlobResult) => {
                    if (pattern) {
                        pattern.lastIndex = 0; // reset
                        if (pattern.test(data.name)) {
                            return data;
                        } else {
                            return null;
                        }
                    } else {
                        return data;
                    }
                }

                // start querying
                const stream = (prefix) ?
                    this.list<azs.BlobService.BlobResult>(prefix, options) :
                    this.list<azs.BlobService.BlobResult>(options);

                // only allow up to maxBuffer
                stream.on("paused", () => {
                    stream.cancel();
                });

                // resolve when done
                stream.on("end", () => {
                    resolve(stream.buffer);
                });
   
            } catch (error) {
                reject(error);
            }
        });
    }

    // create the container if it doesn't already exist
    public createContainerIfNotExists() {
        const createContainerIfNotExists: (container: string) => Promise<azs.BlobService.ContainerResult> =
            util.promisify(azs.BlobService.prototype.createContainerIfNotExists).bind(this.service);
        return createContainerIfNotExists(this.container);
    }

    constructor(obj: AzureBlobJSON) {

        // establish the service
        if (obj.service) {
            this.service = obj.service;
        } else if (obj.connectionString) {
            this.service = azs.createBlobService(obj.connectionString);
            if (obj.useGlobalAgent) this.service.enableGlobalHttpAgent = true;
        } else if (obj.account && obj.sas) {
            const host = `https://${obj.account}.blob.core.windows.net`;
            this.service = azs.createBlobServiceWithSas(host, obj.sas);
            if (obj.useGlobalAgent) this.service.enableGlobalHttpAgent = true;
        } else if (obj.account && obj.key) {
            this.service = azs.createBlobService(obj.account, obj.key);
            if (obj.useGlobalAgent) this.service.enableGlobalHttpAgent = true;
        } else {
            throw new Error(`You must specify service, connectionString, account/sas, or account/key.`)
        }

        // record the container name
        this.container = obj.container;

    }

}