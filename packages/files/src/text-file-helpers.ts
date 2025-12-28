import { gzipSync } from "fflate";

export function compressMarkdown(inputBuffer: Buffer): Buffer {
   return Buffer.from(gzipSync(inputBuffer));
}
