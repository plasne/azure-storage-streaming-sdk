// includes
import * as azs from 'azure-storage';
import PromiseImposter from './PromiseImposter';

type operationTypes = 'enqueue' | 'dequeue' | 'delete';

export default class AzureQueueOperation extends PromiseImposter {
    public type: operationTypes;
    public queue: string;
    public message?: any;
    public count?: number;
    public hiddenForSec?: number;

    /** This class designates an queue operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     */
    constructor(queue: string, type: 'enqueue', message: string | object);

    constructor(queue: string, type: 'dequeue', count?: number);

    constructor(
        queue: string,
        type: 'delete',
        message: azs.QueueService.QueueMessageResult
    );

    constructor(queue: string, type: operationTypes) {
        super();
        this.queue = queue;
        this.type = type;
        switch (type) {
            case 'enqueue':
                this.message = arguments[2];
                break;
            case 'dequeue':
                this.count = arguments[2] || 1;
                break;
            case 'delete':
                this.message = arguments[2];
                break;
        }
    }
}
