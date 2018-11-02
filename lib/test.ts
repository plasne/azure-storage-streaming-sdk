// includes
import assert = require('assert');
import dotenv = require('dotenv');
import 'mocha';
import AzureBlob from './AzureBlob';
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
    let blobSas: AzureBlob;
    let blobKey: AzureBlob;
    before(async () => {
        blobSas = new AzureBlob({
            account: STORAGE_ACCOUNT,
            sas: STORAGE_SAS
        });
        blobKey = new AzureBlob({
            account: STORAGE_ACCOUNT,
            key: STORAGE_KEY
        });
    });

    // create containers
    it('should be able to use STORAGE_SAS to create container', async () => {
        await blobSas.createContainerIfNotExists(STORAGE_CONTAINER_SAS);
        const prop = await blobSas.getContainerProperties(
            STORAGE_CONTAINER_SAS
        );
        assert.equal(prop.name, STORAGE_CONTAINER_SAS);
    });
    it('should be able to use STORAGE_KEY to create container', async () => {
        await blobKey.createContainerIfNotExists(STORAGE_CONTAINER_KEY);
        const prop = await blobKey.getContainerProperties(
            STORAGE_CONTAINER_KEY
        );
        assert.equal(prop.name, STORAGE_CONTAINER_KEY);
    });

    // write a block blob
    it('should be able to use STORAGE_SAS to write a block blob', async () => {
        await blobSas.createBlockBlobFromText(
            STORAGE_CONTAINER_SAS,
            'blockblob01.txt',
            'content goes here.'
        );
    });
    it('should be able to use STORAGE_KEY to write a block blob', async () => {
        await blobKey.createBlockBlobFromText(
            STORAGE_CONTAINER_KEY,
            'blockblob01.txt',
            'content goes here.'
        );
    });

    // read from a block blob
    it('should be able to use STORAGE_SAS to read a block blob', async () => {
        const content = await blobSas.load(
            STORAGE_CONTAINER_SAS,
            'blockblob01.txt'
        );
        assert.equal(typeof content, 'string');
        assert.equal(content, 'content goes here.');
    });
    it('should be able to use STORAGE_KEY to read a block blob', async () => {
        const content = await blobKey.load(
            STORAGE_CONTAINER_KEY,
            'blockblob01.txt'
        );
        assert.equal(typeof content, 'string');
        assert.equal(content, 'content goes here.');
    });

    // write an append blob
    it('should be able to use STORAGE_SAS to write an append blob', async () => {
        await blobSas.createOrReplaceAppendBlob(
            STORAGE_CONTAINER_SAS,
            'appendblob01.txt',
            'line 1 goes here.\n'
        );
        await blobSas.appendToBlob(
            STORAGE_CONTAINER_SAS,
            'appendblob01.txt',
            'line 2 goes here.\n'
        );
    });
    it('should be able to use STORAGE_KEY to write an append blob', async () => {
        await blobKey.createOrReplaceAppendBlob(
            STORAGE_CONTAINER_KEY,
            'appendblob01.txt',
            'line 1 goes here.\n'
        );
        await blobKey.appendToBlob(
            STORAGE_CONTAINER_KEY,
            'appendblob01.txt',
            'line 2 goes here.\n'
        );
    });

    // read from an append blob
    it('should be able to use STORAGE_SAS to read an append blob', async () => {
        const content = await blobSas.load(
            STORAGE_CONTAINER_SAS,
            'appendblob01.txt'
        );
        assert.equal(typeof content, 'string');
        assert.equal(content, 'line 1 goes here.\nline 2 goes here.\n');
    });
    it('should be able to use STORAGE_KEY to read an append blob', async () => {
        const content = await blobKey.load(
            STORAGE_CONTAINER_KEY,
            'appendblob01.txt'
        );
        assert.equal(typeof content, 'string');
        assert.equal(content, 'line 1 goes here.\nline 2 goes here.\n');
    });

    // stream testing

    // delete containers
    it('should be able to use STORAGE_SAS to delete container', async () => {
        const success = await blobSas.deleteContainerIfExists(
            STORAGE_CONTAINER_SAS
        );
        assert.equal(success, true);
        try {
            await blobSas.getContainerProperties(STORAGE_CONTAINER_SAS);
        } catch (error) {
            assert.ok(error.message.includes('NotFound'));
        }
    });
    it('should be able to use STORAGE_KEY to delete container', async () => {
        const success = await blobKey.deleteContainerIfExists(
            STORAGE_CONTAINER_KEY
        );
        assert.equal(success, true);
        try {
            await blobKey.getContainerProperties(STORAGE_CONTAINER_KEY);
        } catch (error) {
            assert.ok(error.message.includes('NotFound'));
        }
    });
});
