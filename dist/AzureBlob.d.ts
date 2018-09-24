import * as azs from "azure-storage";
import { ReadableStream, WriteableStream, StreamOptions, StreamTransform } from "./Streams";
import PromiseImposter from "./PromiseImposer";
export interface AzureBlobOptions {
    /** Specify to use an existing BlobService. */
    service?: azs.BlobService;
    /**
True, to use HTTP(S) global agent for all calls.

Example:

```typescript
const httpsAgent: any = https.globalAgent;
httpsAgent.keepAlive = true;
httpsAgent.maxSockets = 20;
```
     */
    useGlobalAgent?: boolean;
    /** Specify to use a connection string to instantiate a new BlobService. */
    connectionString?: string;
    /** Specify account and sas or key to instantiate a new BlobService. */
    account?: string;
    /** Specify a sas token starting with ? along with an account to instantiate a new BlobService. */
    sas?: string;
    /** Specify a storage key along with an account to instantiate a new BlobService. */
    key?: string;
}
/** Specify the type of operation that will be performed. */
declare type AzureBlobWriteOperationTypes = "append" | "block" | "delete";
export declare class AzureBlobCommitOperation extends PromiseImposter {
    readonly type: AzureBlobWriteOperationTypes;
    readonly container: string;
    readonly filename: string;
    content?: string;
    /** This class designates a write operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     * */
    constructor(type: AzureBlobWriteOperationTypes, container: string, filename: string, content?: string);
}
declare type AzureBlobCommitStreams<T, U> = {
    in: WriteableStream<T, AzureBlobCommitOperation>;
    out: ReadableStream<AzureBlobCommitOperation, U>;
};
export declare class AzureBlobLoadOperation extends PromiseImposter {
    readonly container: string;
    readonly filename: string;
    /** This class designates a load operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     * */
    constructor(container: string, filename: string);
}
declare type AzureBlobLoadStreams<T, U> = {
    in: WriteableStream<T, AzureBlobLoadOperation>;
    out: ReadableStream<string, U>;
};
export declare class AzureBlobListOperation extends PromiseImposter {
    readonly container: string;
    readonly prefix?: string;
    token?: azs.common.ContinuationToken;
    /** This class designates a list operation that can be queued, streamed, etc.
     * You may optionally specify a prefix to restrict the operation to objects that start with a certain string.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     * */
    constructor(container: string, prefix?: string);
}
declare type AzureBlobListStreams<T, U> = {
    in: WriteableStream<T, AzureBlobListOperation>;
    out: ReadableStream<azs.BlobService.BlobResult, U>;
};
export declare class AzureBlob {
    readonly service: azs.BlobService;
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
    commitStream<In = AzureBlobCommitOperation, Out = AzureBlobCommitOperation>(): AzureBlobCommitStreams<In, Out>;
    commitStream<In = AzureBlobCommitOperation, Out = AzureBlobCommitOperation>(in_options: StreamOptions<In, AzureBlobCommitOperation>, out_options: StreamOptions<AzureBlobCommitOperation, Out>): AzureBlobCommitStreams<In, Out>;
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
    commit<In = AzureBlobCommitOperation>(operation: In): ReadableStream<AzureBlobCommitOperation, AzureBlobCommitOperation>;
    commit<In = AzureBlobCommitOperation>(operations: In[]): ReadableStream<AzureBlobCommitOperation, AzureBlobCommitOperation>;
    commit<In = AzureBlobCommitOperation>(operation: In, options: StreamOptions<In, AzureBlobCommitOperation>): ReadableStream<AzureBlobCommitOperation, AzureBlobCommitOperation>;
    commit<In = AzureBlobCommitOperation>(operations: In[], options: StreamOptions<In, AzureBlobCommitOperation>): ReadableStream<AzureBlobCommitOperation, AzureBlobCommitOperation>;
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
    commitAsync<In = AzureBlobCommitOperation>(operation: In): Promise<void>;
    commitAsync<In = AzureBlobCommitOperation>(operations: In[]): Promise<void>;
    commitAsync<In = AzureBlobCommitOperation>(operation: In, options: StreamOptions<In, AzureBlobCommitOperation>): Promise<void>;
    commitAsync<In = AzureBlobCommitOperation>(operations: In[], options: StreamOptions<In, AzureBlobCommitOperation>): Promise<void>;
    /** A Promise to create a block blob with content. */
    createBlockBlob(container: string, filename: string, content: string): Promise<azs.BlobService.BlobResult>;
    /** A Promise to append to an existing append blob. */
    append(container: string, filename: string, content: string): Promise<azs.BlobService.BlobResult>;
    /** A Promise to create an append blob, with or without content. Use append to add future content. */
    createAppendBlob(container: string, filename: string, content?: string): Promise<any>;
    /** A Promise to delete a blob. */
    delete(container: string, filename: string): Promise<void>;
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
    loadStream<In = AzureBlobLoadOperation, Out = string>(): AzureBlobLoadStreams<In, Out>;
    loadStream<In = AzureBlobLoadOperation, Out = string>(in_options: StreamOptions<In, AzureBlobLoadOperation>, out_options: StreamOptions<string, Out>): AzureBlobLoadStreams<In, Out>;
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
    load<Out = string>(container: string, filenames: string[]): ReadableStream<string, Out>;
    load<Out = string>(container: string, filenames: string[], transform: StreamTransform<string, Out>): ReadableStream<string, Out>;
    load<Out = string>(container: string, filenames: string[], options: StreamOptions<string, Out>): ReadableStream<string, Out>;
    load<Out = string>(container: string, filenames: string[], transform: StreamTransform<string, Out>, options: StreamOptions<string, Out>): ReadableStream<string, Out>;
    /**
A Promise to load the specified filenames in a container as strings or any format
you desire using the *transform* option.

Below is an example of using a tranform in TypeScript to return JSON objects:

```typescript
const filenames: string[] = [ "MyFilename1", "MyFilename2" ];
const any[]  = loadAsync<any>("MyContainer", filenames, content => return JSON.parse(content));
```
     */
    loadAsync<Out = string>(container: string, filenames: string[]): Promise<Out[]>;
    loadAsync<Out = string>(container: string, filenames: string[], transform: StreamTransform<string, Out>): Promise<Out[]>;
    loadAsync<Out = string>(container: string, filenames: string[], options: StreamOptions<string, Out>): Promise<Out[]>;
    loadAsync<Out = string>(container: string, filenames: string[], transform: StreamTransform<string, Out>, options: StreamOptions<string, Out>): Promise<Out[]>;
    /** A Promise to load a file as a string. */
    loadFile(container: string, filename: string): Promise<string>;
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
    listStream<In = AzureBlobListOperation, Out = azs.BlobService.BlobResult>(): AzureBlobListStreams<In, Out>;
    listStream<In = AzureBlobListOperation, Out = azs.BlobService.BlobResult>(in_options: StreamOptions<In, AzureBlobListOperation>, out_options: StreamOptions<azs.BlobService.BlobResult, Out>): AzureBlobListStreams<In, Out>;
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
    list<Out = azs.BlobService.BlobResult>(container: string): ReadableStream<azs.BlobService.BlobResult, Out>;
    list<Out = azs.BlobService.BlobResult>(container: string, prefix: string): ReadableStream<azs.BlobService.BlobResult, Out>;
    list<Out = azs.BlobService.BlobResult>(container: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    list<Out = azs.BlobService.BlobResult>(container: string, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    list<Out = azs.BlobService.BlobResult>(container: string, prefix: string, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    list<Out = azs.BlobService.BlobResult>(container: string, prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    list<Out = azs.BlobService.BlobResult>(container: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    list<Out = azs.BlobService.BlobResult>(container: string, prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
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
    listAsync<Out = azs.BlobService.BlobResult>(container: string): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(container: string, prefix: string): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(container: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(container: string, options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(container: string, prefix: string, options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(container: string, prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(container: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(container: string, prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    /**
     * A Promise to list the specified blobs in a container as BlobResult[].
     * You may specify a *prefix* (string) and or a *pattern* (RegExp).
     * Using a prefix will list all blobs that start with that string (most commonly this is
     * used to iterate everything in a "folder"). Using a pattern will filter the results to
     * just those that pass the RegExp match. Prefix is performed server-side (Azure) whereas
     * pattern is performed client-side (this code), so use prefix for faster perfomance.
     */
    listFiltered(container: string): Promise<azs.BlobService.BlobResult[]>;
    listFiltered(container: string, prefix: string): Promise<azs.BlobService.BlobResult[]>;
    listFiltered(container: string, pattern: RegExp): Promise<azs.BlobService.BlobResult[]>;
    listFiltered(container: string, prefix: string, pattern: RegExp): Promise<azs.BlobService.BlobResult[]>;
    /** A Promise to list all blobs in a container as BlobResult[]. This is the same as listFiltered() with no additional options. */
    listAll(container: string): Promise<azs.BlobService.BlobResult[]>;
    /** A Promise to create a container if it does not exist. */
    createContainerIfNotExists(container: string): Promise<azs.BlobService.ContainerResult>;
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
    constructor(obj: AzureBlobOptions);
}
export {};
