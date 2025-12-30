import { expect, setDefaultTimeout, test } from "bun:test";

setDefaultTimeout(120000); // 2-minute timeout for performance tests

import {
   countWords,
   extractText,
   generate,
   getCodeBlocks,
   getHeadings,
   getImages,
   getLinks,
   parse,
   parseOrThrow,
   parseStream,
   parseStreamToDocument,
} from "../src/index.ts";

// =============================================================================
// Types
// =============================================================================

interface BenchmarkResult {
   name: string;
   iterations: number;
   totalMs: number;
   avgMs: number;
   minMs: number;
   maxMs: number;
   opsPerSec: number;
}

// =============================================================================
// Benchmark Helpers
// =============================================================================

function benchmark(
   name: string,
   fn: () => void,
   iterations = 100,
): BenchmarkResult {
   const times: number[] = [];

   // Warmup (5 iterations)
   for (let i = 0; i < 5; i++) {
      fn();
   }

   // Measure actual iterations
   for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
   }

   const totalMs = times.reduce((a, b) => a + b, 0);
   const avgMs = totalMs / iterations;
   const minMs = Math.min(...times);
   const maxMs = Math.max(...times);
   const opsPerSec = 1000 / avgMs;

   return { avgMs, iterations, maxMs, minMs, name, opsPerSec, totalMs };
}

function formatResult(result: BenchmarkResult): string {
   return `${result.name}: avg=${result.avgMs.toFixed(3)}ms, min=${result.minMs.toFixed(3)}ms, max=${result.maxMs.toFixed(3)}ms, ops/s=${result.opsPerSec.toFixed(2)}`;
}

function formatBytes(bytes: number): string {
   if (bytes < 1024) return `${bytes} B`;
   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
   return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatNumber(n: number): string {
   return n.toLocaleString("en-US");
}

// =============================================================================
// Data Generators
// =============================================================================

/**
 * Generates simple markdown with headings and paragraphs.
 */
function generateSimpleMarkdown(lineCount: number): string {
   const lines: string[] = [];
   let currentLine = 0;

   while (currentLine < lineCount) {
      // Add a heading every 10 lines
      if (currentLine % 10 === 0) {
         const level = (Math.floor(currentLine / 100) % 6) + 1;
         lines.push(`${"#".repeat(level)} Section ${Math.floor(currentLine / 10) + 1}`);
         lines.push("");
         currentLine += 2;
      } else {
         // Add a paragraph with some inline formatting
         const paragraphIndex = currentLine;
         lines.push(
            `This is paragraph ${paragraphIndex} with **bold** and *italic* text. ` +
            `It contains a [link](https://example.com/${paragraphIndex}) and \`inline code\`.`,
         );
         lines.push("");
         currentLine += 2;
      }
   }

   return lines.join("\n");
}

/**
 * Generates complex markdown with various block and inline elements.
 */
function generateComplexMarkdown(sectionCount: number): string {
   const lines: string[] = [];

   for (let i = 0; i < sectionCount; i++) {
      // Heading
      const level = (i % 3) + 1;
      lines.push(`${"#".repeat(level)} Section ${i + 1}`);
      lines.push("");

      // Paragraph with inline elements
      lines.push(
         `This section contains **strong text**, *emphasized text*, ` +
         `\`inline code\`, and [a link](https://example.com/section-${i}).`,
      );
      lines.push("");

      // Blockquote
      lines.push(`> This is a blockquote in section ${i + 1}.`);
      lines.push(`> It spans multiple lines.`);
      lines.push("");

      // Unordered list
      lines.push(`- Item ${i * 3 + 1}`);
      lines.push(`- Item ${i * 3 + 2} with **bold**`);
      lines.push(`- Item ${i * 3 + 3} with [link](https://example.com)`);
      lines.push("");

      // Ordered list
      lines.push(`1. First step`);
      lines.push(`2. Second step with \`code\``);
      lines.push(`3. Third step`);
      lines.push("");

      // Code block
      lines.push("```javascript");
      lines.push(`function example${i}() {`);
      lines.push(`   return ${i};`);
      lines.push(`}`);
      lines.push("```");
      lines.push("");

      // Image
      lines.push(`![Image ${i}](image-${i}.png "Title ${i}")`);
      lines.push("");

      // Thematic break
      lines.push("---");
      lines.push("");
   }

   return lines.join("\n");
}

/**
 * Generates worst-case markdown with deep nesting and complex structures.
 */
function generateWorstCaseMarkdown(blockCount: number): string {
   const lines: string[] = [];

   for (let i = 0; i < blockCount; i++) {
      // Deep nested blockquote
      const depth = (i % 5) + 1;
      const prefix = "> ".repeat(depth);
      lines.push(`${prefix}Nested blockquote at depth ${depth} in block ${i}`);
      lines.push(`${prefix}With **bold**, *italic*, \`code\`, and [link](url)`);
      lines.push("");

      // Nested list
      lines.push("- Level 1");
      lines.push("   - Level 2");
      lines.push("      - Level 3");
      lines.push("         - Level 4");
      lines.push("");

      // Long paragraph with many inline elements
      lines.push(
         `Paragraph ${i} with **bold ${i}** and *italic ${i}* and \`code ${i}\` ` +
         `and [link ${i}](https://example.com/${i}) and another **bold** and ` +
         `*italic* and \`more code\` and [another link](https://test.com/${i}).`,
      );
      lines.push("");

      // Code block with language
      lines.push(`\`\`\`typescript`);
      lines.push(`interface Block${i} {`);
      lines.push(`   id: number;`);
      lines.push(`   name: string;`);
      lines.push(`   children: Block${i}[];`);
      lines.push(`}`);
      lines.push(`\`\`\``);
      lines.push("");
   }

   return lines.join("\n");
}

/**
 * Generates markdown with many reference links.
 */
function generateReferenceLinksMarkdown(linkCount: number): string {
   const lines: string[] = [];

   // Content with reference links
   for (let i = 0; i < linkCount; i++) {
      lines.push(`Check out [Link ${i}][ref${i}] for more info.`);
   }
   lines.push("");

   // Reference definitions at the end
   for (let i = 0; i < linkCount; i++) {
      lines.push(`[ref${i}]: https://example.com/${i} "Title ${i}"`);
   }

   return lines.join("\n");
}

// =============================================================================
// Granular Size Tests
// =============================================================================

test("performance: parse small markdown (100 lines)", () => {
   const markdown = generateSimpleMarkdown(100);
   const result = benchmark("parse-100-lines", () => parse(markdown), 100);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(10);
});

test("performance: parse medium markdown (1000 lines)", () => {
   const markdown = generateSimpleMarkdown(1000);
   const result = benchmark("parse-1000-lines", () => parse(markdown), 50);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(100);
});

test("performance: parse large markdown (10000 lines)", () => {
   const markdown = generateSimpleMarkdown(10000);
   const result = benchmark("parse-10000-lines", () => parse(markdown), 20);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(2500);
});

test("performance: parse very large markdown (50000 lines)", () => {
   const markdown = generateSimpleMarkdown(50000);
   const result = benchmark("parse-50000-lines", () => parse(markdown), 5);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(12000);
});

// =============================================================================
// Complex Content Tests
// =============================================================================

test("performance: parse complex markdown (100 sections)", () => {
   const markdown = generateComplexMarkdown(100);
   const result = benchmark("parse-complex-100", () => parse(markdown), 50);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(100);
});

test("performance: parse complex markdown (1000 sections)", () => {
   const markdown = generateComplexMarkdown(1000);
   const result = benchmark("parse-complex-1000", () => parse(markdown), 10);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(2000);
});

// =============================================================================
// Operation-Specific Tests
// =============================================================================

test("performance: generate markdown from AST (1000 blocks)", () => {
   const markdown = generateComplexMarkdown(100);
   const doc = parseOrThrow(markdown);

   const result = benchmark("generate-1000-blocks", () => generate(doc), 100);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(50);
});

test("performance: round-trip parse and generate (1000 lines)", () => {
   const markdown = generateSimpleMarkdown(1000);

   const result = benchmark(
      "roundtrip-1000-lines",
      () => {
         const doc = parseOrThrow(markdown);
         generate(doc);
      },
      50,
   );

   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(150);
});

test("performance: extractText (10000 lines)", () => {
   const markdown = generateSimpleMarkdown(10000);

   const result = benchmark("extractText-10000", () => extractText(markdown), 20);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(2500);
});

test("performance: countWords (10000 lines)", () => {
   const markdown = generateSimpleMarkdown(10000);

   const result = benchmark("countWords-10000", () => countWords(markdown), 20);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(2500);
});

test("performance: getHeadings extraction (1000 sections)", () => {
   const markdown = generateComplexMarkdown(1000);
   const headings = getHeadings(markdown);

   // Now benchmark just the extraction on pre-parsed content
   const result = benchmark("getHeadings-1000", () => getHeadings(markdown), 10);
   console.log(formatResult(result));
   expect(headings.length).toBeGreaterThan(0);
   expect(result.avgMs).toBeLessThan(2000);
});

test("performance: getLinks extraction (1000 sections)", () => {
   const markdown = generateComplexMarkdown(1000);

   const result = benchmark("getLinks-1000", () => getLinks(markdown), 10);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(2000);
});

test("performance: getImages extraction (1000 sections)", () => {
   const markdown = generateComplexMarkdown(1000);

   const result = benchmark("getImages-1000", () => getImages(markdown), 10);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(2000);
});

test("performance: getCodeBlocks extraction (1000 sections)", () => {
   const markdown = generateComplexMarkdown(1000);

   const result = benchmark("getCodeBlocks-1000", () => getCodeBlocks(markdown), 10);
   console.log(formatResult(result));
   expect(result.avgMs).toBeLessThan(2000);
});

// =============================================================================
// Scaling Analysis
// =============================================================================

test("performance: memory efficiency with scaling", () => {
   const lineCounts = [1000, 5000, 10000, 25000];
   const results: { count: number; parseTime: number; memoryMB: number }[] = [];

   for (const count of lineCounts) {
      const markdown = generateSimpleMarkdown(count);

      const startMemory = process.memoryUsage().heapUsed;
      const startTime = performance.now();

      const doc = parseOrThrow(markdown);

      const endTime = performance.now();
      const endMemory = process.memoryUsage().heapUsed;

      results.push({
         count,
         memoryMB: (endMemory - startMemory) / (1024 * 1024),
         parseTime: endTime - startTime,
      });

      expect(doc.root.children.length).toBeGreaterThan(0);
   }

   console.log("\nMemory Scaling:");
   for (const r of results) {
      console.log(
         `  ${formatNumber(r.count)} lines: ${r.parseTime.toFixed(2)}ms, ~${r.memoryMB.toFixed(2)}MB`,
      );
   }

   // Check linear scaling (ratio should be close to count ratio)
   const ratio =
      (results[results.length - 1]?.parseTime ?? 0) /
      (results[0]?.parseTime ?? 1);
   const countRatio =
      (results[results.length - 1]?.count ?? 0) / (results[0]?.count ?? 1);
   expect(ratio).toBeLessThan(countRatio * 2); // Allow 2x overhead
});

// =============================================================================
// Concurrent Parsing
// =============================================================================

test("performance: concurrent parsing", async () => {
   const markdown = generateSimpleMarkdown(2000);
   const concurrency = 10;

   const start = performance.now();
   const promises = Array.from({ length: concurrency }, () =>
      Promise.resolve(parse(markdown)),
   );
   const results = await Promise.all(promises);
   const end = performance.now();

   const totalTime = end - start;
   const avgTimePerParse = totalTime / concurrency;

   console.log(
      `Concurrent parsing (${concurrency}x): total=${totalTime.toFixed(2)}ms, avg=${avgTimePerParse.toFixed(2)}ms`,
   );

   expect(results.every((r) => r.success)).toBe(true);
   expect(totalTime).toBeLessThan(2000);
});

// =============================================================================
// File Size Impact
// =============================================================================

test("performance: file size impact analysis", () => {
   const sizes = [100, 500, 1000, 2500, 5000, 10000];

   console.log("\nFile Size Impact:");
   for (const lineCount of sizes) {
      const markdown = generateSimpleMarkdown(lineCount);
      const fileSize = new Blob([markdown]).size;

      const start = performance.now();
      const result = parse(markdown);
      const parseTime = performance.now() - start;

      expect(result.success).toBe(true);

      console.log(
         `  ${formatNumber(lineCount)} lines (${formatBytes(fileSize)}): ${parseTime.toFixed(2)}ms (${(fileSize / 1024 / parseTime).toFixed(2)} KB/ms)`,
      );
   }
});

// =============================================================================
// Streaming Performance
// =============================================================================

test("performance: streaming vs full parse", async () => {
   const markdown = generateSimpleMarkdown(10000);

   // Full parse
   const fullStart = performance.now();
   const fullDoc = parseOrThrow(markdown);
   const fullTime = performance.now() - fullStart;

   // Streaming parse
   async function* stringStream(): AsyncGenerator<string> {
      const chunkSize = 1024;
      for (let i = 0; i < markdown.length; i += chunkSize) {
         yield markdown.slice(i, i + chunkSize);
      }
   }

   const streamStart = performance.now();
   const streamDoc = await parseStreamToDocument(stringStream());
   const streamTime = performance.now() - streamStart;

   console.log(`Full parse: ${fullTime.toFixed(2)}ms`);
   console.log(`Stream parse: ${streamTime.toFixed(2)}ms`);
   console.log(`Ratio: ${(streamTime / fullTime).toFixed(2)}x`);

   expect(fullDoc.root.children.length).toBeGreaterThan(0);
   expect(streamDoc.root.children.length).toBeGreaterThan(0);
});

test("performance: streaming event throughput", async () => {
   const markdown = generateSimpleMarkdown(5000);
   let blockCount = 0;

   async function* stringStream(): AsyncGenerator<string> {
      const chunkSize = 512;
      for (let i = 0; i < markdown.length; i += chunkSize) {
         yield markdown.slice(i, i + chunkSize);
      }
   }

   const start = performance.now();
   for await (const event of parseStream(stringStream())) {
      if (event.type === "block") {
         blockCount++;
      }
   }
   const duration = performance.now() - start;

   console.log(
      `Streamed ${formatNumber(blockCount)} blocks in ${duration.toFixed(2)}ms (${formatNumber(Math.round(blockCount / (duration / 1000)))} blocks/s)`,
   );

   expect(blockCount).toBeGreaterThan(0);
});

// =============================================================================
// Edge Cases
// =============================================================================

test("performance: worst case - deep nesting and complexity", () => {
   console.log("\n========== WORST CASE - MAX COMPLEXITY ==========");

   const markdown = generateWorstCaseMarkdown(500);
   const fileSize = new Blob([markdown]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);
   console.log(`Blocks: 500`);

   const result = benchmark("parse-worst-case-500", () => parse(markdown), 10);
   console.log(formatResult(result));

   expect(result.avgMs).toBeLessThan(2000);
});

test("performance: reference links resolution (1000 links)", () => {
   const markdown = generateReferenceLinksMarkdown(1000);

   const result = benchmark("parse-reference-links-1000", () => parse(markdown), 20);
   console.log(formatResult(result));

   const parseResult = parse(markdown);
   expect(parseResult.success).toBe(true);
   expect(result.avgMs).toBeLessThan(500);
});

// =============================================================================
// Large Dataset Scenarios
// =============================================================================

test("performance: medium dataset (~25K lines)", () => {
   console.log("\n========== MEDIUM DATASET (~25K LINES) ==========");

   const markdown = generateSimpleMarkdown(25000);
   const fileSize = new Blob([markdown]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const startMem = process.memoryUsage();
   const startTime = performance.now();

   const result = parse(markdown);
   expect(result.success).toBe(true);
   if (!result.success) return;

   const parseTime = performance.now() - startTime;
   const endMem = process.memoryUsage();

   const doc = result.data;
   const heapUsedMB = (endMem.heapUsed - startMem.heapUsed) / (1024 * 1024);

   console.log(`Parse time: ${parseTime.toFixed(2)}ms`);
   console.log(`Blocks: ${formatNumber(doc.root.children.length)}`);
   console.log(`Heap memory delta: ${heapUsedMB.toFixed(2)} MB`);
   console.log(
      `Throughput: ${(fileSize / (1024 * 1024) / (parseTime / 1000)).toFixed(2)} MB/s`,
   );

   const result2 = benchmark("parse-medium-25k", () => parse(markdown), 5);
   console.log(formatResult(result2));

   expect(parseTime).toBeLessThan(6000);
});

test("performance: large dataset (~50K lines)", () => {
   console.log("\n========== LARGE DATASET (~50K LINES) ==========");

   const markdown = generateSimpleMarkdown(50000);
   const fileSize = new Blob([markdown]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const startMem = process.memoryUsage();
   const startTime = performance.now();

   const result = parse(markdown);
   expect(result.success).toBe(true);
   if (!result.success) return;

   const parseTime = performance.now() - startTime;
   const endMem = process.memoryUsage();

   const doc = result.data;
   const heapUsedMB = (endMem.heapUsed - startMem.heapUsed) / (1024 * 1024);

   console.log(`Parse time: ${parseTime.toFixed(2)}ms`);
   console.log(`Blocks: ${formatNumber(doc.root.children.length)}`);
   console.log(`Heap memory delta: ${heapUsedMB.toFixed(2)} MB`);
   console.log(
      `Throughput: ${(fileSize / (1024 * 1024) / (parseTime / 1000)).toFixed(2)} MB/s`,
   );

   const result2 = benchmark("parse-large-50k", () => parse(markdown), 3);
   console.log(formatResult(result2));

   expect(parseTime).toBeLessThan(15000);
});

test("performance: very large dataset (~100K lines)", () => {
   console.log("\n========== VERY LARGE DATASET (~100K LINES) ==========");

   const markdown = generateSimpleMarkdown(100000);
   const fileSize = new Blob([markdown]).size;

   console.log(`File size: ${formatBytes(fileSize)}`);

   const startMem = process.memoryUsage();
   const startTime = performance.now();

   const result = parse(markdown);
   expect(result.success).toBe(true);
   if (!result.success) return;

   const parseTime = performance.now() - startTime;
   const endMem = process.memoryUsage();

   const doc = result.data;
   const heapUsedMB = (endMem.heapUsed - startMem.heapUsed) / (1024 * 1024);
   const rssUsedMB = (endMem.rss - startMem.rss) / (1024 * 1024);

   console.log(`Parse time: ${parseTime.toFixed(2)}ms`);
   console.log(`Blocks: ${formatNumber(doc.root.children.length)}`);
   console.log(`Heap memory delta: ${heapUsedMB.toFixed(2)} MB`);
   console.log(`RSS memory delta: ${rssUsedMB.toFixed(2)} MB`);
   console.log(
      `Throughput: ${(fileSize / (1024 * 1024) / (parseTime / 1000)).toFixed(2)} MB/s`,
   );
   console.log(
      `Lines/sec: ${formatNumber(Math.round(100000 / (parseTime / 1000)))}`,
   );

   expect(parseTime).toBeLessThan(30000);
   expect(doc.root.children.length).toBeGreaterThan(0);
});

// =============================================================================
// Memory Pressure Test
// =============================================================================

test("performance: memory pressure with multiple large documents", () => {
   console.log("\n========== MEMORY PRESSURE TEST ==========");

   const fileCount = 5;
   const linesPerFile = 10000;
   let totalParseTime = 0;
   let totalBlocks = 0;

   for (let i = 0; i < fileCount; i++) {
      const markdown = generateSimpleMarkdown(linesPerFile);

      const start = performance.now();
      const result = parseOrThrow(markdown);
      const parseTime = performance.now() - start;

      totalParseTime += parseTime;
      totalBlocks += result.root.children.length;

      console.log(`Parsed file ${i + 1}/${fileCount}`);
   }

   const memUsed = process.memoryUsage().heapUsed / (1024 * 1024);

   console.log(`Total files: ${fileCount}`);
   console.log(`Total blocks: ${formatNumber(totalBlocks)}`);
   console.log(`Total parse time: ${totalParseTime.toFixed(2)}ms`);
   console.log(`Memory used: ${memUsed.toFixed(2)} MB`);
   console.log(`Avg memory per file: ${(memUsed / fileCount).toFixed(2)} MB`);

   expect(totalParseTime).toBeLessThan(50000);
});
