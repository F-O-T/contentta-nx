import { marked } from "marked";
export function removeTitleFromMarkdown(markdown: string): string {
   return markdown.replace(/^#\s+.*\n?/, "");
}

export function extractTitleFromMarkdown(markdown: string): string {
   const match = markdown.match(/^#\s+(.*)/m);
   return match?.[1]?.trim() ?? "";
}

export async function parseMarkdownIntoHtml(markdown: string) {
   return await marked.parse(markdown);
}
export function analyzeContentStructure({ text }: { text: string }) {
   const structure = {
      codeBlocks: (text.match(/```[\s\S]*?```/g) || []).length,
      headings: (text.match(/^#{1,6}\s/gm) || []).length,
      images: (text.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length,
      links: (text.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length,
      lists: (text.match(/^[*\-+]\s/gm) || []).length,
      paragraphs: text
         .split(/\n\s*\n/)
         .filter((p) => !p.match(/^#{1,6}\s|^[*\-+\d]/)).length,
      words: text.split(/\s+/).filter((w) => w.length > 0).length,
   };

   return { structure };
}
