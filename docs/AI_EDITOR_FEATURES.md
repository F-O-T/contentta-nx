# AI-Powered Editor Features

This document provides a comprehensive technical overview of the AI-powered editing features implemented in the Contentta editor, including **Fill-in-the-Middle (FIM) Completion** and **Agentic Text Editing (Ctrl+K)**.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [FIM (Fill-in-the-Middle) Completion](#fim-fill-in-the-middle-completion)
4. [Agentic Edit (Ctrl+K)](#agentic-edit-ctrlk)
5. [Shared Infrastructure](#shared-infrastructure)
6. [API Reference](#api-reference)
7. [State Management](#state-management)
8. [UI Components](#ui-components)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Configuration](#configuration)
11. [Error Handling](#error-handling)
12. [File Structure](#file-structure)

---

## Overview

The Contentta editor integrates two AI-powered features built on the Lexical editor framework:

| Feature | Trigger | Purpose | Mode |
|---------|---------|---------|------|
| **FIM Completion** | Auto (500ms pause) or `Ctrl+Space` | Continue text at cursor position | Inline ghost text or floating panel |
| **Agentic Edit** | `Ctrl+K` with text selected | Transform selected text based on instructions | Streaming replacement |

Both features use:
- **OpenRouter** as the AI provider
- **Grok-4.1-fast** (`x-ai/grok-4.1-fast`) as the model
- **NDJSON streaming** for real-time responses
- **TanStack Store** for state management

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Dashboard)                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   FIM Plugin    │    │   Edit Plugin   │    │ Content Editor  │  │
│  │  (fim-plugin)   │    │  (edit-plugin)  │    │                 │  │
│  └────────┬────────┘    └────────┬────────┘    └─────────────────┘  │
│           │                      │                                   │
│  ┌────────▼────────┐    ┌────────▼────────┐                         │
│  │  FIM Context    │    │  Edit Context   │  ← TanStack Store       │
│  │  (fim-context)  │    │ (edit-context)  │                         │
│  └────────┬────────┘    └────────┬────────┘                         │
│           │                      │                                   │
│  ┌────────▼────────┐    ┌────────▼────────┐                         │
│  │ useFIMCompletion│    │useEditCompletion│  ← Streaming Hooks      │
│  └────────┬────────┘    └────────┬────────┘                         │
│           │                      │                                   │
│           └──────────┬───────────┘                                   │
│                      │ fetch()                                       │
└──────────────────────┼───────────────────────────────────────────────┘
                       │
┌──────────────────────┼───────────────────────────────────────────────┐
│                      ▼         BACKEND (Server)                      │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                         │
│  │ /api/fim/stream │    │/api/edit/stream │  ← Elysia Routes        │
│  └────────┬────────┘    └────────┬────────┘                         │
│           │                      │                                   │
│  ┌────────▼────────┐    ┌────────▼────────┐                         │
│  │  @packages/fim  │    │ @packages/edit  │  ← Workspace Packages   │
│  │    /server      │    │    /server      │                         │
│  └────────┬────────┘    └────────┬────────┘                         │
│           │                      │                                   │
│           └──────────┬───────────┘                                   │
│                      │                                               │
│              ┌───────▼───────┐                                       │
│              │   OpenRouter  │  ← AI Provider                        │
│              │  (Grok-4.1)   │                                       │
│              └───────────────┘                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## FIM (Fill-in-the-Middle) Completion

### What is FIM?

FIM (Fill-in-the-Middle) is an AI completion technique that generates text to "fill" the gap between existing content. Unlike traditional autocomplete that only considers text before the cursor, FIM considers both:
- **Prefix**: Text before the cursor
- **Suffix**: Text after the cursor

This allows the AI to generate completions that flow naturally into what comes after.

### Trigger Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Auto** | 500ms pause after typing | Triggers automatically when user stops typing |
| **Manual** | `Ctrl+Space` | Forces cursor-tab mode with larger context |

### Display Modes

The FIM system automatically selects a display mode based on completion characteristics:

#### Copilot Mode (Inline Ghost Text)
- **When**: Short completions (≤50 chars), single line, auto-trigger
- **Display**: Semi-transparent inline text at cursor position
- **Accept**: Press `Tab`

#### Cursor-Tab Mode (Floating Panel)
- **When**: Long completions (>50 chars), multi-line, or manual trigger
- **Display**: Floating panel below cursor with full suggestion
- **Accept**: Press `Tab`

### Mode Detection Algorithm

```typescript
function detectFIMMode(completion: string, context: ModeDetectionContext): FIMMode {
  // Manual trigger (Ctrl+Space) → always cursor-tab
  if (context.isManualTrigger) {
    return "cursor-tab";
  }

  // Multi-line content → cursor-tab
  if (completion.includes("\n")) {
    return "cursor-tab";
  }

  // Long completions (>50 chars) → cursor-tab
  if (completion.length > 50) {
    return "cursor-tab";
  }

  // End of paragraph/sentence with moderate length → cursor-tab
  if ((context.isEndOfParagraph || context.isEndOfSentence) && completion.length > 30) {
    return "cursor-tab";
  }

  // Default → copilot (inline ghost text)
  return "copilot";
}
```

### GhostTextNode

A custom Lexical node for displaying inline suggestions:

```typescript
class GhostTextNode extends TextNode {
  __uuid: string;  // Tracks which completion session this belongs to

  createDOM(): HTMLElement {
    const dom = super.createDOM();
    dom.style.opacity = "0.5";
    dom.style.color = "var(--muted-foreground)";
    dom.style.pointerEvents = "none";
    dom.style.userSelect = "none";
    dom.contentEditable = "false";
    return dom;
  }

  // Prevent copying ghost text
  excludeFromCopy(): boolean {
    return true;
  }

  // Prevent text insertion
  canInsertTextBefore(): boolean {
    return false;
  }
}
```

### FIM Request Flow

```
1. User types → 500ms debounce timer starts
2. Timer fires → triggerCompletion() called
3. Extract prefix/suffix from document
4. POST /api/fim/stream with { prefix, suffix, maxTokens, temperature }
5. Stream chunks arrive → append to ghost text node
6. Stream complete → detect mode, show status line
7. User presses Tab → convert ghost text to real text
8. User presses Escape → clear ghost text
```

### Backend Prompt Template

```
You are a writing assistant. Continue the text naturally so it flows
seamlessly into what comes after.

TEXT BEFORE CURSOR:
${prefix}

TEXT AFTER CURSOR:
${suffix}

Write ONLY the continuation (1-2 sentences). Do not repeat the prefix
or include the suffix. Be concise and match the writing style.
```

---

## Agentic Edit (Ctrl+K)

### What is Agentic Edit?

Agentic Edit allows users to select text and transform it using natural language instructions. Similar to Cursor's Ctrl+K feature, it provides an AI-powered inline editing experience.

### User Flow

```
1. User selects text in the editor
2. Hint appears: "Ctrl+K to edit"
3. User presses Ctrl+K
4. Floating prompt appears above selection
5. User types instruction (e.g., "make it more formal")
6. User presses Enter
7. Selected text is deleted
8. AI-generated replacement streams in real-time
9. Streaming text appears in muted color
10. On complete, text becomes normal
11. Cursor positioned at end of new text
```

### Edit Phases

```typescript
type EditPhase = "idle" | "prompting" | "streaming" | "complete";
```

| Phase | Description | UI |
|-------|-------------|-----|
| `idle` | No edit in progress | Selection hint visible |
| `prompting` | Prompt input visible | EditPromptPanel shown |
| `streaming` | AI generating response | Text replacing in muted color |
| `complete` | Edit finished | Cleanup in progress |

### Streaming Replacement Strategy

The edit uses a "delete-then-stream" approach:

```typescript
const handleChunk = (chunk: string) => {
  if (isFirstChunk) {
    // First chunk: delete selection, insert placeholder
    selection.removeText();
    const placeholderNode = $createTextNode(chunk);
    placeholderNode.setStyle("color: var(--muted-foreground)");
    selection.insertNodes([placeholderNode]);
    setEditPlaceholderNodeKey(placeholderNode.getKey());
  } else {
    // Subsequent chunks: append to placeholder
    const node = $getNodeByKey(placeholderNodeKey);
    node.setTextContent(node.getTextContent() + chunk);
  }
};
```

### Context Extraction

The edit system extracts surrounding context to help the AI understand the document:

```typescript
function getDocumentContext() {
  // Extract full document text (excluding ghost nodes)
  // Calculate selection start/end offsets
  // Return:
  return {
    contextBefore: fullText.slice(0, selectionStart),  // Up to 500 chars
    contextAfter: fullText.slice(selectionEnd),        // Up to 200 chars
  };
}
```

### Backend Prompt Template

```
You are a precise text editor. Transform the SELECTED TEXT according to
the user's instruction.

Rules:
1. Output ONLY the transformed text
2. Do not include any explanations, markers, or meta-commentary
3. Do not repeat the context before/after
4. Match the style and tone of the surrounding text
5. If the instruction is unclear, make a reasonable interpretation

CONTEXT BEFORE (for reference only):
${contextBefore}

SELECTED TEXT TO TRANSFORM:
${selectedText}

CONTEXT AFTER (for reference only):
${contextAfter}

INSTRUCTION: ${instruction}

TRANSFORMED TEXT:
```

### Cancellation Behavior

When the user cancels mid-stream (Escape):
- **Partial result is kept** (not rolled back)
- User can Ctrl+Z to undo if needed
- Matches Cursor/VS Code behavior

---

## Shared Infrastructure

### Streaming Protocol

Both features use NDJSON (Newline-Delimited JSON) streaming:

```typescript
// Server yields chunks
for await (const chunk of result.textStream) {
  yield JSON.stringify({ text: chunk, done: false }) + "\n";
}
yield JSON.stringify({ text: "", done: true }) + "\n";

// Client parses chunks
const lines = buffer.split("\n");
for (const line of lines) {
  const chunk = JSON.parse(line);
  if (!chunk.done && chunk.text) {
    onChunk(chunk.text);
  }
}
```

### AbortController Pattern

Both hooks support cancellation:

```typescript
const abortControllerRef = useRef<AbortController | null>(null);

const cancelRequest = () => {
  abortControllerRef.current?.abort();
  abortControllerRef.current = null;
};

const request = async () => {
  cancelRequest();  // Cancel any existing request
  abortControllerRef.current = new AbortController();

  await fetch(url, {
    signal: abortControllerRef.current.signal,
  });
};
```

### Tag-Based Update Filtering

Lexical plugins use tags to prevent update loops:

```typescript
// When updating the editor
editor.update(() => {
  // ... modifications
}, { tag: "fim-ghost-insert" });  // or "edit-streaming"

// In update listener
editor.registerUpdateListener(({ tags }) => {
  if (tags.has("fim-ghost-insert")) return;  // Skip our own updates
  if (tags.has("edit-streaming")) return;
  // Handle user-initiated changes
});
```

---

## API Reference

### FIM Endpoint

```
POST /api/fim/stream
Content-Type: application/json
```

**Request Body:**
```typescript
{
  prefix: string;          // Required, min 1 char
  suffix?: string;         // Default: ""
  contextType?: "document" | "code";  // Default: "document"
  maxTokens?: number;      // 1-256, default: 64
  temperature?: number;    // 0-1, default: 0.3
  stopSequences?: string[];  // Default: ["\n\n", "."]
}
```

**Response:** NDJSON stream
```
{"text": "chunk1", "done": false}
{"text": "chunk2", "done": false}
{"text": "", "done": true}
```

### Edit Endpoint

```
POST /api/edit/stream
Content-Type: application/json
```

**Request Body:**
```typescript
{
  selectedText: string;    // Required, min 1 char, max 4000
  instruction: string;     // Required, min 1 char, max 500
  contextBefore?: string;  // Default: ""
  contextAfter?: string;   // Default: ""
  maxTokens?: number;      // 1-1024, default: 256
  temperature?: number;    // 0-1, default: 0.3
}
```

**Response:** NDJSON stream (same format as FIM)

---

## State Management

### FIM State (TanStack Store)

```typescript
interface FIMState {
  mode: "copilot" | "cursor-tab" | "idle";
  ghostText: string;        // Accumulated completion text
  isVisible: boolean;       // Whether suggestion is showing
  isLoading: boolean;       // Whether request is in progress
  position: {               // For floating panel positioning
    top: number;
    left: number;
    maxWidth?: number;
  } | null;
  completionId: string | null;  // UUID to track current session
}

// Actions
setFIMMode(mode)
setGhostText(text, completionId?)
appendGhostText(chunk)
setFIMPosition(position)
setFIMLoading(isLoading)
startFIMSession(completionId)
completeFIMSession()
clearFIM()
```

### Edit State (TanStack Store)

```typescript
interface EditState {
  phase: "idle" | "prompting" | "streaming" | "complete";
  position: { top: number; left: number } | null;
  selectedText: string;
  instruction: string;
  streamedResult: string;
  originalSelection: {
    anchorKey: string;
    anchorOffset: number;
    focusKey: string;
    focusOffset: number;
  } | null;
  placeholderNodeKey: string | null;
  editId: string | null;
  error: Error | null;
}

// Actions
openEditPrompt({ selectedText, position, originalSelection })
setEditInstruction(instruction)
startEditStreaming()
appendEditStreamedText(chunk)
setEditPlaceholderNodeKey(key)
completeEdit()
cancelEdit()
clearEdit()
```

---

## UI Components

### FIM Components

| Component | Purpose |
|-----------|---------|
| `FIMFloatingPanel` | Displays multi-line suggestions in cursor-tab mode |
| `FIMStatusLine` | Bottom bar showing loading/ready state and hints |
| `FIMKeyboardHints` | Reusable keyboard shortcut hints |
| `GhostTextNode` | Custom Lexical node for inline suggestions |

### Edit Components

| Component | Purpose |
|-----------|---------|
| `EditPromptPanel` | Floating input for edit instructions |
| `EditSelectionHint` | Small hint shown when text is selected |
| `EditKeyboardHints` | Enter to submit, Escape to cancel |

---

## Detailed UX/UI Specifications

### FIM Copilot Mode (Inline Ghost Text)

When the AI generates a short completion (≤50 chars, single line), it appears as inline ghost text:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  The quick brown fox jumps over the|lazy dog and runs away.        │
│                                     ↑                               │
│                              Cursor here                            │
│                                     └── Ghost text (50% opacity)    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  🔄 Suggestion ready  [Copilot]     Tab accept │ Esc dismiss        │
└─────────────────────────────────────────────────────────────────────┘
```

**Visual Styling:**
```css
.ghost-text {
  opacity: 0.5;
  color: var(--muted-foreground);
  pointer-events: none;
  user-select: none;
  content-editable: false;
}
```

**Behavior:**
- Ghost text appears immediately at cursor position
- Text is semi-transparent (50% opacity) with muted color
- Cannot be selected, copied, or edited directly
- Pressing `Tab` converts it to real text
- Pressing `Escape` or typing dismisses it
- Status line shows "Suggestion ready" with [Copilot] badge

---

### FIM Cursor-Tab Mode (Floating Panel)

When the AI generates longer completions (>50 chars or multi-line), a floating panel appears:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  The quick brown fox|                                               │
│                     ↑                                               │
│              Cursor here                                            │
│                     │                                               │
│    ┌────────────────▼──────────────────────────────────────┐        │
│    │ jumps over the lazy dog. The dog was sleeping        │        │
│    │ peacefully under the old oak tree when suddenly      │        │
│    │ it heard footsteps approaching from the forest.      │        │
│    │                                                       │        │
│    │ ─────────────────────────────────────────────────     │        │
│    │ Tab accept │ Esc dismiss │ Ctrl+Space trigger         │        │
│    └───────────────────────────────────────────────────────┘        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  🔄 Suggestion ready  [Tab]         Tab accept │ Esc dismiss        │
└─────────────────────────────────────────────────────────────────────┘
```

**Panel Specifications:**

| Property | Value |
|----------|-------|
| Position | 24px below cursor line |
| Max Width | min(container width - left - 16px, 400px) |
| Max Height | 192px (scrollable) |
| Background | `bg-popover/95` (95% opacity) |
| Border | Standard border with rounded corners (`rounded-lg`) |
| Shadow | `shadow-lg` |
| Blur | `backdrop-blur-sm` |
| Z-Index | 50 |

**Animation:**
```css
/* Entry animation */
animation: fade-in-0 zoom-in-95 slide-in-from-top-2;
duration: 150ms;
```

**Panel Structure:**
```
┌─────────────────────────────────────────────┐
│  Suggestion Text                            │  ← Pre-wrapped text
│  (scrollable if > 192px)                    │    font-sans, text-sm
│                                             │    text-foreground/80
├─────────────────────────────────────────────┤
│  ─────────────────────────────              │  ← Separator (border-t)
├─────────────────────────────────────────────┤
│  [Tab] accept │ [Esc] dismiss │ [Ctrl+Space]│  ← Keyboard hints
└─────────────────────────────────────────────┘
```

---

### FIM Status Line

A persistent status bar at the bottom of the editor:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Editor Content                               │
│                                                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  🔄 Generating...                                                   │  ← Loading state
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        Editor Content                               │
│                                                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Suggestion ready [Copilot]         Tab accept │ Esc dismiss        │  ← Ready state
└─────────────────────────────────────────────────────────────────────┘
```

**Status Line Specifications:**

| State | Left Content | Right Content |
|-------|--------------|---------------|
| Loading | 🔄 spinner + "Generating..." | - |
| Ready (Copilot) | "Suggestion ready" + `[Copilot]` badge | Keyboard hints |
| Ready (Tab) | "Suggestion ready" + `[Tab]` badge | Keyboard hints |

**Styling:**
```css
.status-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid border;
  background: bg-muted/80;
  backdrop-blur: blur-sm;
  padding: 6px 12px;
  font-size: 12px;
  color: text-muted-foreground;
}

.mode-badge {
  background: bg-primary/10;
  color: text-primary;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}
```

---

### Agentic Edit - Selection Hint

When user selects text (≥3 characters), a small hint appears above the selection:

```
         ┌──────────────────────────┐
         │ ✨ [Ctrl+K] to edit      │  ← Floating hint
         └──────────────────────────┘
                     ▲
    The quick [brown fox jumps over] the lazy dog.
               └────────────────────┘
                   Selected text
```

**Hint Specifications:**

| Property | Value |
|----------|-------|
| Position | 32px above selection start |
| Trigger | Selection of 3+ characters |
| Background | `bg-popover/95` |
| Border | Standard border with `rounded-md` |
| Shadow | `shadow-md` |
| Z-Index | 40 |
| Icon | Sparkles (✨) in primary color |

**Animation:**
```css
animation: fade-in-0 zoom-in-95 slide-in-from-bottom-1;
duration: 150ms;
```

**Hint disappears when:**
- Selection is cleared
- Edit prompt is opened
- User starts typing

---

### Agentic Edit - Prompt Panel

When user presses `Ctrl+K`, the edit prompt appears above the selection:

```
         ┌─────────────────────────────────────────────┐
         │ ✨ │ Describe your edit...              │🔄 │  ← Input field
         ├─────────────────────────────────────────────┤
         │ ─────────────────────────────────────────── │
         │ [Enter] submit │ [Esc] cancel               │  ← Keyboard hints
         └─────────────────────────────────────────────┘
                              ▲
    The quick [brown fox jumps over] the lazy dog.
               └────────────────────┘
                   Selected text (to be replaced)
```

**Prompt Panel Specifications:**

| Property | Value |
|----------|-------|
| Position | 56px above selection start |
| Left Offset | max(16px, selection.left - 100px) |
| Width | min(container width - 32px, 400px) |
| Background | `bg-popover/95` |
| Border | Standard border with `rounded-lg` |
| Shadow | `shadow-lg` |
| Blur | `backdrop-blur-sm` |
| Z-Index | 50 |
| Auto-focus | Yes (50ms delay) |

**Animation:**
```css
animation: fade-in-0 zoom-in-95 slide-in-from-bottom-2;
duration: 150ms;
```

**Panel Structure:**
```
┌─────────────────────────────────────────────────┐
│  ✨  │  Input Field                         │ 🔄│  ← Row with icon, input, loader
│      │  placeholder: "Describe your edit..." │   │
├─────────────────────────────────────────────────┤
│  ───────────────────────────────────────────    │  ← Separator
├─────────────────────────────────────────────────┤
│  [Enter] submit │ [Esc] cancel                  │  ← Keyboard hints
└─────────────────────────────────────────────────┘
```

**States:**

| State | Icon | Input | Loader |
|-------|------|-------|--------|
| Idle | ✨ Sparkles (primary) | Enabled | Hidden |
| Streaming | ✨ Sparkles (primary) | Disabled | Visible (spinning) |

---

### Agentic Edit - Streaming Replacement

During streaming, the selected text is replaced with AI-generated text in real-time:

```
Before:
    The quick [brown fox jumps over] the lazy dog.
               └────────────────────┘
                   Selected text

During streaming (muted color):
    The quick elegant wolf leaps acr█ the lazy dog.
              └─────────────────────┘
              Streaming text (muted color, appears character by character)

After complete (normal color):
    The quick elegant wolf leaps across the lazy dog.█
              └────────────────────────────┘
              Final text (normal color, cursor at end)
```

**Streaming Text Styling:**
```css
/* During streaming */
.streaming-placeholder {
  color: var(--muted-foreground);
}

/* After complete */
.streaming-placeholder {
  color: inherit;  /* Normal text color */
}
```

**Streaming Flow:**
1. First chunk arrives → Delete selection → Insert placeholder node with chunk
2. Subsequent chunks → Append to placeholder node
3. Stream complete → Remove muted styling → Position cursor at end

---

### Keyboard Hint Components

**FIM Keyboard Hints (`FIMKeyboardHints`):**
```
┌────────────────────────────────────────────────────────────────┐
│  [Tab] accept  │  [Esc] dismiss  │  [Ctrl+Space] trigger       │
└────────────────────────────────────────────────────────────────┘
     ↑                   ↑                      ↑
   kbd element      separator            shown in panel variant
```

**Edit Keyboard Hints (`EditKeyboardHints`):**
```
┌────────────────────────────────────────┐
│  [Enter] submit  │  [Esc] cancel       │
└────────────────────────────────────────┘
```

**Kbd Element Styling:**
```css
kbd {
  background: bg-background;
  border: 1px solid border;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 10px;
}
```

---

### Complete User Journey - FIM

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER TYPES                                                       │
│                                                                     │
│    "The quick brown fox|"                                           │
│                        ↑ cursor                                     │
│                                                                     │
│    [500ms debounce starts...]                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. LOADING STATE                                                    │
│                                                                     │
│    "The quick brown fox|"                                           │
│                                                                     │
│    ──────────────────────────────────────────────────────────────   │
│    🔄 Generating...                                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. SUGGESTION READY (Copilot Mode - short completion)               │
│                                                                     │
│    "The quick brown fox| jumps over the lazy dog."                  │
│                         └────────────────────────┘                  │
│                              Ghost text (50% opacity)               │
│                                                                     │
│    ──────────────────────────────────────────────────────────────   │
│    Suggestion ready [Copilot]         Tab accept │ Esc dismiss      │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 4a. PRESS TAB    │ │ 4b. PRESS ESC    │ │ 4c. TYPE MORE    │
│                  │ │                  │ │                  │
│ Ghost text       │ │ Ghost text       │ │ Ghost text       │
│ becomes real     │ │ disappears       │ │ cleared, new     │
│ text             │ │                  │ │ debounce starts  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

### Complete User Journey - Agentic Edit

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER SELECTS TEXT                                                │
│                                                                     │
│    "The quick [brown fox jumps over] the lazy dog."                 │
│               └────────────────────┘                                │
│                    Selection                                        │
│                                                                     │
│         ┌──────────────────────────┐                                │
│         │ ✨ [Ctrl+K] to edit      │  ← Hint appears                │
│         └──────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ User presses Ctrl+K
┌─────────────────────────────────────────────────────────────────────┐
│ 2. PROMPT PANEL OPENS                                               │
│                                                                     │
│         ┌─────────────────────────────────────────────┐             │
│         │ ✨ │ make it more elegant               │   │             │
│         ├─────────────────────────────────────────────┤             │
│         │ [Enter] submit │ [Esc] cancel               │             │
│         └─────────────────────────────────────────────┘             │
│                              ▲                                      │
│    "The quick [brown fox jumps over] the lazy dog."                 │
│               └────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ User presses Enter
┌─────────────────────────────────────────────────────────────────────┐
│ 3. STREAMING STATE                                                  │
│                                                                     │
│         ┌─────────────────────────────────────────────┐             │
│         │ ✨ │ make it more elegant               │ 🔄│             │
│         ├─────────────────────────────────────────────┤             │
│         │ [Enter] submit │ [Esc] cancel               │             │
│         └─────────────────────────────────────────────┘             │
│                                                                     │
│    "The quick elegant wolf leaps acr█ the lazy dog."                │
│              └──────────────────────┘                               │
│              Streaming text (muted color)                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Stream completes
┌─────────────────────────────────────────────────────────────────────┐
│ 4. COMPLETE                                                         │
│                                                                     │
│    "The quick elegant wolf leaps across█ the lazy dog."             │
│              └───────────────────────────┘                          │
│              New text (normal color), cursor at end                 │
│                                                                     │
│    Panel dismissed, ready for more editing                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Animation Specifications

All floating UI elements use consistent animations from Tailwind CSS:

**Entry Animations:**
```css
/* Fade + Zoom + Slide */
.animate-in {
  animation-duration: 150ms;
  animation-fill-mode: both;
}

.fade-in-0 {
  --tw-enter-opacity: 0;
}

.zoom-in-95 {
  --tw-enter-scale: 0.95;
}

.slide-in-from-top-2 {
  --tw-enter-translate-y: -8px;  /* For FIM panel */
}

.slide-in-from-bottom-2 {
  --tw-enter-translate-y: 8px;   /* For Edit prompt */
}

.slide-in-from-bottom-1 {
  --tw-enter-translate-y: 4px;   /* For Selection hint */
}
```

**Exit Animations (when implemented):**
```css
.animate-out {
  animation-duration: 150ms;
}

.fade-out-0 {
  --tw-exit-opacity: 0;
}

.zoom-out-95 {
  --tw-exit-scale: 0.95;
}
```

---

### Color Scheme (Dark/Light Mode Support)

All components use semantic Tailwind colors that adapt to the theme:

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Panel Background | `bg-popover` (white) | `bg-popover` (dark gray) |
| Ghost Text | `text-muted-foreground` (gray) | `text-muted-foreground` (light gray) |
| Primary Icon | `text-primary` (brand color) | `text-primary` (brand color) |
| Borders | `border` (light gray) | `border` (dark gray) |
| Kbd Background | `bg-background` | `bg-background` |

---

## Keyboard Shortcuts

### FIM Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Accept suggestion |
| `Escape` | Dismiss suggestion |
| `Ctrl+Space` | Manually trigger (cursor-tab mode) |

### Edit Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open edit prompt (with text selected) |
| `Enter` | Submit instruction |
| `Escape` | Cancel edit |

---

## Configuration

### Model Configuration

```typescript
// packages/fim/src/server.ts
const FIM_MODEL = "x-ai/grok-4.1-fast";
const MAX_CONTEXT_CHARS = 8000;

// packages/edit/src/server.ts
const EDIT_MODEL = "x-ai/grok-4.1-fast";
const MAX_SELECTION_CHARS = 4000;
const MAX_INSTRUCTION_CHARS = 500;
const MAX_CONTEXT_CHARS = 1000;
```

### Timing Configuration

```typescript
// FIM Plugin
const DEBOUNCE_MS = 500;  // Wait 500ms after typing stops

// Mode detection thresholds
const COPILOT_MAX_LENGTH = 50;      // Max chars for inline mode
const CONTEXT_AWARE_LENGTH = 30;    // Context-based threshold
```

### Environment Variables

```bash
OPENROUTER_API_KEY=your_api_key_here
```

---

## Error Handling

### Error Classes

```typescript
// FIMError
FIMError.modelUnavailable()   // 503
FIMError.contextTooLong()     // 400
FIMError.streamAborted()      // 499
FIMError.rateLimited()        // 429
FIMError.invalidRequest()     // 400

// EditError
EditError.modelUnavailable()  // 503
EditError.selectionTooLong()  // 400
EditError.instructionTooLong() // 400
EditError.streamAborted()     // 499
EditError.rateLimited()       // 429
EditError.invalidRequest()    // 400
```

### Client-Side Error Handling

```typescript
const handleError = (error: Error) => {
  console.error("Error:", error);
  // Clear state but keep any partial result
  clearState();
  // Optionally show toast notification
};
```

---

## File Structure

```
packages/
├── fim/
│   └── src/
│       ├── index.ts          # Re-exports
│       ├── schemas.ts        # FIMRequest, FIMChunk types
│       ├── errors.ts         # FIMError class
│       ├── server.ts         # createFIMStream()
│       └── client.ts         # buildFIMContext(), consumeFIMStream()
│
└── edit/
    └── src/
        ├── index.ts          # Re-exports
        ├── schemas.ts        # EditRequest, EditChunk types
        ├── errors.ts         # EditError class
        ├── server.ts         # createEditStream()
        └── client.ts         # buildEditContext(), consumeEditStream()

apps/
├── server/
│   └── src/
│       └── routes/
│           ├── fim.ts        # /api/fim/stream endpoint
│           └── edit.ts       # /api/edit/stream endpoint
│
└── dashboard/
    └── src/
        └── features/
            └── content/
                ├── context/
                │   ├── fim-context.tsx    # FIM state store
                │   └── edit-context.tsx   # Edit state store
                │
                ├── hooks/
                │   ├── use-fim-completion.ts   # FIM streaming hook
                │   ├── use-fim-mode.ts         # Mode detection
                │   └── use-edit-completion.ts  # Edit streaming hook
                │
                ├── plugins/
                │   ├── fim-plugin.tsx     # FIM Lexical plugin
                │   └── edit-plugin.tsx    # Edit Lexical plugin
                │
                ├── nodes/
                │   └── ghost-text-node.tsx  # Custom Lexical node
                │
                └── ui/
                    ├── fim-floating-panel.tsx
                    ├── fim-status-line.tsx
                    ├── fim-keyboard-hints.tsx
                    ├── edit-prompt-panel.tsx
                    ├── edit-selection-hint.tsx
                    ├── edit-keyboard-hints.tsx
                    └── content-editor.tsx   # Main editor component
```

---

## Future Improvements

### Potential Enhancements

1. **Diff Preview Mode**: Show before/after comparison before accepting edit
2. **Undo Stack Integration**: Better integration with Lexical history
3. **Multi-Selection Edit**: Edit multiple selections simultaneously
4. **Custom Model Selection**: Allow users to choose different AI models
5. **Instruction Templates**: Quick action buttons (Improve, Simplify, Expand)
6. **Analytics**: Track completion acceptance rates
7. **Caching**: Cache common completions for faster response
8. **Offline Mode**: Queue requests when offline

### Known Limitations

1. **Selection Spanning Nodes**: Complex selections may merge into single text node
2. **Formatting Preservation**: Rich formatting may be lost during edit
3. **Long Documents**: Context extraction is limited to prevent token overflow
4. **Concurrent Edits**: Only one edit session at a time

---

## References

- [Lexical Documentation](https://lexical.dev/)
- [TanStack Store](https://tanstack.com/store)
- [OpenRouter API](https://openrouter.ai/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
