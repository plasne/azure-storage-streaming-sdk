
export default function argumentor(types: any[], ...args: any[]) {
    const output: any = {};
    const used: any[] = [];
    let index = 0;

    for (const type of types) {
        if (type === "object") {
            const found = args.find(arg => (!used.includes(arg) && typeof arg === "object"));
            if (found) used.push(found);
            output[index] = found;
            index++;
        } else if (type === "function") {
            const found = args.find(arg => (!used.includes(arg) && typeof arg === "function"));
            if (found) used.push(found);
            output[index] = found;
            index++;
        } else if (typeof type === "object" || typeof type === "function") {
            const found = args.find(arg => (typeof arg) === "object" ? (!used.includes(arg) && arg instanceof type) : false);
            if (found) used.push(found);
            output[index] = found;
            index++;
        } else if (typeof type === "string") {
            const found = args.find(arg => (!used.includes(arg) && typeof arg === type));
            if (found) used.push(found);
            output[index] = found;
            index++;
        } else {
            output[index] = undefined;
            index++;
        }
    }

    return output;
}


/*

export default function argumentor(types: any[], ...args: any[]) {
    const output: any[] = [];
    const used: any[] = [];

    for (const type of types) {
        if (typeof type === "object" || typeof type === "function") {
            const found = args.find(arg => (typeof arg) === "object" ? (!used.includes(arg) && arg instanceof type) : false);
            if (found) used.push(found);
            output.push(found);
        } else if (typeof type === "string") {
            const found = args.find(arg => (!used.includes(arg) && typeof arg === type));
            if (found) used.push(found);
            output.push(found);
        } else {
            output.push(undefined);
        }
    }

    return output;
}

*/