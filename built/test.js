"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import AzureBlob from "./AzureBlob";
//import { StreamTransform, StreamOptions } from "./Streams";
//import * as azs from "azure-storage";
//import * as util from "util";
//import * as xpath from "xpath";
//import * as dom from "xmldom";
const overarg_1 = require("./overarg");
class Mouse {
    constructor() {
        this.name = "Mickey";
    }
}
function test() {
    //const { 0: name, 1: prefix }: { 0?: string, 1?: RegExp } = argumentor([ "string", RegExp ], ...arguments);
    const name = overarg_1.overarg("string", ...arguments);
    const pattern = overarg_1.overarg(RegExp, ...arguments);
    const color = overarg_1.overarg(1, "string", ...arguments);
    const work = overarg_1.overarg("function", ...arguments);
    const animal = overarg_1.overarg(1, "object", ...arguments);
    const pet = overarg_1.overargFunc((arg) => arg.type === "dog", ...arguments);
    const mouse = overarg_1.overarg(Mouse, ...arguments);
    console.log("  name:    " + name);
    console.log("  pattern: " + pattern);
    console.log("  color:   " + color);
    console.log("  work:    " + work);
    console.log("  animal:  " + JSON.stringify(animal));
    console.log("  pet:     " + JSON.stringify(pet));
    console.log("  mouse:   " + JSON.stringify(mouse));
}
console.log("test 1:");
test();
console.log("test 2:");
test("Peter");
console.log("test 3:");
test(/Peter/g);
console.log("test 4:");
test("Peter", /Peter/g);
console.log("test 5:");
test("Peter", /Peter/g, "red");
console.log("test 6:");
test("Peter", /Peter/g, (a) => {
    return a;
});
console.log("test 7:");
test("Peter", /Peter/g, { type: "monkey" });
console.log("test 8:");
test("Peter", /Peter/g, { type: "dog" });
console.log("test 9:");
test("Peter", /Peter/g, new Mouse());
// add array case
/*
const a = 1;

const op1 = new AzureBlobStreamWriteOperation("block", "peter", "content for me");
op1.then(() => {
    console.log("yes, I am done");
}).finally(() => {
    console.log("finally");
    console.log(a);
});
blobs.write(op1);
*/
// TEST: errors outside of streams
/*
const input = new AzureBlob({
    account:   "prossapdepot",
    key:       "9xsijr5ok6B+LzWbIOxARxAj6iEqqPyvGOZToL+A8LN8v5PCmiaKVivLZVBVXAyEU6B9smoY9vQon8vpcIWfPg==",
    container: "input"
});
const schema = new AzureBlob({
    service:   input.service,
    container: "schemas"
});

try {

    const schemaLoader = schema.loadStream<azs.BlobService.BlobResult, string>({
        transform: data => data.name
    }, {});
    const fileLoader = input.load([
        "20180910T194500/name-0005e2c3-f743-48b3-92df-bc50545b1e21.xml"
    ]);
    schema.list<azs.BlobService.BlobResult>().pipe(schemaLoader.in);

    (async () => {
        await Promise.all([
            schemaLoader.out.waitForEnd(),
            fileLoader.waitForEnd().catch(error => {
                console.log(`fileloader: ${error}`);
            })
        ]).catch(error => {
            console.log(`await: ${error}`);
        });
        console.log("all done");
        console.log(schemaLoader.out.buffer);
        console.log(fileLoader.buffer);
    })().catch(error => {
        console.log(`almost: ${error}`);
    });
   

} catch (error) {
    console.log(`final: ${error}`);
}
*/
/*
// PIPE

const lister = blobs.list<azs.BlobService.BlobResult>("20180919T134500/");

const streams = blobs.loadStream<azs.BlobService.BlobResult, string>({
    transform: data => {
        return data.name;
    }
}, {});

lister.pipe(streams.in);

streams.out.on("data", (data: string) => {
    console.log(data);
});
*/
/*
blobs.writeAsync<AzureBlobStreamWriteOperation>([
    {
        mode: "block",
        filename: "peter_test.txt",
        content: "content goes here"
    },
    {
        mode: "append",
        filename: "sonya_test.txt",
        content: "content goes here"
    }
]);
*/
/*
interface in_file {
    name: string
}

(async () => {
    const files = await blobs.listAsync<in_file>("20180919T134500/", data => {
        if (data.name.indexOf("c8") > -1) {
            return {
                name: data.name
            };
        } else {
            return null;
        }
    });
    console.log(files);
})();
*/
/*
const lister = blobs.listStream<string, azs.BlobService.BlobResult>({
    transform: data => {
        return {
            prefix: data
        }
    }
}, {});

let count: number = 0;

lister.out.on("data", (data: azs.BlobService.BlobResult) => {
    console.log(data.name);
    count++;
});

lister.out.on("end", () => {
    console.log("done @ " + count);
});

lister.in.push("20180919T134500/");
lister.in.push("20180910T200000/");
lister.in.end();
*/
/*
interface in_file {
    name: string
}

const files: in_file[] = [
    {
        name: "20180919T134500/name-0f17c2de-f1f2-4ffd-80d9-be43357531f8.xml"
    },
    {
        name: "20180919T134500/name-2690cca2-a743-4b43-b735-36ae012d19c3.xml"
    },
    {
        name: "20180919T134500/name-334c7e68-0ab3-44a8-b6d0-b685c674d949.xml"
    }
];

interface out_file {
    id:  string,
    name: string,
    filename: string
}
*/
/*
(async () => {
    const files = await blobs.loadAsync(filenames, data => {
        const doc = new dom.DOMParser().parseFromString(data);
        return {
            id:   xpath.select1("string(/doc/id)", doc).toString(),
            name: xpath.select1("string(/doc/name)", doc).toString()
        } as file;
    });
    console.log(files);
})();

const loader = blobs.load<file>(filenames, data => {
    const doc = new dom.DOMParser().parseFromString(data);
    return {
        id:   xpath.select1("string(/doc/id)", doc).toString(),
        name: xpath.select1("string(/doc/name)", doc).toString()
    } as file;
}).on('end', () => {
    console.log(loader.buffer);
});
*/
/*
const loader = blobs.loadStream<in_file, out_file>({
    transform: data => {
        return data.name;
    }
}, {
    transform: (data, metadata) => {
        const doc = new dom.DOMParser().parseFromString(data);
        return {
            id:       xpath.select1("string(/doc/id)", doc).toString(),
            name:     xpath.select1("string(/doc/name)", doc).toString(),
            filename: metadata.filename
        } as out_file;
    }
});

//loader.out.on("data", (data: file) => {
//    console.log(data);
//});
loader.out.on("end", () => {
    //console.log("done");
    console.log(loader.out.buffer);
});

(async () => {

    for (const file of files) {
        loader.in.push(file);
    }
    loader.in.end();

})();
*/
/*

(async () => {
    const r = blobs.load<file>(filenames, data => {
        const doc = new dom.DOMParser().parseFromString(data);
        return {
            id:   xpath.select1("string(/doc/id)", doc).toString(),
            name: xpath.select1("string(/doc/name)", doc).toString()
        } as file;
    });
    r.on("end", () => {
        console.log(r.buffer);
    });
})();


blobs.listAsync<string>("20180919T134500/", data => {
    return data.name;
}).then(all => {
    console.log(all.length);
});



const r = blobs.list<string>(data => {
    return data.name;
});
r.maxBuffer = 10000000;

r
.on("data", (filename: string) => {
    console.log(filename);
})
.on("end", () => {
    console.log("done");
});

setInterval(_ => {
    console.log(`state: ${r.state}, buffer: ${r.buffer.length}`);
}, 1000);

setTimeout(_ => {
    r.cancel();
}, 10000);

*/
