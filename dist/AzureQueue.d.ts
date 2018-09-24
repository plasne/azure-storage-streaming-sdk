import * as azs from "azure-storage";
export declare type encoders = "base64" | "xml" | "binary";
export interface AzureQueueOptions {
    service?: azs.QueueService;
    useGlobalAgent?: boolean;
    connectionString?: string;
    account?: string;
    sas?: string;
    key?: string;
    encoder?: encoders;
}
export default class AzureQueue {
    service: azs.QueueService;
    hasMessages(queue: string): Promise<boolean>;
    enqueueMessage(queue: string, message: string): Promise<azs.QueueService.QueueMessageResult>;
    enqueueMessages(queue: string, messages: string[], concurrency?: number): Promise<void>;
    createQueueIfNotExists(queue: string): Promise<azs.QueueService.QueueResult>;
    encoder: encoders;
    constructor(obj: AzureQueueOptions);
}
