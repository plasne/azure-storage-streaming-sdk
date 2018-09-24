
// includes
import * as azs from "azure-storage";
import * as util from "util";
import PromisePool from "es6-promise-pool";

export type encoders = "base64" | "xml" | "binary";

export interface AzureQueueJSON {
    service?:          azs.QueueService,
    useGlobalAgent?:   boolean,
    connectionString?: string,
    account?:          string,
    sas?:              string,
    key?:              string,
    encoder?:          encoders
}

export default class AzureQueue {

    public service: azs.QueueService;

    // returns true if there are any messages in the queue
    public async hasMessages(queue: string) {
        const getQueueMetadata: (queue: string) => Promise<azs.QueueService.QueueResult> =
            util.promisify(azs.QueueService.prototype.getQueueMetadata).bind(this.service);
        const result = await getQueueMetadata(queue);
        if (result.approximateMessageCount == null) {
            return true; // it is safer to assume there could be
        } else {
            return (result.approximateMessageCount > 0);
        }
    }

    // add a single message to the queue
    public enqueueMessage(queue: string, message: string) {
        const createMessage: (queue: string, message: string) => Promise<azs.QueueService.QueueMessageResult> =
            util.promisify(azs.QueueService.prototype.createMessage).bind(this.service);
        return createMessage(queue, message);
    }

    // add multiple messages to the queue in parallel
    public async enqueueMessages(queue: string, messages: string[], concurrency: number = 10) {

        // produce promises to save them
        let index = 0;
        const producer = () => {
            if (index < messages.length) {
                const message = messages[index];
                index++;
                return this.enqueueMessage(queue, message);
            } else {
                return undefined;
            }
        }
    
        // enqueue them x at a time
        const pool = new PromisePool(producer, concurrency);
        await pool.start();

    }

    // create the queue if it doesn't already exist
    public createQueueIfNotExists(queue: string) {
        const createQueueIfNotExists: (queue: string) => Promise<azs.QueueService.QueueResult> =
            util.promisify(azs.QueueService.prototype.createQueueIfNotExists).bind(this.service);
        return createQueueIfNotExists(queue);
    }

    // set the encoding method
    public set encoder(option: encoders) {
        switch (option) {
            case "base64":
                this.service.messageEncoder = new azs.QueueMessageEncoder.TextBase64QueueMessageEncoder();
                break;
            case "xml":
                this.service.messageEncoder = new azs.QueueMessageEncoder.TextXmlQueueMessageEncoder();
                break;
            case "binary":
                this.service.messageEncoder = new azs.QueueMessageEncoder.BinaryBase64QueueMessageEncoder();
                break;
        }
    }

    constructor(obj: AzureQueueJSON) {

        // establish the service
        if (obj.service) {
            this.service = obj.service;
        } else if (obj.connectionString) {
            this.service = azs.createQueueService(obj.connectionString);
            if (obj.encoder) this.encoder = obj.encoder;
            if (obj.useGlobalAgent) this.service.enableGlobalHttpAgent = true;
        } else if (obj.account && obj.sas) {
            const host = `https://${obj.account}.queue.core.windows.net`;
            this.service = azs.createQueueServiceWithSas(host, obj.sas);
            if (obj.encoder) this.encoder = obj.encoder;
            if (obj.useGlobalAgent) this.service.enableGlobalHttpAgent = true;
        } else if (obj.account && obj.key) {
            this.service = azs.createQueueService(obj.account, obj.key);
            if (obj.encoder) this.encoder = obj.encoder;
            if (obj.useGlobalAgent) this.service.enableGlobalHttpAgent = true;
        } else {
            throw new Error(`You must specify service, connectionString, account/sas, or account/key.`)
        }

    }

}