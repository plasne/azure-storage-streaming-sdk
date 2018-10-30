import * as azs from 'azure-storage';
import PromiseImposter from './PromiseImposter';
declare type operationTypes = 'delete' | 'insert' | 'insertOrMerge' | 'insertOrReplace' | 'merge' | 'replace' | 'retrieve' | 'query';
export default class AzureTableOperation extends PromiseImposter {
    table: string;
    type: operationTypes;
    entity?: any;
    query?: azs.TableQuery;
    token?: azs.TableService.TableContinuationToken;
    readonly partitionKey: any;
    readonly rowKey: any;
    /**
     * This class designates an table operation that can be queued, streamed, etc.
     * After creating an object, you may be alerted when its operation is complete using .then(),
     * .finally(), and trap errors with .catch().
     */
    constructor(table: string, type: operationTypes, entity: any);
    constructor(table: string, type: 'query', query: azs.TableQuery);
}
export {};
