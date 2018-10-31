import * as azs from 'azure-storage';
import AzureTableOperation from './AzureTableOperation';
import ReadableStream from './ReadableStream';
import { IStreamOptions } from './Stream';
import WriteableStream from './WriteableStream';
export interface IAzureTableOptions {
    service?: azs.TableService;
    useGlobalAgent?: boolean;
    connectionString?: string;
    account?: string;
    sas?: string;
    key?: string;
}
export interface IAzureTableStreams<T, U> {
    in: WriteableStream<T, AzureTableOperation>;
    out: ReadableStream<any, U>;
}
export default class AzureTable {
    service: azs.TableService;
    constructor(obj: IAzureTableOptions);
    queryStream<In = AzureTableOperation, Out = any>(): IAzureTableStreams<In, Out>;
    queryStream<In = AzureTableOperation, Out = any>(inOptions: IStreamOptions<In, AzureTableOperation>, outOptions: IStreamOptions<any, Out>): IAzureTableStreams<In, Out>;
    query<In = AzureTableOperation, Out = any>(operations: In | In[], inOptions?: IStreamOptions<In, AzureTableOperation>, outOptions?: IStreamOptions<any, Out>): ReadableStream<any, Out>;
    queryAsync<In = AzureTableOperation, Out = any>(operations: In | In[], inOptions?: IStreamOptions<In, AzureTableOperation>, outOptions?: IStreamOptions<any, Out>): Promise<void>;
    /** A Promise that will return true if the table is not empty. */
    hasEntities(table: string): Promise<boolean>;
    /** A Promise to insert an entity into the specified table. */
    insert(table: string, entity: object): Promise<azs.TableService.EntityMetadata>;
    /** A Promise to delete the specified table. */
    deleteTable(table: string): Promise<azs.ServiceResponse>;
    /** A Promise to create the table if it doesn't exist. */
    createTableIfNotExists(table: string): Promise<azs.TableService.TableResult>;
}
