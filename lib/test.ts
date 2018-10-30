import dotenv = require('dotenv');
import AzureBlob from './AzureBlob';
import AzureBlobOperation from './AzureBlobOperation';

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

const blob = new AzureBlob({
    account: STORAGE_ACCOUNT,
    key: STORAGE_KEY,
    sas: STORAGE_SAS
});

(async () => {
    try {
        const message = {
            filenames: [
                '20181025T193000/name-0b43ff48-9cf6-4d76-8ce2-5865b138398c.xml',
                '20181025T193000/name-f2f32cd8-518b-499b-b7e3-512f6ab468fb.xml'
            ]
        };

        const loader = blob
            .stream<string, string>(message.filenames, {
                transform: (filename: string) =>
                    new AzureBlobOperation(
                        STORAGE_CONTAINER_INPUT,
                        'load',
                        filename
                    )
            })
            .on('data', (data: string) => {
                console.log(data);
            })
            .on('error', error => {
                console.error(error);
            });

        await loader.waitForEnd();
    } catch (error) {
        console.error(error);
    }
})();
