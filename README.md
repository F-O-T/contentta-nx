# Contentta

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

**Contentta** is a modern, open-source CMS with AI-powered editing capabilities—think Cursor, but for content creation. Built on a scalable monorepo architecture, it features an intelligent Lexical-based editor with inline completions, agentic text editing, and a chat assistant to help you write, refine, and publish content faster.

---

## ✨ Key Features

### ✍️ AI-Powered Content Editor

Built on Lexical with deeply integrated AI assistance at multiple levels:

-   **FIM (Fill-in-the-Middle) Completions**:
    -   **Copilot Mode**: Inline ghost text suggestions as you type
    -   **Cursor Tab Mode**: Multi-line floating panel suggestions
    -   **Diff Mode**: Side-by-side replacement previews
    -   Auto-triggers on typing pauses, cursor movement, punctuation, and newlines
    -   Accept with `Tab`, dismiss with `Escape`, manual invoke with `Ctrl+Space`

-   **Inline Edit (Ctrl+K)**:
    -   Select text and press `Ctrl+K` to open a floating prompt
    -   Enter natural language instructions to transform selected text
    -   Streaming AI responses replace the original selection
    -   Full document context awareness for coherent edits

-   **Chat Assistant (Ctrl+L)**:
    -   Opens a right-side chat panel for interactive content discussion
    -   Send selected text as context to the AI
    -   Full document and selection context tracking
    -   Real-time streaming responses


### 📝 Rich Content Management

-   **Block-Based Editor**:
    -   Tables, code blocks, horizontal rules, links, and checklists
    -   Drag-and-drop content organization
    -   Markdown shortcuts with extended transformers
    -   Smart paste handling for format preservation

-   **Content Lifecycle**:
    -   Draft, published, and archived states
    -   Auto-save with debouncing
    -   Bulk operations (delete, publish, archive)

-   **SEO & Metadata**:
    -   Title, description, slug, and keyword management
    -   SEO optimization built into the workflow

### 🤖 AI Writers & Agents

-   **Writer Personas**:
    -   Create custom AI writing personas with profile photos
    -   Define writing guidelines, audience profiles, tone, and style preferences
    -   Associate writers with content for consistent voice

-   **Multi-Agent Orchestration** (Mastra-powered):
    -   **Content Agents**: Editor, Writer, and Reader agents
    -   **Specialized Agents**: Researcher (Tavily web search), Strategist, Document Generator
    -   **Workflows**: Automated article and changelog creation pipelines
    -   **Knowledge Base**: Brand knowledge, competitor analysis, writing guidelines

### 📊 Dashboard & Analytics

-   **Home Dashboard**: Content statistics, quick actions, recent content
-   **Content List**: Data table with search, filtering, sorting, and bulk operations
-   **Writer Management**: Statistics, analytics, and detailed writer pages

### 🔐 Administration & Security

-   **Authentication**:
    -   Email/password and Google OAuth via Better Auth
    -   Magic link authentication
    -   Two-factor authentication (2FA)
    -   Session management with device tracking

-   **Multi-tenant Architecture**:
    -   Organization workspaces
    -   Team management and member invitations
    -   Role-based access control (Owner, Admin, Member)

-   **Settings**:
    -   Profile and security management
    -   Theme switching (Light/Dark/System)
    -   Language support (en-US, pt-BR)
    -   API keys management
    -   Notification preferences
    -   Billing integration (Stripe)

---

## 🚀 Tech Stack

Contentta is a full-stack application built within an **Nx** monorepo using **Bun**.

| Category       | Technology                                                                                                      |
| :------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Frontend**   | **React**, **Vite**, **TypeScript**, **TanStack Router**, **TanStack Query**, **shadcn/ui**, **Tailwind CSS**   |
| **Editor**     | **Lexical** (Rich text editor framework)                                                                        |
| **AI**         | **Vercel AI SDK**, **Mastra** (Agent orchestration)                                                             |
| **Backend**    | **ElysiaJS**, **Bun**, **tRPC**, **Drizzle ORM**, **PostgreSQL**                                                |
| **Auth**       | **Better Auth**                                                                                                 |
| **Jobs**       | **BullMQ**, **Redis**                                                                                           |
| **Storage**    | **MinIO** (S3 compatible for file/media storage)                                                                |
| **Security**   | **Arcjet** (Rate limiting & DDoS protection)                                                                    |
| **Analytics**  | **PostHog**                                                                                                     |
| **Email**      | **Resend** (Transactional emails)                                                                               |
| **Landing**    | **Astro** (Static marketing site)                                                                               |
| **Tooling**    | **Nx**, **Biome**, **Docker**, **Husky**                                                                        |

---

## 📂 Project Structure

This project is a monorepo managed by Nx.

### Apps (`apps/`)

The deployable applications and websites.

```
apps/
├── dashboard/     # React/Vite SPA - main content editor interface
├── server/        # Elysia backend API server
├── worker/        # BullMQ background job processor
└── landing-page/  # Astro marketing website
```

-   **`dashboard`**: The core CMS single-page application (SPA) built with React, featuring the AI-powered content editor with file-based routing via TanStack Router.
-   **`server`**: The ElysiaJS backend server providing the tRPC API, authentication endpoints, AI integrations, and file storage.
-   **`worker`**: Background job processor using BullMQ for handling async tasks like AI processing, email delivery, and content scheduling.
-   **`landing-page`**: Astro-based static marketing site with i18n support (Portuguese/English).

### Packages (`packages/`)

Shared internal libraries organized by concern. All packages use explicit exports in `package.json`.

#### Core Services

| Package          | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| `api`            | tRPC routers and type-safe API layer              |
| `authentication` | Better Auth setup with OAuth, magic links, 2FA    |
| `database`       | Drizzle ORM schemas and repositories              |
| `environment`    | Zod-validated environment variables               |
| `logging`        | Structured logging with Pino and Logtail          |

#### External Integrations

| Package        | Purpose                                |
| -------------- | -------------------------------------- |
| `arcjet`       | Rate limiting and DDoS protection      |
| `cache`        | Redis caching layer                    |
| `files`        | MinIO S3-compatible file storage       |
| `posthog`      | Analytics tracking (client & server)   |
| `queue`        | BullMQ job queue abstractions          |
| `stripe`       | Stripe payments SDK wrapper            |
| `transactional`| React Email templates with Resend      |

#### Feature Modules

| Package        | Purpose                                |
| -------------- | -------------------------------------- |
| `encryption`   | E2E encryption with NaCl (TweetNaCl)   |
| `notifications`| Push notifications and alerts          |
| `workflows`    | Content workflow automation            |

#### Frontend

| Package        | Purpose                                |
| -------------- | -------------------------------------- |
| `localization` | i18next with en-US/pt-BR support       |
| `ui`           | Radix + Tailwind component library     |

#### Utilities

| Package | Purpose                                     |
| ------- | ------------------------------------------- |
| `utils` | Shared utilities (dates, formatting, errors)|

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📜 License

This project is licensed under the Apache-2.0 License. See the [LICENSE.md](LICENSE.md) file for details.
