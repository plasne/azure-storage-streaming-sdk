"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AzureTable_1 = __importDefault(require("./AzureTable"));
exports.AzureTable = AzureTable_1.default;
__export(require("./AzureBlob"));
__export(require("./AzureQueue"));
