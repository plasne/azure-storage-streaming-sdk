declare type anyfunc = () => any | void | undefined;
export default abstract class PromiseImposter {
    private events;
    resolve(...args: any[]): void;
    reject(...args: any[]): void;
    then(resolve: anyfunc, reject?: anyfunc): this;
    catch(reject: anyfunc): this;
    finally(settled: anyfunc): this;
}
export {};
