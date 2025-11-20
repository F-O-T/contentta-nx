# Contenta Assistant Widget

A lightweight, headless React component library for building AI-powered chat interfaces. No CSS included—style it your way.

## Features

- 🎯 **Headless components** - Bring your own styles
- 🔄 **Streaming support** - Real-time AI responses via AsyncIterables
- ⚡ **TypeScript first** - Full type safety out of the box
- 📦 **Tiny bundle** - Zero styling overhead
- 🎨 **Fully customizable** - Complete control over appearance
- 🪝 **React 18+** - Built for modern React

## Installation

Using Bun (recommended)

bun add @contentagen/assistant-widget
Using npm

npm install @contentagen/assistant-widget
Using pnpm

pnpm add @contentagen/assistant-widget
Using yarn

yarn add @contentagen/assistant-widget


## Quick Start

### Basic Chat Component

import { ContentaChat } from '@contentagen/assistant-widget';

function App() {
const handleSendMessage = async function* (message: string, agentId: string) {
// Your streaming API implementation
const response = await fetch(https://api.yourservice.com/chat/${agentId}, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ message })
});

text
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  yield decoder.decode(value);
}

};

return (
<ContentaChat agentId="your-agent-id" sendMessage={handleSendMessage} placeholder="Ask me anything..." autoFocus={true} showTimestamps={true} className="h-screen max-w-2xl mx-auto" />
);
}


### Widget with Popover

import { ContentaWidget } from '@contentagen/assistant-widget';

function App() {
const handleSendMessage = async function* (message: string, agentId: string) {
// Your streaming implementation
// ...
};

return (
<ContentaWidget agentId="your-agent-id" sendMessage={handleSendMessage} placeholder="How can I help?" maxLength={1000} />
);
}

text

## API Reference

### ContentaChat

Full-screen chat interface component.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `agentId` | `string` | ✅ | - | Your AI agent identifier |
| `sendMessage` | `(message: string, agentId: string) => AsyncIterable<string>` | ✅ | - | Async generator function for streaming responses |
| `placeholder` | `string` | ❌ | `"Digite sua mensagem..."` | Input placeholder text |
| `disabled` | `boolean` | ❌ | `false` | Disable the input field |
| `autoFocus` | `boolean` | ❌ | `false` | Auto-focus input on mount |
| `maxLength` | `number` | ❌ | `500` | Maximum message length |
| `showTimestamps` | `boolean` | ❌ | `false` | Show message timestamps |
| `showAvatars` | `boolean` | ❌ | `false` | Show user/assistant avatars |
| `allowMultiline` | `boolean` | ❌ | `true` | Allow multiline messages (Shift+Enter) |
| `className` | `string` | ❌ | `"max-w-md"` | Additional CSS classes |
| `errorMessage` | `string` | ❌ | `"Desculpe, ocorreu um erro..."` | Custom error message |

### ContentaWidget

Chat widget with popover trigger button. Inherits all `ContentaChat` props.

## Styling

This library is **headless** and does not include any CSS. You have complete control over styling using:

- Tailwind CSS classes via `className` prop
- CSS Modules
- Styled Components
- Emotion
- Plain CSS

The components use semantic HTML and follow accessibility best practices.

### Example with Tailwind

<ContentaChat agentId="agent-123" sendMessage={handleSendMessage} className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4" />

text

## TypeScript Support

Full TypeScript definitions are included. Import types as needed:

import type { ContentaChatProps } from '@contentagen/assistant-widget';

const MyComponent: React.FC<ContentaChatProps> = (props) => {
// Your component logic
};

text

## Requirements

- React 18.0.0 or higher
- React DOM 18.0.0 or higher

## License

Apache-2.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using TypeScript, React, and Bun
