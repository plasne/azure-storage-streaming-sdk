
// notes:
// There is no good way to document overloads: https://github.com/Microsoft/TypeScript/issues/407

// includes
import * as azs from "azure-storage";
import * as util from "util";
import { ReadableStream, WriteableStream, StreamOptions, StreamTransform } from "./Streams";
import PromiseImposter from "./PromiseImposer";
import { overarg } from "overarg";

export interface AzureBlobOptions {

    /** Specify to use an existing BlobService. */
    service?:          azs.BlobService,

    /**
True, to use HTTP(S) global agent for all calls.

Example:

```typescript
const httpsAgent: any = https.globalAgent;
httpsAgent.keepAlive = true;
httpsAgent.maxSockets = 20;
```
     */
    useGlobalAgent?:   boolean,

    /** Specify to use a connection string to instantiate a new BlobService. */
    connectionString?: string,

    /** Specify account and sas or key to instantiate a new BlobService. */
    account?:          string,

    /** Specify a sas token starting with ? along with an account to instantiate a new BlobService. */
    sas?:              string,

    /** Specify a storage key along with an account to instantiate a new BlobService. */
    key?:              string

}

/** Specify the type of operation that will be performed. */
type AzureBlobWriteOperationTypes = "append" | "block" | "delete";

export class AzureBlobCommitOperation extends PromiseImposter {

    public readonly type:      AzureBlobWriteOperationTypes;
    public readonly container: string;
    public readonly filename:  string;
    public          content?:  string;

    /** This class designates a write operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     * */
    constructor(type: AzureBlobWriteOperationTypes, container: string, filename: string, content?: string) {
        super();
        this.type = type;
        this.container = container;
        this.filename = filename;
        this.content = content;
    }

}

type AzureBlobCommitStreams<T, U> = {
    in:  WriteableStream<T, AzureBlobCommitOperation>,
    out: ReadableStream<AzureBlobCommitOperation, U>
}

export class AzureBlobLoadOperation extends PromiseImposter {

    public readonly container: string;
    public readonly filename: string;

    /** This class designates a load operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     * */
    constructor(container: string, filename: string) {
        super();
        this.container = container;
        this.filename = filename;
    }

}

type AzureBlobLoadStreams<T, U> = {
    in:  WriteableStream<T, AzureBlobLoadOperation>,
    out: ReadableStream<string, U>
}

export class AzureBlobListOperation extends PromiseImposter {

    public readonly container: string;
    public readonly prefix?: string;
    public          token?:  azs.common.ContinuationToken;

    /** This class designates a list operation that can be queued, streamed, etc.
     * You may optionally specify a prefix to restrict the operation to objects that start with a certain string.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     * */
    constructor(container: string, prefix?: string) {
        super();
        this.container = container;
        this.prefix = prefix;
    }

}

type AzureBlobListStreams<T, U> = {
    in:  WriteableStream<T, AzureBlobListOperation>,
    out: ReadableStream<azs.BlobService.BlobResult, U>
}

export class AzureBlob {

    public readonly service:    azs.BlobService;

    /**
This method creates an *in* and *out* stream. You can pump AzureBlobCommitOperation objects
in and then monitor the results in the output stream.

Here is an example of delete operations in TypeScript, including converting an array of strings
into operations:

```typescript
const streams = commitStream<string, AzureBlobCommitOperation>({
    transform: () => {
        return new AzureBlobCommitOperation("delete", "MyContainer", filename).then(() => {
            console.log(`${filename} deleted successfully.`);
        }, error => {
            // you could handle errors this way
        });
    }
});
streams.in.push("MyFile1");
streams.in.push("MyFile2");
streams.in.end();
streams.out.on("end", () => {
    // both files are deleted
});
```
     */
    public commitStream<In = AzureBlobCommitOperation, Out = AzureBlobCommitOperation>(): AzureBlobCommitStreams<In, Out>;
    public commitStream<In = AzureBlobCommitOperation, Out = AzureBlobCommitOperation>(in_options: StreamOptions<In, AzureBlobCommitOperation>, out_options: StreamOptions<AzureBlobCommitOperation, Out>): AzureBlobCommitStreams<In, Out>;
    public commitStream<In = AzureBlobCommitOperation, Out = AzureBlobCommitOperation>(): AzureBlobCommitStreams<In, Out> {

        // get arguments
        const in_options: StreamOptions<In, AzureBlobCommitOperation> = arguments[0] || {};
        const out_options: StreamOptions<AzureBlobCommitOperation, Out> = arguments[1] || {};

        // create the streams
        const streams: AzureBlobCommitStreams<In, Out> = {
            in:  new WriteableStream<In, AzureBlobCommitOperation>(in_options),
            out: new ReadableStream<AzureBlobCommitOperation, Out>(out_options)
        };

        // promisify
        const createBlockBlobFromText: (container: string, blob: string, text: string) => Promise<azs.BlobService.BlobResult> =
            util.promisify(azs.BlobService.prototype.createBlockBlobFromText).bind(this.service);
        const createOrReplaceAppendBlob: (container: string, blob: string) => Promise<void> =
            util.promisify(azs.BlobService.prototype.createOrReplaceAppendBlob).bind(this.service);
        const appendBlockFromText: (container: string, blob: string, content: string) => Promise<azs.BlobService.BlobResult> =
            util.promisify(azs.BlobService.prototype.appendBlockFromText).bind(this.service);
        const deleteBlob: (container: string, blob: string) => Promise<void> =
            util.promisify(azs.BlobService.prototype.deleteBlob).bind(this.service);

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
                        const write: Promise<any> = appendBlockFromText(op.container, op.filename, op.content);
                        return write;
                    } else {
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

    /**
Use this method by specifying what to commit and it will return an output stream to manage the
commits. Events for "data" (operation) and "error" (error, operation) are raised, but you can
also act on the individual commits using the .then(), .catch(), and .finally() methods of each
AzureBlobCommitOperation.

Here is an example of delete operations in TypeScript, including converting an array of strings
into operations:

```typescript
commit<string>([ "MyFile1", "MyFile2" ], {
    transform: () => {
        return new AzureBlobCommitOperation("delete", "MyContainer", filename).then(() => {
            console.log(`${filename} deleted successfully.`);
        }, error => {
            // you could handle errors this way
        });
    }
})
.on("data", operation => {
    // operation is the AzureBlobCommitOperation that was successful
})
.on("error", (error, operation) => {
    // you could also handle errors this way
})
.on("end") => {
    // all operations are done
});
```
     */
    public commit<In = AzureBlobCommitOperation>(operation: In): ReadableStream<AzureBlobCommitOperation, AzureBlobCommitOperation>;
    public commit<In = AzureBlobCommitOperation>(operations: In[]): ReadableStream<AzureBlobCommitOperation, AzureBlobCommitOperation>;
    public commit<In = AzureBlobCommitOperation>(operation: In, options: StreamOptions<In, AzureBlobCommitOperation>): ReadableStream<AzureBlobCommitOperation, AzureBlobCommitOperation>;
    public commit<In = AzureBlobCommitOperation>(operations: In[], options: StreamOptions<In, AzureBlobCommitOperation>): ReadableStream<AzureBlobCommitOperation, AzureBlobCommitOperation>;
    public commit<In = AzureBlobCommitOperation>(): ReadableStream<AzureBlobCommitOperation, AzureBlobCommitOperation> {

        // get arguments
        const operation = overarg<In>("object", ...arguments);
        const operations = overarg<In[]>("array", ...arguments) || [];
        const options = overarg<StreamOptions<In, AzureBlobCommitOperation>>(1, "object", ...arguments) || {};
        if (operation) operations.push(operation);

        // immediately funnel everything provided
        const streams = this.commitStream<In, AzureBlobCommitOperation>(options, {});
        for (const operation of operations) {
            streams.in.push(operation);
        }
        streams.in.end();
        return streams.out;

    }

    /**
A Promise to commit the specified operations. Note that each AzureBlobWriteOperation has .then(),
.catch(), and .finally() so you can handle the response of each individual operation if needed.

Here is an example of delete operations in TypeScript, including converting an array of strings
into operations:

```typescript
commitAsync<string>([ "MyFile1", "MyFile2" ], {
    transform: () => {
        return new AzureBlobCommitOperation("delete", "MyContainer", filename).then(() => {
            console.log(`${filename} deleted successfully.`);
        }, error => {
            console.error(error);
        });
    }
});
```
     */
    public commitAsync<In = AzureBlobCommitOperation>(operation: In): Promise<void>;
    public commitAsync<In = AzureBlobCommitOperation>(operations: In[]): Promise<void>;
    public commitAsync<In = AzureBlobCommitOperation>(operation: In, options: StreamOptions<In, AzureBlobCommitOperation>): Promise<void>;
    public commitAsync<In = AzureBlobCommitOperation>(operations: In[], options: StreamOptions<In, AzureBlobCommitOperation>): Promise<void>;
    public commitAsync<In = AzureBlobCommitOperation>(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {

                // start querying
                const stream: WriteableStream<In, AzureBlobCommitOperation> = this.commit.call(this, ...arguments);

                // resolve when done
                stream.on("end", () => {
                    resolve();
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /** A Promise to create a block blob with content. */
    public createBlockBlob(container: string, filename: string, content: string) {
        const createBlockBlobFromText: (container: string, blob: string, text: string) => Promise<azs.BlobService.BlobResult> =
            util.promisify(azs.BlobService.prototype.createBlockBlobFromText).bind(this.service);
        return createBlockBlobFromText(container, filename, content);
    }

    /** A Promise to append to an existing append blob. */
    public append(container: string, filename: string, content: string) {
        const appendBlockFromText: (container: string, blob: string, content: string) => Promise<azs.BlobService.BlobResult> =
            util.promisify(azs.BlobService.prototype.appendBlockFromText).bind(this.service);
        return appendBlockFromText(container, filename, content);
    }

    /** A Promise to create an append blob, with or without content. Use append to add future content. */
    public createAppendBlob(container: string, filename: string, content?: string) {
        const createOrReplaceAppendBlob: (container: string, blob: string) => Promise<void> =
            util.promisify(azs.BlobService.prototype.createOrReplaceAppendBlob).bind(this.service);
        const appendBlockFromText: (container: string, blob: string, content: string) => Promise<azs.BlobService.BlobResult> =
            util.promisify(azs.BlobService.prototype.appendBlockFromText).bind(this.service);
        return createOrReplaceAppendBlob(container, filename).then(() => {
            if (content) {
                const write: Promise<any> = appendBlockFromText(container, filename, content);
                return write;
            } else {
                return Promise.resolve();
            }
        });
    }

    /** A Promise to delete a blob. */
    public delete(container: string, filename: string) {
        const deleteBlob: (container: string, blob: string) => Promise<void> =
            util.promisify(azs.BlobService.prototype.deleteBlob).bind(this.service);
        return deleteBlob(container, filename);
    }

    /**
This method creates an *in* and *out* stream. You can pump AzureBlobLoadOperation objects
in and get strings out. You may also specify transforms for either or both of those
streams to use different in objects or get different objects out.

Below is an example in TypeScript:

```typescript
import * as azs from "azure-storage";
const streams = loadStream();
streams.in.push(new AzureBlobLoadOperation("MyContainer1", "MyFile1"));
streams.in.push(new AzureBlobLoadOperation("MyContainer2", "MyFile2"));
streams.in.end();
streams.out.on("data", result => {
    // result is string
}).on("end", () => {
    // everything in both operations has been loaded
});
```
     */
    public loadStream<In = AzureBlobLoadOperation, Out = string>(): AzureBlobLoadStreams<In, Out>;
    public loadStream<In = AzureBlobLoadOperation, Out = string>(in_options: StreamOptions<In, AzureBlobLoadOperation>, out_options: StreamOptions<string, Out>): AzureBlobLoadStreams<In, Out>;
    public loadStream<In = AzureBlobLoadOperation, Out = string>(): AzureBlobLoadStreams<In, Out> {

        // get arguments
        const in_options: StreamOptions<In, AzureBlobLoadOperation> = arguments[0] || {};
        const out_options: StreamOptions<string, Out> = arguments[1] || {};

        // create the streams
        const streams: AzureBlobLoadStreams<In, Out> = {
            in:  new WriteableStream<In, AzureBlobLoadOperation>(in_options),
            out: new ReadableStream<string, Out>(out_options)
        };

        // promisify
        const getBlobToText: (container: string, blob: string) => Promise<string> =
            util.promisify(azs.BlobService.prototype.getBlobToText).bind(this.service);

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

    /**
Use this method by specifying what to load and then an output stream will be updated with the
strings (default) or specified output objects (via transform).

There are multiple ways to work with the output stream (shown in TypeScript):

```typescript
// process results as they come in
load(container).on("data", result => {
    // result is string or Out (if transformed)
}).on("end", () => {
    // all entries have been reported
});

// process a batch of results every so often
const out = list(container);
setInterval(() => {
    const batch = out.buffer.splice(0, 100);
    // batch contains string[] or Out[] (if transformed)
}, 1000);
```
     */
    public load<Out = string>(container: string, filenames: string[]): ReadableStream<string, Out>;
    public load<Out = string>(container: string, filenames: string[], transform: StreamTransform<string, Out>): ReadableStream<string, Out>;
    public load<Out = string>(container: string, filenames: string[], options: StreamOptions<string, Out>): ReadableStream<string, Out>;
    public load<Out = string>(container: string, filenames: string[], transform: StreamTransform<string, Out>, options: StreamOptions<string, Out>): ReadableStream<string, Out>;
    public load<Out = string>(container: string, filenames: string[]): ReadableStream<string, Out> {

        // get arguments
        const transform = overarg<StreamTransform<string, Out>>("function", ...arguments);
        const options = overarg<StreamOptions<string, Out>>("object", ...arguments) || {};
        if (transform) options.transform = transform;

        // get arguments
        let out_options: StreamOptions<string, Out> = {};
        if (arguments[1] && typeof arguments[1] === "object") out_options = arguments[1];
        if (arguments[2] && typeof arguments[2] === "object") out_options = arguments[2];
        if (arguments[1] && typeof arguments[1] === "function") out_options.transform = arguments[1];

        // immediately funnel everything provided
        const streams = this.loadStream<string, Out>({
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

    /**
A Promise to load the specified filenames in a container as strings or any format
you desire using the *transform* option.

Below is an example of using a tranform in TypeScript to return JSON objects:

```typescript
const filenames: string[] = [ "MyFilename1", "MyFilename2" ];
const any[]  = loadAsync<any>("MyContainer", filenames, content => return JSON.parse(content));
```
     */
    public async loadAsync<Out = string>(container: string, filenames: string[]): Promise<Out[]>;
    public async loadAsync<Out = string>(container: string, filenames: string[], transform: StreamTransform<string, Out>): Promise<Out[]>;
    public async loadAsync<Out = string>(container: string, filenames: string[], options: StreamOptions<string, Out>): Promise<Out[]>;
    public async loadAsync<Out = string>(container: string, filenames: string[], transform: StreamTransform<string, Out>, options: StreamOptions<string, Out>): Promise<Out[]>;
    public async loadAsync<Out = string>(): Promise<Out[]> {
        return new Promise<Out[]>((resolve, reject) => {
            try {

                // start querying
                const stream: ReadableStream<string, Out> = this.load.call(this, ...arguments);

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

    /** A Promise to load a file as a string. */
    public async loadFile(container: string, filename: string): Promise<string> {
        const getBlobToText: (container: string, blob: string) => Promise<string> =
            util.promisify(azs.BlobService.prototype.getBlobToText).bind(this.service);
        return getBlobToText(container, filename);
    }

    /**
This method creates an *in* and *out* stream. You can pump AzureBlobListOperation objects
in and get BlobResult objects out. You may also specify transforms for either or both of those
streams to use different in objects or get different objects out.

Below is an example in TypeScript:

```typescript
import * as azs from "azure-storage";
const streams = listStream();
streams.in.push(new AzureBlobListOperation("MyContainer1"));
streams.in.push(new AzureBlobListOperation("MyContainer2", "MyFolder1"));
streams.in.end();
streams.out.on("data", result => {
    // result is azs.BlobService.BlobResult
}).on("end", () => {
    // everything in both operations has been listed
});
```
     */
    public listStream<In = AzureBlobListOperation, Out = azs.BlobService.BlobResult>(): AzureBlobListStreams<In, Out>;
    public listStream<In = AzureBlobListOperation, Out = azs.BlobService.BlobResult>(in_options: StreamOptions<In, AzureBlobListOperation>, out_options: StreamOptions<azs.BlobService.BlobResult, Out>): AzureBlobListStreams<In, Out>;
    public listStream<In = AzureBlobListOperation, Out = azs.BlobService.BlobResult>(): AzureBlobListStreams<In, Out> {

        // get arguments
        const in_options: StreamOptions<In, AzureBlobListOperation> = arguments[0] || {};
        const out_options: StreamOptions<azs.BlobService.BlobResult, Out> = arguments[1] || {};

        // create the streams
        const streams: AzureBlobListStreams<In, Out> = {
            in:  new WriteableStream<In, AzureBlobListOperation>(in_options),
            out: new ReadableStream<azs.BlobService.BlobResult, Out>(out_options)
        };

        // the work counter tracks open-ended work (may have continuation tokens)
        let work_counter = 0;

        // create the work stream, it starts with work from in, but will get more from continuation tokens
        const work = new WriteableStream<AzureBlobListOperation, AzureBlobListOperation>();
        streams.in.on("data", (data: AzureBlobListOperation) => {
            work.push(data);
            work_counter++;
        });

        // promify
        const listBlobsSegmented: (container: string, token?: azs.common.ContinuationToken) =>
            Promise<azs.BlobService.ListBlobsResult> = util.promisify(azs.BlobService.prototype.listBlobsSegmented).bind(this.service);
        const listBlobsSegmentedWithPrefix: (container: string, prefix: string, token?: azs.common.ContinuationToken) =>
            Promise<azs.BlobService.ListBlobsResult> = util.promisify(azs.BlobService.prototype.listBlobsSegmentedWithPrefix).bind(this.service);

        // define the recursive fetch function
        const fetch = async (op: AzureBlobListOperation) => {
            try {

                // get next batch
                const result = (op.prefix) ?
                    await listBlobsSegmentedWithPrefix(op.container, op.prefix, op.token) :
                    await listBlobsSegmented(op.container, op.token);

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
                streams.out.emit("error", error, op);
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

    /**
Use this method by specifying what to list and then an output stream will be updated with the
BlobResults (default) or specified output objects (via transform).

There are multiple ways to work with the output stream (shown in TypeScript):

```typescript
// process results as they come in
list(container).on("data", result => {
    // result is BlobResult or Out (if transformed)
}).on("end", () => {
    // all entries have been reported
});

// process a batch of results every so often
const out = list(container);
setInterval(() => {
    const batch = out.buffer.splice(0, 100);
    // batch contains BlobResult[] or Out[] (if transformed)
}, 1000);
```

You may specify a *prefix* (string) and or a *pattern* (RegExp).
Using a prefix will list all blobs that start with that string (most commonly this is
used to iterate everything in a "folder"). Using a pattern will filter the results to
just those that pass the RegExp match. Prefix is performed server-side (Azure) whereas
pattern is performed client-side (this code), so use prefix for faster perfomance.
```
     */
    public list<Out = azs.BlobService.BlobResult>(container: string): ReadableStream<azs.BlobService.BlobResult, Out>;
    public list<Out = azs.BlobService.BlobResult>(container: string, prefix: string): ReadableStream<azs.BlobService.BlobResult, Out>;
    public list<Out = azs.BlobService.BlobResult>(container: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    public list<Out = azs.BlobService.BlobResult>(container: string, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    public list<Out = azs.BlobService.BlobResult>(container: string, prefix: string, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    public list<Out = azs.BlobService.BlobResult>(container: string, prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    public list<Out = azs.BlobService.BlobResult>(container: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    public list<Out = azs.BlobService.BlobResult>(container: string, prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    public list<Out = azs.BlobService.BlobResult>(container: string): ReadableStream<azs.BlobService.BlobResult, Out> {

        // get arguments
        const prefix = overarg<string>(1, "string", ...arguments);
        const transform = overarg<StreamTransform<azs.BlobService.BlobResult, Out>>("function", ...arguments);
        const options = overarg<StreamOptions<azs.BlobService.BlobResult, Out>>("object", ...arguments) || {};
        if (transform) options.transform = transform;

        // immediately funnel everything provided
        const streams = this.listStream<AzureBlobListOperation, Out>({}, options);
        streams.in.push(new AzureBlobListOperation(container, prefix));
        streams.in.end();
        return streams.out;

    }

    /**
A Promise to list the specified blobs in a container as BlobResult[] or any object format
you desire using the *transform* option.

You may specify a *prefix* (string) and or a *pattern* (RegExp).
Using a prefix will list all blobs that start with that string (most commonly this is
used to iterate everything in a "folder"). Using a pattern will filter the results to
just those that pass the RegExp match. Prefix is performed server-side (Azure) whereas
pattern is performed client-side (this code), so use prefix for faster perfomance.

Below is an example of using a tranform in TypeScript:

```typescript
import * as azs from "azure-storage";

interface MyFormat {
    public filename: string;
}

MyFormat[] filenames = listAsync<MyFormat>("MyContainer", (blobResult: azs.BlobService.BlobResult) => {
    return {
        filename: blobResult.name
    } as MyFormat;
});
```
     */
    public listAsync<Out = azs.BlobService.BlobResult>(container: string): Promise<Out[]>;
    public listAsync<Out = azs.BlobService.BlobResult>(container: string, prefix: string): Promise<Out[]>;
    public listAsync<Out = azs.BlobService.BlobResult>(container: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    public listAsync<Out = azs.BlobService.BlobResult>(container: string, options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    public listAsync<Out = azs.BlobService.BlobResult>(container: string, prefix: string, options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    public listAsync<Out = azs.BlobService.BlobResult>(container: string, prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    public listAsync<Out = azs.BlobService.BlobResult>(container: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    public listAsync<Out = azs.BlobService.BlobResult>(container: string, prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    public listAsync<Out = azs.BlobService.BlobResult>(): Promise<Out[]> {
        return new Promise<Out[]>((resolve, reject) => {
            try {

                // start querying
                const stream: ReadableStream<azs.BlobService.BlobResult, Out> = this.list.call(this, ...arguments);

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

    /**
     * A Promise to list the specified blobs in a container as BlobResult[].
     * You may specify a *prefix* (string) and or a *pattern* (RegExp).
     * Using a prefix will list all blobs that start with that string (most commonly this is
     * used to iterate everything in a "folder"). Using a pattern will filter the results to
     * just those that pass the RegExp match. Prefix is performed server-side (Azure) whereas
     * pattern is performed client-side (this code), so use prefix for faster perfomance.
     */
    public listFiltered(container: string): Promise<azs.BlobService.BlobResult[]>
    public listFiltered(container: string, prefix: string): Promise<azs.BlobService.BlobResult[]>
    public listFiltered(container: string, pattern: RegExp): Promise<azs.BlobService.BlobResult[]>
    public listFiltered(container: string, prefix: string, pattern: RegExp): Promise<azs.BlobService.BlobResult[]>
    public listFiltered(container: string): Promise<azs.BlobService.BlobResult[]> {
        return new Promise<azs.BlobService.BlobResult[]>((resolve, reject) => {
            try {

                // get arguments
                const options: StreamOptions<azs.BlobService.BlobResult, azs.BlobService.BlobResult> = {};
                const prefix = overarg<string>(1, "string", ...arguments);
                const pattern = overarg<RegExp>(RegExp, ...arguments);

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
                    this.list<azs.BlobService.BlobResult>(container, prefix, options) :
                    this.list<azs.BlobService.BlobResult>(container, options);

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

    /** A Promise to list all blobs in a container as BlobResult[]. This is the same as listFiltered() with no additional options. */
    public listAll(container: string): Promise<azs.BlobService.BlobResult[]> {
        return this.listFiltered(container);
    }

    /** A Promise to create a container if it does not exist. */
    public createContainerIfNotExists(container: string) {
        const createContainerIfNotExists: (container: string) => Promise<azs.BlobService.ContainerResult> =
            util.promisify(azs.BlobService.prototype.createContainerIfNotExists).bind(this.service);
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
    constructor(obj: AzureBlobOptions) {

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

    }

}