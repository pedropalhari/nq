import "tsm";

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import JSONtoTS from "json-to-ts";
import { nanoid } from "nanoid";
import { join } from "node:path";

function generateTypescriptBody(params: {
  D_TS_FILE_NAME: string;
  isArray: boolean;
}) {
  const { D_TS_FILE_NAME, isArray } = params;

  const TS_BODY = `import type { JSONType } from "./${D_TS_FILE_NAME.replace(
    ".d.ts",
    ""
  )}";

export default async (json: JSONType${isArray ? "[]" : ""}) => {
  return json;
};
`;

  return TS_BODY;
}

async function readPipe() {
  let pipeString = "";

  return new Promise<string>((resolve) => {
    const stdin = process.openStdin();

    stdin.on("data", (pipeChunk) => (pipeString += pipeChunk));

    stdin.on("end", () => resolve(pipeString));
  });
}

async function run() {
  let pipeJSONRaw = "{}";

  if (process.argv[2]) {
    let jsonFileName = process.argv[2];
    let fileJSONBuffer = await fs.readFile(join(process.cwd(), jsonFileName));
    pipeJSONRaw = await fileJSONBuffer.toString();
  } else {
    pipeJSONRaw = await readPipe();
  }

  const pipeJSON = JSON.parse(pipeJSONRaw);

  let pipeJSONTypes = JSONtoTS(pipeJSON, {
    rootName: "JSONType",
  });

  const TS_FILE_NAME = `${nanoid()}.nq.ts`;
  const D_TS_FILE_NAME = `${nanoid()}.nq.d.ts`;

  const TS_FILE_PATH = join(__dirname, TS_FILE_NAME);
  const D_TS_FILE_PATH = join(__dirname, D_TS_FILE_NAME);

  // Export each type
  pipeJSONTypes = pipeJSONTypes.map((typeInterface) => {
    return `export ${typeInterface}`;
  });

  // Generate .d.ts
  await fs.writeFile(D_TS_FILE_PATH, pipeJSONTypes.join(`\n\n`));

  // Generate .ts
  const TS_BODY = generateTypescriptBody({
    D_TS_FILE_NAME,
    isArray: Array.isArray(pipeJSON),
  });
  await fs.writeFile(TS_FILE_PATH, TS_BODY);

  // Open editor

  // Check if Code should open in a new window
  const openCodeInNewWindow = process.argv.includes("-n");

  execSync(`code -w ${openCodeInNewWindow ? "-n " : ""}${TS_FILE_PATH}`);

  // Run it

  try {
    const func = require(TS_FILE_PATH);
    let result = await func.default(pipeJSON);

    // Output it
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    // Clear it
    execSync(`rm ${TS_FILE_PATH} && rm ${D_TS_FILE_PATH}`);
  }
}

run();
