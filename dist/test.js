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
// includes
const assert = require("assert");
const dotenv = require("dotenv");
require("mocha");
const AzureBlob_1 = __importDefault(require("./AzureBlob"));
// import AzureBlobOperation from './AzureBlobOperation';
// get variables
dotenv.config();
const STORAGE_ACCOUNT = process.env.STORAGE_ACCOUNT;
const STORAGE_KEY = process.env.STORAGE_KEY;
const STORAGE_SAS = process.env.STORAGE_SAS;
const STORAGE_CONTAINER_SAS = process.env.STORAGE_CONTAINER_SAS;
const STORAGE_CONTAINER_KEY = process.env.STORAGE_CONTAINER_KEY;
if (!STORAGE_ACCOUNT) {
    throw new Error(`STORAGE_ACCOUNT cannot be null.`);
}
if (!STORAGE_SAS) {
    throw new Error(`STORAGE_SAS cannot be null.`);
}
if (!STORAGE_KEY) {
    throw new Error(`STORAGE_KEY cannot be null.`);
}
if (!STORAGE_CONTAINER_SAS) {
    throw new Error(`STORAGE_CONTAINER_SAS cannot be null.`);
}
if (!STORAGE_CONTAINER_KEY) {
    throw new Error(`STORAGE_CONTAINER_KEY cannot be null.`);
}
// unit tests
describe('Blob Tests', () => {
    // configure blob connections
    let blobSas;
    let blobKey;
    before(() => __awaiter(this, void 0, void 0, function* () {
        blobSas = new AzureBlob_1.default({
            account: STORAGE_ACCOUNT,
            sas: STORAGE_SAS
        });
        blobKey = new AzureBlob_1.default({
            account: STORAGE_ACCOUNT,
            key: STORAGE_KEY
        });
    }));
    // create containers
    it('should be able to use STORAGE_SAS to create container', () => __awaiter(this, void 0, void 0, function* () {
        yield blobSas.createContainerIfNotExists(STORAGE_CONTAINER_SAS);
        const prop = yield blobSas.getContainerProperties(STORAGE_CONTAINER_SAS);
        assert.equal(prop.name, STORAGE_CONTAINER_SAS);
    }));
    it('should be able to use STORAGE_KEY to create container', () => __awaiter(this, void 0, void 0, function* () {
        yield blobKey.createContainerIfNotExists(STORAGE_CONTAINER_KEY);
        const prop = yield blobKey.getContainerProperties(STORAGE_CONTAINER_KEY);
        assert.equal(prop.name, STORAGE_CONTAINER_KEY);
    }));
    // write a block blob
    it('should be able to use STORAGE_SAS to write a block blob', () => __awaiter(this, void 0, void 0, function* () {
        yield blobSas.createBlockBlobFromText(STORAGE_CONTAINER_SAS, 'blockblob01.txt', 'content goes here.');
    }));
    it('should be able to use STORAGE_KEY to write a block blob', () => __awaiter(this, void 0, void 0, function* () {
        yield blobKey.createBlockBlobFromText(STORAGE_CONTAINER_KEY, 'blockblob01.txt', 'content goes here.');
    }));
    // read from a block blob
    it('should be able to use STORAGE_SAS to read a block blob', () => __awaiter(this, void 0, void 0, function* () {
        const content = yield blobSas.load(STORAGE_CONTAINER_SAS, 'blockblob01.txt');
        assert.equal(typeof content, 'string');
        assert.equal(content, 'content goes here.');
    }));
    it('should be able to use STORAGE_KEY to read a block blob', () => __awaiter(this, void 0, void 0, function* () {
        const content = yield blobKey.load(STORAGE_CONTAINER_KEY, 'blockblob01.txt');
        assert.equal(typeof content, 'string');
        assert.equal(content, 'content goes here.');
    }));
    // write an append blob
    it('should be able to use STORAGE_SAS to write an append blob', () => __awaiter(this, void 0, void 0, function* () {
        yield blobSas.createOrReplaceAppendBlob(STORAGE_CONTAINER_SAS, 'appendblob01.txt', 'line 1 goes here.\n');
        yield blobSas.appendToBlob(STORAGE_CONTAINER_SAS, 'appendblob01.txt', 'line 2 goes here.\n');
    }));
    it('should be able to use STORAGE_KEY to write an append blob', () => __awaiter(this, void 0, void 0, function* () {
        yield blobKey.createOrReplaceAppendBlob(STORAGE_CONTAINER_KEY, 'appendblob01.txt', 'line 1 goes here.\n');
        yield blobKey.appendToBlob(STORAGE_CONTAINER_KEY, 'appendblob01.txt', 'line 2 goes here.\n');
    }));
    // read from an append blob
    it('should be able to use STORAGE_SAS to read an append blob', () => __awaiter(this, void 0, void 0, function* () {
        const content = yield blobSas.load(STORAGE_CONTAINER_SAS, 'appendblob01.txt');
        assert.equal(typeof content, 'string');
        assert.equal(content, 'line 1 goes here.\nline 2 goes here.\n');
    }));
    it('should be able to use STORAGE_KEY to read an append blob', () => __awaiter(this, void 0, void 0, function* () {
        const content = yield blobKey.load(STORAGE_CONTAINER_KEY, 'appendblob01.txt');
        assert.equal(typeof content, 'string');
        assert.equal(content, 'line 1 goes here.\nline 2 goes here.\n');
    }));
    // delete containers
    it('should be able to use STORAGE_SAS to delete container', () => __awaiter(this, void 0, void 0, function* () {
        const success = yield blobSas.deleteContainerIfExists(STORAGE_CONTAINER_SAS);
        assert.equal(success, true);
        try {
            yield blobSas.getContainerProperties(STORAGE_CONTAINER_SAS);
        }
        catch (error) {
            assert.ok(error.message.includes('NotFound'));
        }
    }));
    it('should be able to use STORAGE_KEY to delete container', () => __awaiter(this, void 0, void 0, function* () {
        const success = yield blobKey.deleteContainerIfExists(STORAGE_CONTAINER_KEY);
        assert.equal(success, true);
        try {
            yield blobKey.getContainerProperties(STORAGE_CONTAINER_KEY);
        }
        catch (error) {
            assert.ok(error.message.includes('NotFound'));
        }
    }));
});
