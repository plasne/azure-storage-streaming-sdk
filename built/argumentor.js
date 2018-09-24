"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const datatypes = ["object", "function", "string", "number", "boolean", "symbol", "undefined"];
/**
 * This tool returns named and typed variables from the arguments passed to a function.
 *
 * let { 0: arg1 }: { 0?: type1 } = argumentor([identifier], ...arguments);
 *
 * Example 1:
 *   let { 0: name, 1: pattern }: { 0?: string, 1?: RegExp } = argumentor([ "string", RegExp ], ...arguments);
 *
 *   console.log(name);    // prints the 1st string passed as an argument or undefined
 *
 *   console.log(pattern); // prints the 1st RegExp passed as an argument or undefined
 *
 * Example 2:
 *   const { 0: name, 1: value }: { 0?: string, 1?: string } = argumentor([ "string", "string" ], ...arguments);
 *
 *   console.log(name);    // prints the 1st string passed as an argument or undefined
 *
 *   console.log(value);   // prints the 2nd string passed as an argument or undefined
 *
 */
function argumentor(types, ...args) {
    const output = {};
    const used = [];
    let index = 0;
    for (const type of types) {
        if (datatypes.includes(type)) {
            // primitives ("object", "string", etc.)
            const found = args.find(arg => (!used.includes(arg) && typeof arg === type));
            if (found)
                used.push(found);
            output[index] = found;
            index++;
        }
        else if (typeof type === "object" || typeof type === "function") {
            // instanceof (RegExp, etc.), also works when comparing against an object created from a class
            const found = args.find(arg => (typeof arg) === "object" ? (!used.includes(arg) && arg instanceof type) : false);
            if (found)
                used.push(found);
            output[index] = found;
            index++;
        }
        else {
            // something else?
            output[index] = undefined;
            index++;
        }
    }
    return output;
}
exports.default = argumentor;
function getArg(offset, identity, ...args) {
    let index = 0;
    return args.find(arg => {
        let isMatch = false;
        try {
            isMatch = identity(arg);
        }
        catch (error) {
            // ignore errors; they won't be a match
        }
        if (isMatch) {
            if (index === offset) {
                return true;
            }
            else {
                index++;
                return false;
            }
        }
        else {
            return false;
        }
    });
}
function argumentor2(a, b, ...args) {
    if (typeof a === "number") {
        if (typeof b === "string") {
            return getArg(a, (arg) => typeof arg === b, ...args);
        }
        else {
            return getArg(a, (arg) => arg instanceof b, ...args);
        }
    }
    else if (typeof a === "string") {
        return getArg(0, (arg) => typeof arg === a, b, ...args);
    }
    else {
        return getArg(0, (arg) => arg instanceof a, b, ...args);
    }
}
exports.argumentor2 = argumentor2;
function matcher(a, b, ...args) {
    if (typeof a === "number") {
        return getArg(a, b, ...args);
    }
    else {
        return getArg(0, (arg) => arg instanceof a, b, ...args);
    }
}
exports.matcher = matcher;
