export type Diff = [number, string][];
export type LineDiff = {
   type: "add" | "remove" | "context" | "modify";
   lineNumber?: number;
   content: string;
   oldContent?: string; // For modified lines, store the original content
   inlineChanges?: Array<{
      type: "add" | "remove" | "unchanged";
      text: string;
   }>; // Character-level changes within the line
}[];

export function createDiff(text1: string, text2: string): Diff {
   if (text1 === text2) {
      return text1 ? [[0, text1]] : [];
   }

   const len1 = text1.length;
   const len2 = text2.length;
   const minLen = len1 < len2 ? len1 : len2;

   let commonPrefixLength = 0;
   while (
      commonPrefixLength < minLen &&
      text1.charCodeAt(commonPrefixLength) ===
         text2.charCodeAt(commonPrefixLength)
   ) {
      commonPrefixLength++;
   }

   if (commonPrefixLength === len1 && commonPrefixLength === len2) {
      return text1 ? [[0, text1]] : [];
   }

   let commonSuffixLength = 0;
   const maxSuffix =
      len1 - commonPrefixLength < len2 - commonPrefixLength
         ? len1 - commonPrefixLength
         : len2 - commonPrefixLength;
   while (
      commonSuffixLength < maxSuffix &&
      text1.charCodeAt(len1 - 1 - commonSuffixLength) ===
         text2.charCodeAt(len2 - 1 - commonSuffixLength)
   ) {
      commonSuffixLength++;
   }

   const diffs: Diff = [];

   if (commonPrefixLength > 0) {
      diffs.push([0, text1.slice(0, commonPrefixLength)]);
   }

   const text1MidStart = commonPrefixLength;
   const text1MidEnd = len1 - commonSuffixLength;
   if (text1MidEnd > text1MidStart) {
      diffs.push([-1, text1.slice(text1MidStart, text1MidEnd)]);
   }

   const text2MidStart = commonPrefixLength;
   const text2MidEnd = len2 - commonSuffixLength;
   if (text2MidEnd > text2MidStart) {
      diffs.push([1, text2.slice(text2MidStart, text2MidEnd)]);
   }

   if (commonSuffixLength > 0) {
      diffs.push([0, text1.slice(len1 - commonSuffixLength)]);
   }

   return diffs;
}

export function createLineDiff(
   text1: string,
   text2: string,
   contextLines: number = 3,
): LineDiff {
   const lines1 = text1.split("\n");
   const lines2 = text2.split("\n");

   // Create a more sophisticated diff that detects line-level changes
   const lineDiff = computeLineDiff(lines1, lines2);

   // Add inline character-level diffs for modified lines
   const enhancedDiff = lineDiff.map((item) => {
      if (item.type === "modify" && item.oldContent) {
         const inlineChanges = computeInlineChanges(
            item.oldContent,
            item.content,
         );
         return { ...item, inlineChanges };
      }
      return item;
   });

   // If there are no changes, return empty diff
   if (!enhancedDiff.some((item) => item.type !== "context")) {
      return [];
   }

   // Filter to only show changes and surrounding context
   return filterDiffWithContext(enhancedDiff, contextLines);
}

function computeLineDiff(lines1: string[], lines2: string[]): LineDiff {
   const diff: LineDiff = [];
   const len1 = lines1.length;
   const len2 = lines2.length;

   let i = 0,
      j = 0;
   let lineNumber = 1;

   while (i < len1 || j < len2) {
      const line1 = i < len1 ? lines1[i] : undefined;
      const line2 = j < len2 ? lines2[j] : undefined;

      if (line1 === line2 && line1 !== undefined) {
         // Lines are identical
         diff.push({
            content: line1,
            lineNumber: lineNumber,
            type: "context",
         });
         i++;
         j++;
         lineNumber++;
      } else if (line1 !== undefined && line2 !== undefined) {
         // Lines are different - check if it's a modification or replacement
         const similarity = calculateLineSimilarity(line1, line2);

         if (similarity > 0.3) {
            // If lines are similar enough, treat as modification
            diff.push({
               content: line2,
               lineNumber: lineNumber,
               oldContent: line1,
               type: "modify",
            });
            i++;
            j++;
            lineNumber++;
         } else {
            // Treat as separate remove and add operations
            diff.push({
               content: line1,
               lineNumber: lineNumber,
               type: "remove",
            });
            diff.push({
               content: line2,
               lineNumber: lineNumber,
               type: "add",
            });
            i++;
            j++;
            lineNumber++;
         }
      } else if (line1 !== undefined) {
         // Line was removed
         diff.push({
            content: line1,
            lineNumber: lineNumber,
            type: "remove",
         });
         i++;
         lineNumber++;
      } else if (line2 !== undefined) {
         // Line was added
         diff.push({
            content: line2,
            lineNumber: lineNumber,
            type: "add",
         });
         j++;
         lineNumber++;
      }
   }

   return diff;
}

function calculateLineSimilarity(line1: string, line2: string): number {
   const len1 = line1.length;
   const len2 = line2.length;

   if (len1 === 0 && len2 === 0) return 1;
   if (len1 === 0 || len2 === 0) return 0;

   // Simple similarity based on common characters
   let commonChars = 0;
   const minLen = Math.min(len1, len2);

   for (let i = 0; i < minLen; i++) {
      if (line1[i] === line2[i]) {
         commonChars++;
      }
   }

   return commonChars / Math.max(len1, len2);
}

function computeInlineChanges(
   oldText: string,
   newText: string,
): Array<{ type: "add" | "remove" | "unchanged"; text: string }> {
   const charDiff = createDiff(oldText, newText);
   const inlineChanges: Array<{
      type: "add" | "remove" | "unchanged";
      text: string;
   }> = [];

   for (const [op, text] of charDiff) {
      switch (op) {
         case -1:
            inlineChanges.push({ text, type: "remove" });
            break;
         case 1:
            inlineChanges.push({ text, type: "add" });
            break;
         case 0:
            inlineChanges.push({ text, type: "unchanged" });
            break;
      }
   }

   return inlineChanges;
}

function filterDiffWithContext(diff: LineDiff, contextLines: number): LineDiff {
   const filteredDiff: LineDiff = [];
   const changeIndices = new Set<number>();

   // Find all change indices
   for (let idx = 0; idx < diff.length; idx++) {
      if (diff[idx]?.type !== "context") {
         changeIndices.add(idx);
      }
   }

   // Add context around changes
   const includeIndices = new Set<number>();
   for (const changeIdx of changeIndices) {
      for (
         let j = Math.max(0, changeIdx - contextLines);
         j <= Math.min(diff.length - 1, changeIdx + contextLines);
         j++
      ) {
         includeIndices.add(j);
      }
   }

   // Build filtered result
   for (const idx of Array.from(includeIndices).sort((a, b) => a - b)) {
      const item = diff[idx];
      if (item) {
         filteredDiff.push(item);
      }
   }

   return filteredDiff;
}
