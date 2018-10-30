import PromiseImposter from './PromiseImposter';
export default class AzureQueueOperation extends PromiseImposter {
    direction: 'enqueue' | 'dequeue';
    queue: string;
    message?: string | object;
    count?: number;
    /** This class designates an queue operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     */
    constructor(queue: string, direction: 'enqueue', message: string | object);
    constructor(queue: string, direction: 'dequeue', count?: number);
}
