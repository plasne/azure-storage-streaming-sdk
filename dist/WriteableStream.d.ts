import Stream, { IStreamOptions } from './Stream';
export declare type state = 'initializing' | 'readable' | 'ended';
export default class WriteableStream<T, U> extends Stream<T, U> {
    constructor(obj?: IStreamOptions<T, U>);
    readonly state: state;
    end(): void;
}
