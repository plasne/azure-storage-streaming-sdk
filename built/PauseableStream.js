"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts_stream_1 = __importDefault(require("ts-stream"));
class PauseableStream extends ts_stream_1.default {
    pause() {
    }
    resume() {
    }
}
exports.default = PauseableStream;
