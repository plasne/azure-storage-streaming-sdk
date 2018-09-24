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
export declare class AzureBlobWriteOperation extends PromiseImposter {
    readonly type: AzureBlobWriteOperationTypes;
    readonly container: string;
    readonly filename: string;
    readonly content?: string;
    /** This class designates a write operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     * */
    constructor(type: AzureBlobWriteOperationTypes, container: string, filename: string, content?: string);
}
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
    writeStream<T>(): WriteableStream<T, AzureBlobWriteOperation>;
    writeStream<T>(transform: StreamTransform<T, AzureBlobWriteOperation>): WriteableStream<T, AzureBlobWriteOperation>;
    writeStream<T>(options: StreamOptions<T, AzureBlobWriteOperation>): WriteableStream<T, AzureBlobWriteOperation>;
    writeStream<T>(transform: StreamTransform<T, AzureBlobWriteOperation>, options: StreamOptions<T, AzureBlobWriteOperation>): WriteableStream<T, AzureBlobWriteOperation>;
    write<In>(operation: In): WriteableStream<In, AzureBlobWriteOperation>;
    write<In>(operations: In[]): WriteableStream<In, AzureBlobWriteOperation>;
    write<In>(operation: In, options: StreamOptions<In, AzureBlobWriteOperation>): WriteableStream<In, AzureBlobWriteOperation>;
    write<In>(operations: In[], options: StreamOptions<In, AzureBlobWriteOperation>): WriteableStream<In, AzureBlobWriteOperation>;
    writeAsync<In>(operation: In): Promise<void>;
    writeAsync<In>(operations: In[]): Promise<void>;
    writeAsync<In>(operation: In, options: StreamOptions<In, AzureBlobWriteOperation>): Promise<void>;
    writeAsync<In>(operations: In[], options: StreamOptions<In, AzureBlobWriteOperation>): Promise<void>;
    create(container: string, filename: string, content: string): Promise<azs.BlobService.BlobResult>;
    append(container: string, filename: string, content?: string): Promise<any>;
    delete(container: string, filename: string): Promise<void>;
    loadStream<In, Out>(): AzureBlobLoadStreams<In, Out>;
    loadStream<In, Out>(in_options: StreamOptions<In, AzureBlobLoadOperation>, out_options: StreamOptions<string, Out>): AzureBlobLoadStreams<In, Out>;
    load<Out>(container: string, filenames: string[]): ReadableStream<string, Out>;
    load<Out>(container: string, filenames: string[], transform: StreamTransform<string, Out>): ReadableStream<string, Out>;
    load<Out>(container: string, filenames: string[], options: StreamOptions<string, Out>): ReadableStream<string, Out>;
    load<Out>(container: string, filenames: string[], transform: StreamTransform<string, Out>, options: StreamOptions<string, Out>): ReadableStream<string, Out>;
    loadAsync<Out>(container: string, filenames: string[]): Promise<Out[]>;
    loadAsync<Out>(container: string, filenames: string[], transform: StreamTransform<string, Out>): Promise<Out[]>;
    loadAsync<Out>(container: string, filenames: string[], options: StreamOptions<string, Out>): Promise<Out[]>;
    loadAsync<Out>(container: string, filenames: string[], transform: StreamTransform<string, Out>, options: StreamOptions<string, Out>): Promise<Out[]>;
    listStream<In, Out>(): AzureBlobListStreams<In, Out>;
    listStream<In, Out>(in_options: StreamOptions<In, AzureBlobListOperation>, out_options: StreamOptions<azs.BlobService.BlobResult, Out>): AzureBlobListStreams<In, Out>;
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

MyFormat[] filenames = listAsync<MyFormat>((blobResult azs.BlobService.BlobResult) => {
    return {
        filename: blobResult.name
    } as MyFormat;
});
```
     */
    listAsync<Out = azs.BlobService.BlobResult>(): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(prefix: string): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(transform: StreamTransform<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(prefix: string, options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
    listAsync<Out = azs.BlobService.BlobResult>(prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): Promise<Out[]>;
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
    /** Create a container if it does not exist. */
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
