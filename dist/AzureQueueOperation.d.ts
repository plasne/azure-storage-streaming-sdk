import * as azs from 'azure-storage';
import PromiseImposter from './PromiseImposter';
declare type operationTypes = 'enqueue' | 'dequeue' | 'delete';
export default class AzureQueueOperation extends PromiseImposter {
    type: operationTypes;
    queue: string;
    message?: any;
    count?: number;
    hiddenForSec?: number;
    /** This class designates an queue operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     */
    constructor(queue: string, type: 'enqueue', message: string | object);
    constructor(queue: string, type: 'dequeue', count?: number);
    constructor(queue: string, type: 'delete', message: azs.QueueService.QueueMessageResult);
}
export {};
