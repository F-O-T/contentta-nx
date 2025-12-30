import { parseBlocks, createBlockContext } from "./block-parser.ts";
import {
   DEFAULT_MAX_BUFFER_SIZE,
   type BatchMarkdownFileInput,
   type BatchMarkdownStreamEvent,
   type BatchParsedMarkdownFile,
   type BlockNode,
   type MarkdownDocument,
   type StreamEvent,
   type StreamOptions,
   streamOptionsSchema,
} from "./schemas.ts";
import {
   decodeBuffer,
   detectLineEnding,
   normalizeLineEndings,
   splitLines,
} from "./utils.ts";

// =============================================================================
// Streaming Parser State
// =============================================================================

interface StreamingParserState {
   buffer: string;
   lineBuffer: string[];
   references: Map<string, { url: string; title?: string }>;
   includePositions: boolean;
   maxBufferSize: number;
}

/**
 * Creates initial streaming parser state.
 */
function createStreamingParserState(
   options?: StreamOptions,
): StreamingParserState {
   return {
      buffer: "",
      lineBuffer: [],
      references: new Map(),
      includePositions: options?.positions ?? true,
      maxBufferSize: options?.maxBufferSize ?? DEFAULT_MAX_BUFFER_SIZE,
   };
}

// =============================================================================
// Streaming Parser
// =============================================================================

/**
 * Parses markdown content from a stream, yielding events for each block.
 *
 * @param input - A ReadableStream of Uint8Array or AsyncIterable of strings
 * @param options - Parsing options
 * @yields StreamEvent for each block and completion
 *
 * @example
 * ```typescript
 * const response = await fetch("doc.md");
 * for await (const event of parseStream(response.body)) {
 *   if (event.type === "block") {
 *     console.log(event.data.type);
 *   }
 * }
 * ```
 */
export async function* parseStream(
   input: ReadableStream<Uint8Array> | AsyncIterable<string>,
   options?: StreamOptions,
): AsyncGenerator<StreamEvent> {
   // Validate options if provided
   if (options !== undefined) {
      streamOptionsSchema.parse(options);
   }

   const state = createStreamingParserState(options);

   // Convert ReadableStream to AsyncIterable if needed
   let iterable: AsyncIterable<string>;

   if (input instanceof ReadableStream) {
      const reader = input.getReader();
      const decoder = new TextDecoder();

      iterable = {
         async *[Symbol.asyncIterator]() {
            while (true) {
               const { done, value } = await reader.read();
               if (done) break;
               yield decoder.decode(value, { stream: true });
            }
            // Flush any remaining bytes
            const final = decoder.decode();
            if (final) yield final;
         },
      };
   } else {
      iterable = input;
   }

   // Process each chunk
   for await (const chunk of iterable) {
      yield* processStreamChunk(chunk, state);
   }

   // Process remaining buffer
   yield* flushStreamBuffer(state);

   // Emit completion event
   const document = buildDocument(state);
   yield { type: "complete", document };
}

/**
 * Processes a chunk of markdown content.
 */
function* processStreamChunk(
   chunk: string,
   state: StreamingParserState,
): Generator<StreamEvent> {
   state.buffer += chunk;

   // Check buffer size limit
   if (state.buffer.length > state.maxBufferSize) {
      yield {
         type: "error",
         error: `Buffer size exceeded maximum of ${state.maxBufferSize} bytes`,
      };
      return;
   }

   // Split into lines
   const normalized = normalizeLineEndings(state.buffer);
   const lines = normalized.split("\n");

   // Keep the last line in buffer (might be incomplete)
   state.buffer = lines.pop() ?? "";

   // Add complete lines to line buffer and process
   state.lineBuffer.push(...lines);

   // Process complete blocks
   yield* processLineBuffer(state);
}

/**
 * Processes lines in the buffer, yielding complete blocks.
 */
function* processLineBuffer(
   state: StreamingParserState,
): Generator<StreamEvent> {
   // We need enough context to detect block boundaries
   // Process when we have at least 2 blank lines or EOF
   while (state.lineBuffer.length > 0) {
      // Find the next block boundary
      const { block, consumedLines } = extractNextBlock(state);

      if (block) {
         yield { type: "block", data: block };
         state.lineBuffer.splice(0, consumedLines);
      } else {
         // No complete block yet, wait for more input
         break;
      }
   }
}

/**
 * Extracts the next complete block from the line buffer.
 */
function extractNextBlock(state: StreamingParserState): {
   block: BlockNode | null;
   consumedLines: number;
} {
   if (state.lineBuffer.length === 0) {
      return { block: null, consumedLines: 0 };
   }

   // Look for block boundaries
   let endIndex = -1;
   let blankCount = 0;
   let inFencedCode = false;
   let fenceChar = "";
   let fenceLength = 0;

   for (let i = 0; i < state.lineBuffer.length; i++) {
      const line = state.lineBuffer[i] ?? "";

      // Track fenced code blocks
      const fenceMatch = /^(`{3,}|~{3,})/.exec(line.trimStart());
      if (fenceMatch) {
         if (!inFencedCode) {
            inFencedCode = true;
            fenceChar = fenceMatch[1]?.[0] ?? "`";
            fenceLength = fenceMatch[1]?.length ?? 3;
         } else {
            // Check for closing fence
            const closingMatch = new RegExp(
               `^${fenceChar}{${fenceLength},}\\s*$`,
            ).test(line.trimStart());
            if (closingMatch) {
               inFencedCode = false;
               endIndex = i + 1;
               break;
            }
         }
         continue;
      }

      if (inFencedCode) continue;

      // Blank line detection
      if (line.trim() === "") {
         blankCount++;
         if (blankCount >= 2 && i > 0) {
            endIndex = i;
            break;
         }
      } else {
         blankCount = 0;
      }
   }

   // If still in fenced code or no boundary found, can't extract yet
   if (inFencedCode || endIndex < 0) {
      // But if buffer is getting large, try to extract what we can
      if (state.lineBuffer.length > 100) {
         endIndex = Math.min(50, state.lineBuffer.length);
      } else {
         return { block: null, consumedLines: 0 };
      }
   }

   // Parse the extracted lines
   const content = state.lineBuffer.slice(0, endIndex).join("\n");
   const context = createBlockContext();
   context.references = state.references;

   const { blocks, references } = parseBlocks(
      content,
      context,
      state.includePositions,
   );

   // Merge references
   for (const [key, value] of references) {
      state.references.set(key, value);
   }

   // Return first block
   if (blocks.length > 0) {
      return { block: blocks[0] ?? null, consumedLines: endIndex };
   }

   return { block: null, consumedLines: endIndex };
}

/**
 * Flushes remaining content in the buffer.
 */
function* flushStreamBuffer(
   state: StreamingParserState,
): Generator<StreamEvent> {
   // Add any remaining buffer content
   if (state.buffer.trim()) {
      state.lineBuffer.push(state.buffer);
   }
   state.buffer = "";

   // Process remaining lines
   if (state.lineBuffer.length > 0) {
      const content = state.lineBuffer.join("\n");
      const context = createBlockContext();
      context.references = state.references;

      const { blocks, references } = parseBlocks(
         content,
         context,
         state.includePositions,
      );

      // Merge references
      for (const [key, value] of references) {
         state.references.set(key, value);
      }

      for (const block of blocks) {
         yield { type: "block", data: block };
      }
   }
}

/**
 * Builds the final document from accumulated state.
 */
function buildDocument(state: StreamingParserState): MarkdownDocument {
   // Convert references map to object
   const referencesObj: Record<
      string,
      { type: "linkReferenceDefinition"; label: string; url: string; title?: string }
   > = {};

   for (const [label, ref] of state.references) {
      referencesObj[label] = {
         type: "linkReferenceDefinition",
         label,
         url: ref.url,
         title: ref.title,
      };
   }

   return {
      root: {
         type: "document",
         children: [], // Blocks were already emitted via events
         references:
            Object.keys(referencesObj).length > 0 ? referencesObj : undefined,
      },
      lineEnding: "\n",
   };
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Parses markdown content from a stream and collects all blocks into a document.
 *
 * @param input - A ReadableStream of Uint8Array or AsyncIterable of strings
 * @param options - Parsing options
 * @returns A promise that resolves to the complete MarkdownDocument
 *
 * @example
 * ```typescript
 * const response = await fetch("doc.md");
 * const doc = await parseStreamToDocument(response.body);
 * console.log(doc.root.children.length);
 * ```
 */
export async function parseStreamToDocument(
   input: ReadableStream<Uint8Array> | AsyncIterable<string>,
   options?: StreamOptions,
): Promise<MarkdownDocument> {
   const blocks: BlockNode[] = [];
   let document: MarkdownDocument | null = null;

   for await (const event of parseStream(input, options)) {
      switch (event.type) {
         case "block":
            blocks.push(event.data);
            break;
         case "complete":
            document = event.document;
            break;
         case "error":
            throw new Error(event.error);
      }
   }

   if (!document) {
      throw new Error("Stream ended without completion event");
   }

   // Merge collected blocks into document
   document.root.children = blocks;
   return document;
}

/**
 * Creates a streaming parser from a buffer.
 * Useful when you have a buffer but want to use the streaming API.
 *
 * @param buffer - The buffer containing markdown data
 * @param options - Parsing options
 * @yields StreamEvent for each block and completion
 */
export async function* parseBufferStream(
   buffer: Uint8Array,
   options?: StreamOptions,
): AsyncGenerator<StreamEvent> {
   const content = decodeBuffer(buffer);
   const chunkSize = options?.chunkSize ?? 65536; // 64KB default

   // Create an async iterable that yields chunks
   async function* chunkGenerator(): AsyncGenerator<string> {
      for (let i = 0; i < content.length; i += chunkSize) {
         yield content.slice(i, i + chunkSize);
      }
   }

   yield* parseStream(chunkGenerator(), options);
}

// =============================================================================
// Batch Streaming
// =============================================================================

/**
 * Streaming batch parser - processes files sequentially, yielding events.
 *
 * @param files - Array of files with filename and content
 * @param options - Stream options
 * @yields BatchMarkdownStreamEvent for each file start, block, completion, or error
 *
 * @example
 * ```typescript
 * const files = [
 *   { filename: "readme.md", content: "# Hello" },
 *   { filename: "docs.md", content: "## World" }
 * ];
 * for await (const event of parseBatchStream(files)) {
 *   console.log(event.type, event.filename);
 * }
 * ```
 */
export async function* parseBatchStream(
   files: BatchMarkdownFileInput[],
   options?: StreamOptions,
): AsyncGenerator<BatchMarkdownStreamEvent> {
   let errorCount = 0;

   for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      const filename = file.filename;
      const content = file.content;

      yield { type: "file_start", fileIndex: i, filename };

      try {
         const blocks: BlockNode[] = [];

         // Create chunked async iterable
         async function* chunkGenerator(): AsyncGenerator<string> {
            const chunkSize = options?.chunkSize ?? 65536;
            for (let j = 0; j < content.length; j += chunkSize) {
               yield content.slice(j, j + chunkSize);
               // Yield to main thread
               await new Promise((resolve) => setTimeout(resolve, 0));
            }
         }

         for await (const event of parseStream(chunkGenerator(), options)) {
            switch (event.type) {
               case "block":
                  yield { type: "block", fileIndex: i, data: event.data };
                  blocks.push(event.data);
                  break;
               case "complete": {
                  const doc: MarkdownDocument = {
                     ...event.document,
                     root: {
                        ...event.document.root,
                        children: blocks,
                     },
                  };
                  yield {
                     type: "file_complete",
                     fileIndex: i,
                     filename,
                     document: doc,
                  };
                  break;
               }
               case "error":
                  throw new Error(event.error);
            }
         }
      } catch (err) {
         errorCount++;
         yield {
            type: "file_error",
            fileIndex: i,
            filename,
            error: err instanceof Error ? err.message : String(err),
         };
      }

      // Yield control between files
      await new Promise((resolve) => setTimeout(resolve, 0));
   }

   yield {
      type: "batch_complete",
      totalFiles: files.length,
      errorCount,
   };
}

/**
 * Convenience function that collects streaming batch results into arrays.
 *
 * @param files - Array of files with filename and content
 * @param options - Stream options
 * @returns Array of parsed file results
 */
export async function parseBatchStreamToArray(
   files: BatchMarkdownFileInput[],
   options?: StreamOptions,
): Promise<BatchParsedMarkdownFile[]> {
   const results: BatchParsedMarkdownFile[] = files.map((file, index) => ({
      fileIndex: index,
      filename: file.filename,
   }));

   for await (const event of parseBatchStream(files, options)) {
      switch (event.type) {
         case "file_complete": {
            const result = results[event.fileIndex];
            if (result) {
               result.document = event.document;
            }
            break;
         }
         case "file_error": {
            const result = results[event.fileIndex];
            if (result) {
               result.error = event.error;
            }
            break;
         }
      }
   }

   return results;
}
