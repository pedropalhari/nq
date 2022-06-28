#! /usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("tsm");
const node_child_process_1 = require("node:child_process");
const promises_1 = __importDefault(require("node:fs/promises"));
const json_to_ts_1 = __importDefault(require("json-to-ts"));
const nanoid_1 = require("nanoid");
const node_path_1 = require("node:path");
function generateTypescriptBody(params) {
    const { D_TS_FILE_NAME, isArray } = params;
    const TS_BODY = `import type { JSONType } from "./${D_TS_FILE_NAME.replace(".d.ts", "")}";

export default async (json: JSONType${isArray ? "[]" : ""}) => {
  return json;
};
`;
    return TS_BODY;
}
function readPipe() {
    return __awaiter(this, void 0, void 0, function* () {
        let pipeString = "";
        return new Promise((resolve) => {
            const stdin = process.openStdin();
            stdin.on("data", (pipeChunk) => (pipeString += pipeChunk));
            stdin.on("end", () => resolve(pipeString));
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let pipeJSONRaw = "{}";
        if (process.argv[2]) {
            let jsonFileName = process.argv[2];
            let fileJSONBuffer = yield promises_1.default.readFile((0, node_path_1.join)(process.cwd(), jsonFileName));
            pipeJSONRaw = yield fileJSONBuffer.toString();
        }
        else {
            pipeJSONRaw = yield readPipe();
        }
        const pipeJSON = JSON.parse(pipeJSONRaw);
        let pipeJSONTypes = (0, json_to_ts_1.default)(pipeJSON, {
            rootName: "JSONType",
        });
        const TS_FILE_NAME = `${(0, nanoid_1.nanoid)()}.nq.ts`;
        const D_TS_FILE_NAME = `${(0, nanoid_1.nanoid)()}.nq.d.ts`;
        const TS_FILE_PATH = (0, node_path_1.join)(__dirname, TS_FILE_NAME);
        const D_TS_FILE_PATH = (0, node_path_1.join)(__dirname, D_TS_FILE_NAME);
        // Export each type
        pipeJSONTypes = pipeJSONTypes.map((typeInterface) => {
            return `export ${typeInterface}`;
        });
        // Generate .d.ts
        yield promises_1.default.writeFile(D_TS_FILE_PATH, pipeJSONTypes.join(`\n\n`));
        // Generate .ts
        const TS_BODY = generateTypescriptBody({
            D_TS_FILE_NAME,
            isArray: Array.isArray(pipeJSON),
        });
        yield promises_1.default.writeFile(TS_FILE_PATH, TS_BODY);
        // Open editor
        // Check if Code should open in a new window
        const openCodeInNewWindow = process.argv.includes("-n");
        (0, node_child_process_1.execSync)(`code -w ${openCodeInNewWindow ? "-n " : ""}${TS_FILE_PATH}`);
        // Run it
        try {
            const func = require(TS_FILE_PATH);
            let result = yield func.default(pipeJSON);
            // Output it
            console.log(JSON.stringify(result, null, 2));
        }
        catch (err) {
            console.error(err);
        }
        finally {
            // Clear it
            (0, node_child_process_1.execSync)(`rm ${TS_FILE_PATH} && rm ${D_TS_FILE_PATH}`);
        }
    });
}
run();
