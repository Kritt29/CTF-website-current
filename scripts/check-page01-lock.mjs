import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const locked = JSON.parse(
  readFileSync(new URL("./page01-lock.json", import.meta.url), "utf8"),
);
const digest = (path) => {
  const bytes = readFileSync(path);
  const source = /\.(tsx?|css|json|svg)$/.test(path)
    ? bytes.toString("utf8").replaceAll("\r\n", "\n")
    : bytes;
  return createHash("sha256").update(source).digest("hex");
};
const changed = Object.entries(locked.files)
  .filter(([path, hash]) => digest(path) !== hash)
  .map(([path]) => path);
if (changed.length)
  throw new Error(`Approved Page 01 files changed: ${changed.join(", ")}`);
console.log(
  `Page 01 lock passed: ${Object.keys(locked.files).length} files match ${locked.commit}.`,
);
