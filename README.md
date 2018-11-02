didn't use streams because they buffer, increasing memory
PromiseLike due to constraints with inheriting promises

test cases should cover failed transforms
ensure consistent datatypes returned

```typescript
// list the blobs via a streaming pattern
public list<Out = azs.BlobService.BlobResult>(): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(prefix: string): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(transform: StreamTransform<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(prefix: string, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(): ReadableStream<azs.BlobService.BlobResult, Out> {

    // get arguments
    let prefix: string | undefined = undefined;
    let out_options: StreamOptions<azs.BlobService.BlobResult, T> = {};
    if (arguments[0] && typeof arguments[0] === "object") out_options = arguments[0];
    if (arguments[1] && typeof arguments[1] === "object") out_options = arguments[1];
    if (arguments[2] && typeof arguments[2] === "object") out_options = arguments[2];
    if (arguments[0] && typeof arguments[0] === "string") prefix = arguments[0];
    if (arguments[0] && typeof arguments[0] === "function") out_options.transform = arguments[0];
    if (arguments[1] && typeof arguments[1] === "function") out_options.transform = arguments[1];

}
```

```typescript
// list the blobs via a streaming pattern
public list<Out = azs.BlobService.BlobResult>(): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(prefix: string): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(transform: StreamTransform<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(prefix: string, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(prefix: string, transform: StreamTransform<azs.BlobService.BlobResult, Out>, options: StreamOptions<azs.BlobService.BlobResult, Out>): ReadableStream<azs.BlobService.BlobResult, Out>;
public list<Out = azs.BlobService.BlobResult>(): ReadableStream<azs.BlobService.BlobResult, Out> {

    // get arguments
    let { 0: prefix, 1: transform, 2: options }: { 0?: string, 1?: StreamTransform<azs.BlobService.BlobResult, Out>, 2?: StreamOptions<azs.BlobService.BlobResult, Out> } = argumentor([ "string", "function", "object" ], ...arguments);
    options = options || {};
    if (transform) options.transform = transform;

}
```
