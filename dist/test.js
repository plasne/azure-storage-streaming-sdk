"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const AzureBlob_1 = __importDefault(require("./AzureBlob"));
const AzureBlobOperation_1 = __importDefault(require("./AzureBlobOperation"));
dotenv.config();
const STORAGE_ACCOUNT = process.env.STORAGE_ACCOUNT;
const STORAGE_KEY = process.env.STORAGE_KEY;
const STORAGE_SAS = process.env.STORAGE_SAS;
const STORAGE_CONTAINER_SCHEMAS = process.env.STORAGE_CONTAINER_SCHEMAS;
const STORAGE_CONTAINER_INPUT = process.env.STORAGE_CONTAINER_INPUT;
if (!STORAGE_ACCOUNT) {
    throw new Error(`STORAGE_ACCOUNT is null`);
}
if (!STORAGE_CONTAINER_SCHEMAS) {
    throw new Error(`STORAGE_CONTAINER_SCHEMAS is null`);
}
if (!STORAGE_CONTAINER_INPUT) {
    throw new Error(`STORAGE_CONTAINER_INPUT is null`);
}
const blob = new AzureBlob_1.default({
    account: STORAGE_ACCOUNT,
    key: STORAGE_KEY,
    sas: STORAGE_SAS
});
(() => __awaiter(this, void 0, void 0, function* () {
    try {
        const message = {
            filenames: [
                '20181025T193000/name-0b43ff48-9cf6-4d76-8ce2-5865b138398c.xml',
                '20181025T193000/name-f2f32cd8-518b-499b-b7e3-512f6ab468fb.xml'
            ]
        };
        const loader = blob
            .stream(message.filenames, {
            transform: (filename) => new AzureBlobOperation_1.default(STORAGE_CONTAINER_INPUT, 'load', filename)
        })
            .on('data', (data) => {
            console.log(data);
        })
            .on('error', error => {
            console.error(error);
        });
        yield loader.waitForEnd();
    }
    catch (error) {
        console.error(error);
    }
}))();
