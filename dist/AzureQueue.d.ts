import * as azs from 'azure-storage';
import AzureQueueOperation from './AzureQueueOperation';
import ReadableStream from './ReadableStream';
import { IStreamOptions } from './Stream';
import WriteableStream from './WriteableStream';
export declare type encoders = 'base64' | 'xml' | 'binary';
export interface IAzureQueueOptions {
    service?: azs.QueueService;
    useGlobalAgent?: boolean;
    connectionString?: string;
    account?: string;
    sas?: string;
    key?: string;
    encoder?: encoders;
}
export interface IAzureQueueStreams<T, U> {
    in: WriteableStream<T, AzureQueueOperation>;
    out: ReadableStream<string, U>;
}
export default class AzureQueue {
    service: azs.QueueService;
    constructor(obj: IAzureQueueOptions);
    /** Returns *true* if there are any messages in the queue. */
    hasMessages(queue: string): Promise<boolean>;
    streams<In = AzureQueueOperation, Out = string>(): IAzureQueueStreams<In, Out>;
    streams<In = AzureQueueOperation, Out = AzureQueueOperation>(inOptions: IStreamOptions<In, AzureQueueOperation>, outOptions: IStreamOptions<string, Out>): IAzureQueueStreams<In, Out>;
    stream<In = AzureQueueOperation, Out = string>(operations: In | In[], inOptions?: IStreamOptions<In, AzureQueueOperation>, outOptions?: IStreamOptions<string, Out>): ReadableStream<string, Out>;
    process<In = AzureQueueOperation, Out = string>(operations: In | In[], inOptions?: IStreamOptions<In, AzureQueueOperation>, outOptions?: IStreamOptions<string, Out>): Promise<void>;
    enqueueMessages(queue: string, messages: string[] | object[]): Promise<void>;
    enqueueMessage(queue: string, message: string | object): Promise<azs.QueueService.QueueMessageResult>;
    dequeueMessages(queue: string, count?: number, hiddenForSec?: number): Promise<azs.QueueService.QueueMessageResult[]>;
    deleteMessage(queue: string, messageId: string, popReceipt: string): Promise<void>;
    /** A Promise to create the queue if it doesn't exist. */
    createQueueIfNotExists(queue: string): Promise<azs.QueueService.QueueResult>;
    /** Specify the encoding method ("base64" | "xml" | "binary"). */
    encoder: encoders;
}
