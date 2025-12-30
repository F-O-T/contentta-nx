import { describe, expect, it } from "bun:test";
import {
   parseBatchStream,
   parseBatchStreamToArray,
   parseBufferStream,
   parseStream,
   parseStreamToDocument,
} from "../src/index.ts";

describe("parseStream", () => {
   it("parses simple markdown stream", async () => {
      async function* createStream() {
         yield "# Hello\n\n";
         yield "World";
      }

      const events = [];
      for await (const event of parseStream(createStream())) {
         events.push(event);
      }

      expect(events.some((e) => e.type === "block")).toBe(true);
      expect(events.some((e) => e.type === "complete")).toBe(true);
   });

   it("handles chunks that split blocks", async () => {
      async function* createStream() {
         yield "# Hea";
         yield "ding\n\nParagraph";
      }

      const events = [];
      for await (const event of parseStream(createStream())) {
         events.push(event);
      }

      const blockEvents = events.filter((e) => e.type === "block");
      expect(blockEvents.length).toBeGreaterThan(0);
   });

   it("handles code blocks correctly", async () => {
      async function* createStream() {
         yield "```js\n";
         yield "const x = 1;\n";
         yield "```";
      }

      const events = [];
      for await (const event of parseStream(createStream())) {
         events.push(event);
      }

      const blockEvents = events.filter((e) => e.type === "block");
      const codeBlock = blockEvents.find(
         (e) => e.type === "block" && e.data.type === "codeBlock",
      );
      expect(codeBlock).toBeDefined();
   });

   it("parses from ReadableStream", async () => {
      const content = "# Hello\n\nWorld";
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
         start(controller) {
            controller.enqueue(encoder.encode(content));
            controller.close();
         },
      });

      const events = [];
      for await (const event of parseStream(stream)) {
         events.push(event);
      }

      expect(events.some((e) => e.type === "complete")).toBe(true);
   });
});

describe("parseStreamToDocument", () => {
   it("returns complete document", async () => {
      async function* createStream() {
         yield "# Title\n\n";
         yield "Paragraph here.";
      }

      const doc = await parseStreamToDocument(createStream());
      expect(doc.root.type).toBe("document");
      expect(doc.root.children.length).toBeGreaterThan(0);
   });

   it("collects all blocks", async () => {
      async function* createStream() {
         yield "# H1\n\n";
         yield "## H2\n\n";
         yield "### H3";
      }

      const doc = await parseStreamToDocument(createStream());
      expect(doc.root.children.length).toBe(3);
   });
});

describe("parseBufferStream", () => {
   it("parses buffer as stream", async () => {
      const encoder = new TextEncoder();
      const buffer = encoder.encode("# Hello\n\nWorld");

      const events = [];
      for await (const event of parseBufferStream(buffer)) {
         events.push(event);
      }

      expect(events.some((e) => e.type === "block")).toBe(true);
      expect(events.some((e) => e.type === "complete")).toBe(true);
   });

   it("respects chunk size option", async () => {
      const encoder = new TextEncoder();
      const buffer = encoder.encode("# Hello World\n\nThis is a paragraph.");

      const events = [];
      for await (const event of parseBufferStream(buffer, { chunkSize: 10 })) {
         events.push(event);
      }

      expect(events.some((e) => e.type === "complete")).toBe(true);
   });
});

describe("parseBatchStream", () => {
   it("processes multiple files", async () => {
      const files = [
         { filename: "a.md", content: "# File A" },
         { filename: "b.md", content: "# File B" },
      ];

      const events = [];
      for await (const event of parseBatchStream(files)) {
         events.push(event);
      }

      const fileStarts = events.filter((e) => e.type === "file_start");
      expect(fileStarts).toHaveLength(2);

      const fileCompletes = events.filter((e) => e.type === "file_complete");
      expect(fileCompletes).toHaveLength(2);

      const batchComplete = events.find((e) => e.type === "batch_complete");
      expect(batchComplete).toBeDefined();
      if (batchComplete?.type === "batch_complete") {
         expect(batchComplete.totalFiles).toBe(2);
         expect(batchComplete.errorCount).toBe(0);
      }
   });

   it("emits blocks for each file", async () => {
      const files = [
         { filename: "a.md", content: "# A\n\nPara A" },
         { filename: "b.md", content: "# B" },
      ];

      const events = [];
      for await (const event of parseBatchStream(files)) {
         events.push(event);
      }

      const blocks = events.filter((e) => e.type === "block");
      expect(blocks.length).toBeGreaterThan(0);

      // Check file indices
      const file0Blocks = blocks.filter(
         (e) => e.type === "block" && e.fileIndex === 0,
      );
      const file1Blocks = blocks.filter(
         (e) => e.type === "block" && e.fileIndex === 1,
      );

      expect(file0Blocks.length).toBeGreaterThan(0);
      expect(file1Blocks.length).toBeGreaterThan(0);
   });

   it("handles empty files", async () => {
      const files = [{ filename: "empty.md", content: "" }];

      const events = [];
      for await (const event of parseBatchStream(files)) {
         events.push(event);
      }

      const fileComplete = events.find((e) => e.type === "file_complete");
      expect(fileComplete).toBeDefined();
   });
});

describe("parseBatchStreamToArray", () => {
   it("returns array of parsed files", async () => {
      const files = [
         { filename: "a.md", content: "# A" },
         { filename: "b.md", content: "# B" },
      ];

      const results = await parseBatchStreamToArray(files);
      expect(results).toHaveLength(2);
      expect(results[0]?.filename).toBe("a.md");
      expect(results[0]?.document).toBeDefined();
      expect(results[1]?.filename).toBe("b.md");
      expect(results[1]?.document).toBeDefined();
   });

   it("includes parsed documents with blocks", async () => {
      const files = [{ filename: "test.md", content: "# Title\n\nParagraph" }];

      const results = await parseBatchStreamToArray(files);
      expect(results[0]?.document?.root.children.length).toBeGreaterThan(0);
   });
});

describe("stream options", () => {
   it("respects maxBufferSize", async () => {
      // Create a stream that would exceed the buffer
      const largeContent = "x".repeat(100);

      async function* createStream() {
         yield largeContent;
      }

      const events = [];
      for await (const event of parseStream(createStream(), {
         maxBufferSize: 50,
      })) {
         events.push(event);
      }

      // Should have error event due to buffer overflow
      const errorEvent = events.find((e) => e.type === "error");
      expect(errorEvent).toBeDefined();
   });

   it("respects positions option", async () => {
      async function* createStream() {
         yield "# Hello";
      }

      // With positions
      const eventsWithPos = [];
      for await (const event of parseStream(createStream(), {
         positions: true,
      })) {
         eventsWithPos.push(event);
      }

      // Without positions
      const eventsWithoutPos = [];
      for await (const event of parseStream(createStream(), {
         positions: false,
      })) {
         eventsWithoutPos.push(event);
      }

      const blockWithPos = eventsWithPos.find((e) => e.type === "block");
      const blockWithoutPos = eventsWithoutPos.find((e) => e.type === "block");

      if (blockWithPos?.type === "block") {
         expect(blockWithPos.data.position).toBeDefined();
      }

      if (blockWithoutPos?.type === "block") {
         expect(blockWithoutPos.data.position).toBeUndefined();
      }
   });
});
