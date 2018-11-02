import * as azs from 'azure-storage';
import AzureBlobOperation from './AzureBlobOperation';
import ReadableStream from './ReadableStream';
import { IStreamOptions } from './Stream';
import WriteableStream from './WriteableStream';
export interface IAzureBlobOptions {
    service?: azs.BlobService;
    useGlobalAgent?: boolean;
    connectionString?: string;
    account: string;
    sas?: string;
    key?: string;
}
export interface IAzureBlobStreams<T, U> {
    in: WriteableStream<T, AzureBlobOperation>;
    out: ReadableStream<any, U>;
}
export default class AzureBlob {
    service: azs.BlobService;
    account: string;
    sas?: string;
    key?: string;
    constructor(obj: IAzureBlobOptions);
    createBlockBlobFromText(container: string, filename: string, content: string): Promise<void>;
    createOrReplaceAppendBlob(container: string, filename: string, content?: string): Promise<void | {}>;
    appendToBlob(container: string, filename: string, content: string): Promise<{}>;
    load(container: string, filename: string): Promise<string>;
    streams<In = AzureBlobOperation, Out = any>(): IAzureBlobStreams<In, Out>;
    streams<In = AzureBlobOperation, Out = any>(inOptions: IStreamOptions<In, AzureBlobOperation>, outOptions: IStreamOptions<any, Out>): IAzureBlobStreams<In, Out>;
    stream<In = AzureBlobOperation, Out = any>(operations: In | In[], inOptions?: IStreamOptions<In, AzureBlobOperation>, outOptions?: IStreamOptions<any, Out>): ReadableStream<any, Out>;
    process<In = AzureBlobOperation, Out = any>(operations: In | In[], inOptions?: IStreamOptions<In, AzureBlobOperation>, outOptions?: IStreamOptions<any, Out>): Promise<void>;
    loadAsStream<Out = string>(container: string, prefix?: string, outOptions?: IStreamOptions<string, Out>): ReadableStream<string, Out>;
    listAsStream<Out = azs.BlobService.BlobResult>(container: string, prefix?: string, outOptions?: IStreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
    /** Gets information about the container. */
    getContainerProperties(container: string): Promise<azs.BlobService.ContainerResult>;
    /** Delete the container if it exists. */
    deleteContainerIfExists(container: string): Promise<boolean>;
    /** Create the container if it doesn't exist. */
    createContainerIfNotExists(container: string): Promise<azs.BlobService.ContainerResult>;
    private generateSignature;
}
