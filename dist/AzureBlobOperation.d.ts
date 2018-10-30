import * as azs from 'azure-storage';
import PromiseImposter from './PromiseImposter';
declare type operationTypes = 'append' | 'createAppend' | 'load' | 'list' | 'listWithPrefix';
export default class AzureBlobOperation extends PromiseImposter {
    container: string;
    type: operationTypes;
    filename?: string;
    content?: string;
    prefix?: string;
    token?: azs.common.ContinuationToken;
    /**
     * This class designates a blob operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     */
    constructor(container: string, type: operationTypes, filename?: string, content?: string);
}
export {};
