"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// includes
const azs = __importStar(require("azure-storage"));
const util = __importStar(require("util"));
const es6_promise_pool_1 = __importDefault(require("es6-promise-pool"));
class AzureQueue {
    // returns true if there are any messages in the queue
    hasMessages(queue) {
        return __awaiter(this, void 0, void 0, function* () {
            const getQueueMetadata = util.promisify(azs.QueueService.prototype.getQueueMetadata).bind(this.service);
            const result = yield getQueueMetadata(queue);
            if (result.approximateMessageCount == null) {
                return true; // it is safer to assume there could be
            }
            else {
                return (result.approximateMessageCount > 0);
            }
        });
    }
    // add a single message to the queue
    enqueueMessage(queue, message) {
        const createMessage = util.promisify(azs.QueueService.prototype.createMessage).bind(this.service);
        return createMessage(queue, message);
    }
    // add multiple messages to the queue in parallel
    enqueueMessages(queue, messages, concurrency = 10) {
        return __awaiter(this, void 0, void 0, function* () {
            // produce promises to save them
            let index = 0;
            const producer = () => {
                if (index < messages.length) {
                    const message = messages[index];
                    index++;
                    return this.enqueueMessage(queue, message);
                }
                else {
                    return undefined;
                }
            };
            // enqueue them x at a time
            const pool = new es6_promise_pool_1.default(producer, concurrency);
            yield pool.start();
        });
    }
    // create the queue if it doesn't already exist
    createQueueIfNotExists(queue) {
        const createQueueIfNotExists = util.promisify(azs.QueueService.prototype.createQueueIfNotExists).bind(this.service);
        return createQueueIfNotExists(queue);
    }
    // set the encoding method
    set encoder(option) {
        switch (option) {
            case "base64":
                this.service.messageEncoder = new azs.QueueMessageEncoder.TextBase64QueueMessageEncoder();
                break;
            case "xml":
                this.service.messageEncoder = new azs.QueueMessageEncoder.TextXmlQueueMessageEncoder();
                break;
            case "binary":
                this.service.messageEncoder = new azs.QueueMessageEncoder.BinaryBase64QueueMessageEncoder();
                break;
        }
    }
    constructor(obj) {
        // establish the service
        if (obj.service) {
            this.service = obj.service;
        }
        else if (obj.connectionString) {
            this.service = azs.createQueueService(obj.connectionString);
            if (obj.encoder)
                this.encoder = obj.encoder;
            if (obj.useGlobalAgent)
                this.service.enableGlobalHttpAgent = true;
        }
        else if (obj.account && obj.sas) {
            const host = `https://${obj.account}.queue.core.windows.net`;
            this.service = azs.createQueueServiceWithSas(host, obj.sas);
            if (obj.encoder)
                this.encoder = obj.encoder;
            if (obj.useGlobalAgent)
                this.service.enableGlobalHttpAgent = true;
        }
        else if (obj.account && obj.key) {
            this.service = azs.createQueueService(obj.account, obj.key);
            if (obj.encoder)
                this.encoder = obj.encoder;
            if (obj.useGlobalAgent)
                this.service.enableGlobalHttpAgent = true;
        }
        else {
            throw new Error(`You must specify service, connectionString, account/sas, or account/key.`);
        }
    }
}
exports.default = AzureQueue;
