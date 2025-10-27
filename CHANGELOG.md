## 0.1.0 (2025-10-21)

This was a version bump only for @packages/contenta-sdk to align it with other projects, there were no code changes.

## 0.14.1 (2025-10-21)

### 🩹 Fixes

- **dashboard:** add missing contenta-sdk package.json to Dockerfile ([f5a6e02a](https://github.com/F-O-T/contentagen-nx/commit/f5a6e02a))

### 🧱 Updated Dependencies

- Updated @packages/brand to 0.10.0
- Updated @packages/files to 0.10.0
- Updated @packages/utils to 0.26.0
- Updated @packages/api to 0.9.1
- Updated @packages/ui to 0.10.0

### ❤️ Thank You

- Manoel

## 0.14.0 (2025-10-18)

### 🚀 Features

- **dashboard:** Use AgentWriterCard for competitor card header ([#386](https://github.com/F-O-T/contentagen-nx/pull/386))
- **agent-card:** extract AgentWriterCard to a separate component ([#376](https://github.com/F-O-T/contentagen-nx/pull/376))
- **competitor:** introduce competitor status tracking ([#373](https://github.com/F-O-T/contentagen-nx/pull/373))
- **dashboard:** Add collapsible sub-menus to sidebar navigation ([#368](https://github.com/F-O-T/contentagen-nx/pull/368))
- **database:** Add Competitor and CompetitorFeature Drizzle ORM sche… ([#363](https://github.com/F-O-T/contentagen-nx/pull/363))
- **content-request-form:** Add layout selection to form ([#362](https://github.com/F-O-T/contentagen-nx/pull/362))
- **content-details:** Add quick actions and new detail cards ([#325](https://github.com/F-O-T/contentagen-nx/pull/325))
- **content-details:** Add query for related slugs ([3de421a6](https://github.com/F-O-T/contentagen-nx/commit/3de421a6))
- **content:** Add related slugs functionality ([#277](https://github.com/F-O-T/contentagen-nx/pull/277))
- **ideas:** Add ideas feature and routing ([#275](https://github.com/F-O-T/contentagen-nx/pull/275))
- **agent:** subscribe to brand knowledge status change ([#274](https://github.com/F-O-T/contentagen-nx/pull/274))
- **dashboard:** implement home page with stats and links ([#233](https://github.com/F-O-T/contentagen-nx/pull/233))
- **content-card:** Add agent writer and dropdown menu ([#231](https://github.com/F-O-T/contentagen-nx/pull/231))
- **deps:** add slugify dependency ([c2d7c681](https://github.com/F-O-T/contentagen-nx/commit/c2d7c681))
- **dashboard:** set organizationId correctly for agent list API ([e7ebccb5](https://github.com/F-O-T/contentagen-nx/commit/e7ebccb5))
- **dashboard:** optimize subscription with useMemo ([7cb7dcf7](https://github.com/F-O-T/contentagen-nx/commit/7cb7dcf7))
- **payment:** Add web search usage ingestion ([#209](https://github.com/F-O-T/contentagen-nx/pull/209))
- **content:** add image URL feature ([#207](https://github.com/F-O-T/contentagen-nx/pull/207))
- **billing:** Implement usage tracking and validation ([#205](https://github.com/F-O-T/contentagen-nx/pull/205))
- **docker:** Add database, redis, openrouter, prompts to Dockerfiles ([5de30f01](https://github.com/F-O-T/contentagen-nx/commit/5de30f01))
- **docker:** Add database package to blog Dockerfile ([af0b0ff9](https://github.com/F-O-T/contentagen-nx/commit/af0b0ff9))
- **ci:** Add packages/sdk and packages/workers to Dockerfiles ([573728f1](https://github.com/F-O-T/contentagen-nx/commit/573728f1))
- **agent-details:** remove prompt card ([7c94a357](https://github.com/F-O-T/contentagen-nx/commit/7c94a357))
- **blog:** add sonner dependency to dashboard ([2f0caac9](https://github.com/F-O-T/contentagen-nx/commit/2f0caac9))
- **deps:** add errors and transactional packages to dashboard ([f457dab1](https://github.com/F-O-T/contentagen-nx/commit/f457dab1))
- **server:** Integrate TRPC and refactor auth/db ([#166](https://github.com/F-O-T/contentagen-nx/pull/166), [#167](https://github.com/F-O-T/contentagen-nx/pull/167), [#168](https://github.com/F-O-T/contentagen-nx/issues/168), [#169](https://github.com/F-O-T/contentagen-nx/issues/169), [#170](https://github.com/F-O-T/contentagen-nx/issues/170), [#171](https://github.com/F-O-T/contentagen-nx/issues/171), [#172](https://github.com/F-O-T/contentagen-nx/issues/172), [#173](https://github.com/F-O-T/contentagen-nx/issues/173), [#174](https://github.com/F-O-T/contentagen-nx/issues/174), [#175](https://github.com/F-O-T/contentagen-nx/issues/175), [#176](https://github.com/F-O-T/contentagen-nx/issues/176), [#177](https://github.com/F-O-T/contentagen-nx/issues/177), [#178](https://github.com/F-O-T/contentagen-nx/issues/178), [#180](https://github.com/F-O-T/contentagen-nx/issues/180), [#181](https://github.com/F-O-T/contentagen-nx/issues/181), [#182](https://github.com/F-O-T/contentagen-nx/issues/182), [#183](https://github.com/F-O-T/contentagen-nx/issues/183), [#184](https://github.com/F-O-T/contentagen-nx/issues/184))
- **posthog:** Refactor PostHog configuration and add server integration ([af9853c4](https://github.com/F-O-T/contentagen-nx/commit/af9853c4))
- **docker:** copy posthog package.json to build contexts ([514bc4f6](https://github.com/F-O-T/contentagen-nx/commit/514bc4f6))
- **billing:** Implement agent slot limits ([#110](https://github.com/F-O-T/contentagen-nx/pull/110))
- **profile:** use product slug for checkout ([4895f261](https://github.com/F-O-T/contentagen-nx/commit/4895f261))
- **router:** Add default preload settings for improved loading behavior ([#99](https://github.com/F-O-T/contentagen-nx/pull/99))
- **server:** Integrate OpenRouter for AI model calls ([#94](https://github.com/F-O-T/contentagen-nx/pull/94))
- **sign-in:** add google sign-in functionality ([263a9d37](https://github.com/F-O-T/contentagen-nx/commit/263a9d37))
- **rag:** Implement Retrieval Augmented Generation functionality ([#90](https://github.com/F-O-T/contentagen-nx/pull/90))
- **dashboard:** Improve agent details and list UI ([#87](https://github.com/F-O-T/contentagen-nx/pull/87))
- **manual-agent-creation-form:** add brand integration to form ([c6644b8b](https://github.com/F-O-T/contentagen-nx/commit/c6644b8b))
- **dashboard:** Add VITE_SERVER_URL and ARCJET_KEY to Dockerfile ([a878265f](https://github.com/F-O-T/contentagen-nx/commit/a878265f))
- **dashboard:** Add ARCJET_KEY to Dockerfile ([649ec6a7](https://github.com/F-O-T/contentagen-nx/commit/649ec6a7))
- **dashboard:** integrate Turndown for HTML to Markdown conversion and enhance content export functionality ([f2e6db67](https://github.com/F-O-T/contentagen-nx/commit/f2e6db67))
- **profile:** enhance preferences section with subscription manageme… ([#58](https://github.com/F-O-T/contentagen-nx/pull/58))
- **PRD:** Update PRD document for v2.0 features ([55580001](https://github.com/F-O-T/contentagen-nx/commit/55580001))
- **dashboard:** add favicon support to root route metadata ([fb0afe36](https://github.com/F-O-T/contentagen-nx/commit/fb0afe36))
- **deps:** update biome to v2.0.6 ([6ef8aeeb](https://github.com/F-O-T/contentagen-nx/commit/6ef8aeeb))
- **deps:** Update @polar-sh/better-auth to catalog:auth ([eecd35fe](https://github.com/F-O-T/contentagen-nx/commit/eecd35fe))
- **profile:** Implement user profile management with billing and preferences ([#37](https://github.com/F-O-T/contentagen-nx/pull/37))
- **docs:** Add Railway configuration and enable server output ([931b5d44](https://github.com/F-O-T/contentagen-nx/commit/931b5d44))
- **theme:** update default theme and storage key ([08b83550](https://github.com/F-O-T/contentagen-nx/commit/08b83550))
- **dashboard:** Implement custom theme provider ([ebb7583c](https://github.com/F-O-T/contentagen-nx/commit/ebb7583c))
- **agent-creation:** Refactor agent creation flow and form logic ([5299dbda](https://github.com/F-O-T/contentagen-nx/commit/5299dbda))
- **dashboard:** Remove sidebar components from root layout ([9d794d7a](https://github.com/F-O-T/contentagen-nx/commit/9d794d7a))
- **dashboard:** Use brand name for app title ([f282f272](https://github.com/F-O-T/contentagen-nx/commit/f282f272))
- **dashboard:** update Dockerfile to build dashboard ([b5d1f257](https://github.com/F-O-T/contentagen-nx/commit/b5d1f257))
- **dashboard:** add ErrorBoundary and Suspense to NavUser ([4f84b387](https://github.com/F-O-T/contentagen-nx/commit/4f84b387))
- **nav-user:** Integrate session data for user display ([8f25aa10](https://github.com/F-O-T/contentagen-nx/commit/8f25aa10))
- **agent-list:** Add hover effect to create agent card ([58c6a3b2](https://github.com/F-O-T/contentagen-nx/commit/58c6a3b2))
- **agent-list:** improve agent list page layout and styling ([439cb9cd](https://github.com/F-O-T/contentagen-nx/commit/439cb9cd))
- **dashboard:** Use dynamic brand name and logo in sidebar ([38684179](https://github.com/F-O-T/contentagen-nx/commit/38684179))
- **layout:** update sidebar structure and routes ([5deb3282](https://github.com/F-O-T/contentagen-nx/commit/5deb3282))
- **layout:** Wrap children in a div with padding ([d2a74e44](https://github.com/F-O-T/contentagen-nx/commit/d2a74e44))
- **dashboard:** Implement dashboard layout and components ([#30](https://github.com/F-O-T/contentagen-nx/pull/30))
- **content:** Add Create Content Form component for agent configuration ([a2eea7e3](https://github.com/F-O-T/contentagen-nx/commit/a2eea7e3))
- **dashboard:** Integrate better-auth for authentication flows ([#24](https://github.com/F-O-T/contentagen-nx/pull/24))
- **agent-list:** Implement agent list page UI and data fetching ([#20](https://github.com/F-O-T/contentagen-nx/pull/20))
- **dashboard:** add radix-ui dependencies ([db850332](https://github.com/F-O-T/contentagen-nx/commit/db850332))
- **waitlist:** implement waitlist form and UI improvements ([2666e26a](https://github.com/F-O-T/contentagen-nx/commit/2666e26a))
- **dashboard:** Enhance dashboard with new components and data structure, update dependencies ([8c4228e9](https://github.com/F-O-T/contentagen-nx/commit/8c4228e9))
- **aliases:** Update component aliases in dashboard ([e844c289](https://github.com/F-O-T/contentagen-nx/commit/e844c289))
- **dashboard:** Add deploy script and wrangler dependency ([70f044da](https://github.com/F-O-T/contentagen-nx/commit/70f044da))
- **agents:** enhance agent creation with validation schema and type definitions ([ac9fea0b](https://github.com/F-O-T/contentagen-nx/commit/ac9fea0b))

### 🩹 Fixes

- **chore:** pin bun version to 1.2.23 in Dockerfiles for consistency ([7d827a09](https://github.com/F-O-T/contentagen-nx/commit/7d827a09))
- **dashboard:** Correct confidence percentage calculation ([f6e9bd1b](https://github.com/F-O-T/contentagen-nx/commit/f6e9bd1b))
- **dashboard:** Simplify empty competitor list message ([1194b19f](https://github.com/F-O-T/contentagen-nx/commit/1194b19f))
- **ideas:** include title in content description ([f9ded03e](https://github.com/F-O-T/contentagen-nx/commit/f9ded03e))
- **content-card:** Improve Credenza layout and button accessibility ([dc0427ed](https://github.com/F-O-T/contentagen-nx/commit/dc0427ed))
- **content:** Use useSuspenseQuery for related slugs ([406d8527](https://github.com/F-O-T/contentagen-nx/commit/406d8527))
- **dashboard:** provide empty array for relatedSlugs query ([2dca037e](https://github.com/F-O-T/contentagen-nx/commit/2dca037e))
- **dashboard:** Add missing newline in Dockerfile ([3791fdf5](https://github.com/F-O-T/contentagen-nx/commit/3791fdf5))
- **routes:** Update asset paths for entry-client.js in SSR configuration ([3736b4e4](https://github.com/F-O-T/contentagen-nx/commit/3736b4e4))
- **server:** Improve logging for client server port and ensure consistent formatting ([4b790415](https://github.com/F-O-T/contentagen-nx/commit/4b790415))
- **dashboard:** Remove unnecessary session validation logic ([b67be910](https://github.com/F-O-T/contentagen-nx/commit/b67be910))
- **docker:** update Dockerfile to copy built application and server.js correctly ([2d5d8c31](https://github.com/F-O-T/contentagen-nx/commit/2d5d8c31))
- **dashboard:** Copy package.json for new packages ([37e8cb30](https://github.com/F-O-T/contentagen-nx/commit/37e8cb30))
- **profile:** Update checkout slug from premium to pro ([708faf44](https://github.com/F-O-T/contentagen-nx/commit/708faf44))
- **agent-list:** place CreateNewAgentButton correctly ([52121634](https://github.com/F-O-T/contentagen-nx/commit/52121634))
- **dashboard:** Remove language select from agent creation form ([91da1e8f](https://github.com/F-O-T/contentagen-nx/commit/91da1e8f))
- **dashboard:** restore favicon metadata entry in root route ([98b2f68c](https://github.com/F-O-T/contentagen-nx/commit/98b2f68c))
- **dashboard:** update favicon metadata to include type attribute ([6e0b4706](https://github.com/F-O-T/contentagen-nx/commit/6e0b4706))
- **favicon:** Update favicon size from 58x58 to 48x48 ([#48](https://github.com/F-O-T/contentagen-nx/pull/48))
- **dashboard:** Copy .output instead of dist in Dockerfile ([638f0eac](https://github.com/F-O-T/contentagen-nx/commit/638f0eac))
- **app-sidebar:** Wrap company name in div for correct styling ([624ee15c](https://github.com/F-O-T/contentagen-nx/commit/624ee15c))
- **dashboard:** Refactor app-sidebar and remove unused components ([2cd69a93](https://github.com/F-O-T/contentagen-nx/commit/2cd69a93))
- **app-sidebar:** Remove unused Sidebar import ([3ec284d2](https://github.com/F-O-T/contentagen-nx/commit/3ec284d2))
- **emails:** Correct image className order ([#28](https://github.com/F-O-T/contentagen-nx/pull/28))
- **deps:** remove unused vaul dependency ([874f7c37](https://github.com/F-O-T/contentagen-nx/commit/874f7c37))

### 🧱 Updated Dependencies

- Updated @packages/authentication to 0.8.0
- Updated @packages/transactional to 0.8.0
- Updated @packages/localization to 0.8.0
- Updated @packages/environment to 0.8.0
- Updated @packages/database to 0.12.0
- Updated @packages/posthog to 0.8.0
- Updated @packages/brand to 0.8.0
- Updated @packages/files to 0.8.0
- Updated @packages/utils to 0.24.0
- Updated @packages/api to 0.9.1
- Updated @packages/ui to 0.8.0

### ❤️ Thank You

- Alessandro Rodrigo @AlessandroRodrigo
- AlessandroRodrigo
- Flávio Prado @flaviohsprado
- flaviohsprado @flaviohsprado
- Manoel
- Manoel Neto @Yorizel

## 0.26.0 (2025-10-16)

### 🚀 Features

- **agents:** implement competitor insights generation and replace summary workflow ([83c90976](https://github.com/F-O-T/contentagen-nx/commit/83c90976))

### 🩹 Fixes

- **chore:** update package dependencies and versions across multiple packages ([adf01381](https://github.com/F-O-T/contentagen-nx/commit/adf01381))
- **agents:** update runtime context to use brandId ([13b4749f](https://github.com/F-O-T/contentagen-nx/commit/13b4749f))

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.7.0
- Updated @packages/localization to 0.7.0
- Updated @packages/environment to 0.7.0
- Updated @packages/database to 0.11.0
- Updated @packages/payment to 0.7.0
- Updated @packages/files to 0.7.0
- Updated @packages/utils to 0.23.0
- Updated @packages/rag to 0.7.0

### ❤️ Thank You

- Manoel

## 0.25.1 (2025-10-15)

### 🩹 Fixes

- **agents:** update runtime context to use brandId ([13b4749f](https://github.com/F-O-T/contentagen-nx/commit/13b4749f))

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.6.0
- Updated @packages/localization to 0.6.0
- Updated @packages/environment to 0.6.0
- Updated @packages/database to 0.10.0
- Updated @packages/payment to 0.6.0
- Updated @packages/files to 0.6.0
- Updated @packages/utils to 0.22.0
- Updated @packages/rag to 0.6.0

### ❤️ Thank You

- Manoel

## 0.25.0 (2025-10-15)

### 🚀 Features

- **agents:** add optional organizationId ([7e720d3b](https://github.com/F-O-T/contentagen-nx/commit/7e720d3b))

### 🩹 Fixes

- **agents:** optimize document chunking strategy and parameters for b… ([#474](https://github.com/F-O-T/contentagen-nx/pull/474))

### ❤️ Thank You

- Manoel
- Manoel Neto @Yorizel

## 0.24.1 (2025-10-14)

### 🩹 Fixes

- **agents:** optimize document chunking strategy and parameters for brand and competitor knowledge ([cd2421cb](https://github.com/F-O-T/contentagen-nx/commit/cd2421cb))

### ❤️ Thank You

- Manoel

## 0.8.1 (2025-10-14)

### 🩹 Fixes

- **api:** remove unnecessary import statement in agent-file.ts ([3b06332](https://github.com/F-O-T/contentagen-nx/commit/3b06332))

### 🧱 Updated Dependencies

- Updated @packages/agents to 0.24.0
- Updated @packages/utils to 0.20.0

### ❤️ Thank You

- Manoel

## 0.24.0 (2025-10-14)

### 🚀 Features

- **agents:** enhance agents with date tool instructions and system prompts ([f20f177](https://github.com/F-O-T/contentagen-nx/commit/f20f177))
- **agents:** add new tools ([87db3df](https://github.com/F-O-T/contentagen-nx/commit/87db3df))
- **agents:** simplify and clarify agent instructions and output formats ([b56898c](https://github.com/F-O-T/contentagen-nx/commit/b56898c))

### 🩹 Fixes

- **agents:** update agents ([6b1fe34](https://github.com/F-O-T/contentagen-nx/commit/6b1fe34))

### 🧱 Updated Dependencies

- Updated @packages/utils to 0.20.0

### ❤️ Thank You

- Manoel

## 0.7.1 (2025-10-14)

### 🩹 Fixes

- **deps:** update @bull-board/api and @bull-board/elysia to version 6.13.0 ([af90b04](https://github.com/F-O-T/contentagen-nx/commit/af90b04))
- **chore:** pin bun version to 1.2.23 in Dockerfiles for consistency ([7d827a0](https://github.com/F-O-T/contentagen-nx/commit/7d827a0))
- **deps:** update @bull-board/elysia version to 6.12.0 ([ab6428d](https://github.com/F-O-T/contentagen-nx/commit/ab6428d))

### 🧱 Updated Dependencies

- Updated @packages/utils to 0.20.0
- Updated @packages/api to 0.8.1

### ❤️ Thank You

- Manoel

## 0.9.1 (2025-10-14)

### 🩹 Fixes

- **dashboard:** set default values from personaConfig for form fields ([a96bcf8](https://github.com/F-O-T/contentagen-nx/commit/a96bcf8))
- **chore:** pin bun version to 1.2.23 in Dockerfiles for consistency ([7d827a0](https://github.com/F-O-T/contentagen-nx/commit/7d827a0))

### 🧱 Updated Dependencies

- Updated @packages/utils to 0.20.0
- Updated @packages/api to 0.8.1

### ❤️ Thank You

- Manoel

## 0.6.1 (2025-10-14)

### 🩹 Fixes

- **chore:** pin bun version to 1.2.23 in Dockerfiles for consistency ([2d7e496](https://github.com/F-O-T/contentagen-nx/commit/2d7e496))

### ❤️ Thank You

- Manoel

## 0.23.0 (2025-10-13)

### 🚀 Features

- **agents:** add competitor intelligence agent and summary workflow ([d11bd5c](https://github.com/F-O-T/contentagen-nx/commit/d11bd5c))

### 🧱 Updated Dependencies

- Updated @packages/database to 0.8.0

### ❤️ Thank You

- Manoel

## 0.9.0 (2025-10-13)

### 🚀 Features

- **dashboard:** add competitors summary card ([316920f](https://github.com/F-O-T/contentagen-nx/commit/316920f))

### 🧱 Updated Dependencies

- Updated @packages/database to 0.8.0
- Updated @packages/api to 0.8.0

### ❤️ Thank You

- Manoel

## 0.22.0 (2025-10-09)

### 🚀 Features

- **agents:** adding new assitant agent ([2e78a1f](https://github.com/F-O-T/contentagen-nx/commit/2e78a1f))

### ❤️ Thank You

- Manoel

## 0.21.0 (2025-10-08)

### 🚀 Features

- **agents:** enhance brand knowledge workflows to save features and documents to database ([0ad2fcf](https://github.com/F-O-T/contentagen-nx/commit/0ad2fcf))

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.7.0
- Updated @packages/database to 0.7.0

### ❤️ Thank You

- Manoel

## 0.20.0 (2025-10-08)

### 🚀 Features

- **agents): chore(agents:** Remove unused lumen.config.json file ([979fa4b](https://github.com/F-O-T/contentagen-nx/commit/979fa4b))

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.6.0
- Updated @packages/localization to 0.6.0
- Updated @packages/environment to 0.6.0
- Updated @packages/database to 0.6.0
- Updated @packages/payment to 0.6.0
- Updated @packages/files to 0.6.0
- Updated @packages/utils to 0.19.0
- Updated @packages/rag to 0.7.0

### ❤️ Thank You

- Manoel

## 0.7.0 (2025-10-08)

### 🚀 Features

- **dashboard:** add transfer agent to organization ([b016c20](https://github.com/F-O-T/contentagen-nx/commit/b016c20))

### 🧱 Updated Dependencies

- Updated @packages/api to 0.6.0

### ❤️ Thank You

- Manoel

## 0.19.0 (2025-10-02)

### 🚀 Features

- **agents:** implement brand and competitor document handling ([3f23b13](https://github.com/F-O-T/contentagen-nx/commit/3f23b13))

### ❤️ Thank You

- Manoel

## 0.18.0 (2025-10-01)

### 🚀 Features

- **agents:** add new tools for content analysis and SEO optimization ([c45b06d](https://github.com/F-O-T/contentagen-nx/commit/c45b06d))
- **agents:** enhance agents with additional tools for improved functionality ([30d317f](https://github.com/F-O-T/contentagen-nx/commit/30d317f))

### 🩹 Fixes

- **agents:** improve error handling messages for various steps ([cbf526b](https://github.com/F-O-T/contentagen-nx/commit/cbf526b))

### ❤️ Thank You

- Manoel

## 0.17.0 (2025-09-29)

### 🚀 Features

- **agents): chore(agents:** Remove unused lumen.config.json file ([979fa4b](https://github.com/F-O-T/contentagen-nx/commit/979fa4b))

### ❤️ Thank You

- Manoel

## 0.16.0 (2025-09-29)

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.4.0
- Updated @packages/environment to 0.4.0
- Updated @packages/database to 0.4.0
- Updated @packages/payment to 0.4.0
- Updated @packages/files to 0.4.0
- Updated @packages/utils to 0.16.0
- Updated @packages/rag to 0.4.0

## 0.15.0 (2025-09-29)

### 🩹 Fixes

- **mastra:** Validate agent output for required fields ([3965695](https://github.com/F-O-T/contentagen-nx/commit/3965695))

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.4.0
- Updated @packages/environment to 0.4.0
- Updated @packages/database to 0.4.0
- Updated @packages/payment to 0.4.0
- Updated @packages/files to 0.4.0
- Updated @packages/utils to 0.15.0
- Updated @packages/rag to 0.4.0

### ❤️ Thank You

- Manoel

## 0.13.0 (2025-09-29)

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.4.0
- Updated @packages/environment to 0.4.0
- Updated @packages/database to 0.4.0
- Updated @packages/payment to 0.4.0
- Updated @packages/files to 0.4.0
- Updated @packages/utils to 0.13.0
- Updated @packages/rag to 0.4.0

## 0.12.0 (2025-09-29)

### 🚀 Features

- Remove content loading display component ([2f532e0](https://github.com/F-O-T/contentagen-nx/commit/2f532e0))
- **dashboard:** Implement multi-step loader for content generation ([3cd4a73](https://github.com/F-O-T/contentagen-nx/commit/3cd4a73))
- Add content status events to content workflows ([80fd188](https://github.com/F-O-T/contentagen-nx/commit/80fd188))

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.4.0
- Updated @packages/environment to 0.4.0
- Updated @packages/database to 0.4.0
- Updated @packages/payment to 0.4.0
- Updated @packages/files to 0.4.0
- Updated @packages/utils to 0.12.0
- Updated @packages/rag to 0.4.0

### ❤️ Thank You

- Manoel


## 0.11.0 (2025-09-27)

### 🚀 Features

- **server:** Add create new content workflow to bullboard ([b603c18](https://github.com/F-O-T/contentagen-nx/commit/b603c18))

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.4.0
- Updated @packages/environment to 0.4.0
- Updated @packages/database to 0.4.0
- Updated @packages/payment to 0.4.0
- Updated @packages/files to 0.4.0
- Updated @packages/utils to 0.11.0
- Updated @packages/rag to 0.4.0

### ❤️ Thank You

- Manoel

## 0.10.0 (2025-09-27)

### 🚀 Features

- **server:** Add create new content workflow to bullboard ([b603c18](https://github.com/F-O-T/contentagen-nx/commit/b603c18))

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.4.0
- Updated @packages/environment to 0.4.0
- Updated @packages/database to 0.4.0
- Updated @packages/payment to 0.4.0
- Updated @packages/files to 0.4.0
- Updated @packages/utils to 0.10.0
- Updated @packages/rag to 0.4.0

### ❤️ Thank You

- Manoel

## 0.8.0 (2025-09-27)

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.4.0
- Updated @packages/environment to 0.4.0
- Updated @packages/database to 0.4.0
- Updated @packages/payment to 0.4.0
- Updated @packages/files to 0.4.0
- Updated @packages/utils to 0.8.0
- Updated @packages/rag to 0.4.0

## 0.6.0 (2025-09-27)

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.4.0
- Updated @packages/environment to 0.4.0
- Updated @packages/database to 0.4.0
- Updated @packages/payment to 0.4.0
- Updated @packages/files to 0.4.0
- Updated @packages/utils to 0.6.0
- Updated @packages/rag to 0.4.0

## 0.5.0 (2025-09-27)

### 🧱 Updated Dependencies

- Updated @packages/server-events to 0.4.0
- Updated @packages/environment to 0.4.0
- Updated @packages/database to 0.4.0
- Updated @packages/payment to 0.4.0
- Updated @packages/files to 0.4.0
- Updated @packages/utils to 0.5.0
- Updated @packages/rag to 0.4.0

## 0.4.0 (2025-09-22)

### 🚀 Features

- Add brand, competitor knowledge and related slugs models ([5cd4b1b](https://github.com/F-O-T/contentagen-nx/commit/5cd4b1b))

### ❤️ Thank You

- Manoel

## 0.3.0 (2025-09-22)

### 🚀 Features

- **landing-page:** Add community, how it works, og-image, discord ([08b23d1](https://github.com/F-O-T/contentagen-nx/commit/08b23d1))
- **landing-page:** Enhance SDK section with code block and copy feature ([743f9bb](https://github.com/F-O-T/contentagen-nx/commit/743f9bb))
- **landing-page:** Add privacy policy and terms of service pages ([321e0fc](https://github.com/F-O-T/contentagen-nx/commit/321e0fc))
- **workers:** impl graceful shutdown for bullmq queues/workers ([15ab5e2](https://github.com/F-O-T/contentagen-nx/commit/15ab5e2))
- **server:** Integrate TRPC and refactor auth/db ([#166](https://github.com/F-O-T/contentagen-nx/pull/166), [#167](https://github.com/F-O-T/contentagen-nx/pull/167), [#168](https://github.com/F-O-T/contentagen-nx/issues/168), [#169](https://github.com/F-O-T/contentagen-nx/issues/169), [#170](https://github.com/F-O-T/contentagen-nx/issues/170), [#171](https://github.com/F-O-T/contentagen-nx/issues/171), [#172](https://github.com/F-O-T/contentagen-nx/issues/172), [#173](https://github.com/F-O-T/contentagen-nx/issues/173), [#174](https://github.com/F-O-T/contentagen-nx/issues/174), [#175](https://github.com/F-O-T/contentagen-nx/issues/175), [#176](https://github.com/F-O-T/contentagen-nx/issues/176), [#177](https://github.com/F-O-T/contentagen-nx/issues/177), [#178](https://github.com/F-O-T/contentagen-nx/issues/178), [#180](https://github.com/F-O-T/contentagen-nx/issues/180), [#181](https://github.com/F-O-T/contentagen-nx/issues/181), [#182](https://github.com/F-O-T/contentagen-nx/issues/182), [#183](https://github.com/F-O-T/contentagen-nx/issues/183), [#184](https://github.com/F-O-T/contentagen-nx/issues/184))
- **posthog:** Update Posthog import path ([e1c2c5a](https://github.com/F-O-T/contentagen-nx/commit/e1c2c5a))
- **docker:** copy posthog package.json to build contexts ([514bc4f](https://github.com/F-O-T/contentagen-nx/commit/514bc4f))
- **billing:** Implement agent slot limits ([#110](https://github.com/F-O-T/contentagen-nx/pull/110))
- **landing-page:** Add new Hero section ([53317dd](https://github.com/F-O-T/contentagen-nx/commit/53317dd))
- **docker:** add ARCJET_KEY argument to Dockerfiles ([1c87fb7](https://github.com/F-O-T/contentagen-nx/commit/1c87fb7))
- **deps:** update biome to v2.0.6 ([6ef8aee](https://github.com/F-O-T/contentagen-nx/commit/6ef8aee))
- **landing-page:** enable prerendering for index page ([6a09d3f](https://github.com/F-O-T/contentagen-nx/commit/6a09d3f))
- **navbar:** Change "Get Started" button text to "Enter waitlist" ([fc14baf](https://github.com/F-O-T/contentagen-nx/commit/fc14baf))
- **landing-page:** add pricing section ([2b3dbea](https://github.com/F-O-T/contentagen-nx/commit/2b3dbea))
- **docs:** Add Railway configuration and enable server output ([931b5d4](https://github.com/F-O-T/contentagen-nx/commit/931b5d4))
- **blog:** Add blog configuration and Dockerfile ([4f61aba](https://github.com/F-O-T/contentagen-nx/commit/4f61aba))
- **landing-page:** Add robots.txt and site URL ([4d65dfd](https://github.com/F-O-T/contentagen-nx/commit/4d65dfd))
- **landing-page:** add sitemap integration ([d055156](https://github.com/F-O-T/contentagen-nx/commit/d055156))
- **landing-page:** update image formats to webp ([9758255](https://github.com/F-O-T/contentagen-nx/commit/9758255))
- **landing-page:** Increase vertical spacing in sections ([a91237d](https://github.com/F-O-T/contentagen-nx/commit/a91237d))
- **common:** Improve several UI components and update database schema ([60c2156](https://github.com/F-O-T/contentagen-nx/commit/60c2156))
- **hero:** remove unnecessary min-h-screen class ([b15beff](https://github.com/F-O-T/contentagen-nx/commit/b15beff))
- **landing:** add canonical URL and improve image loading ([e15879b](https://github.com/F-O-T/contentagen-nx/commit/e15879b))
- **landing:** add meta tags and seo optimization ([8513535](https://github.com/F-O-T/contentagen-nx/commit/8513535))
- **footer:** add brand name to footer ([1eab9e2](https://github.com/F-O-T/contentagen-nx/commit/1eab9e2))
- **landing-page:** Add testimonial section and build your team feature ([a4d3a4d](https://github.com/F-O-T/contentagen-nx/commit/a4d3a4d))
- **waitlist-form:** Enhance form layout and improve accessibility features ([4806b0d](https://github.com/F-O-T/contentagen-nx/commit/4806b0d))
- **landing-page:** Add LogoCloud section and update integrations ([c2ad5d3](https://github.com/F-O-T/contentagen-nx/commit/c2ad5d3))
- **landing-page:** implement mobile menu component ([2f1e2d4](https://github.com/F-O-T/contentagen-nx/commit/2f1e2d4))
- **Navbar:** Implement theme toggler component ([bdd88b3](https://github.com/F-O-T/contentagen-nx/commit/bdd88b3))
- **landing-page:** Introduce Logo component and update SVG ([8946fe5](https://github.com/F-O-T/contentagen-nx/commit/8946fe5))
- **waitlist:** implement waitlist form and UI improvements ([2666e26](https://github.com/F-O-T/contentagen-nx/commit/2666e26))
- **Dockerfile:** add VITE_SERVER_URL build argument ([2c0186a](https://github.com/F-O-T/contentagen-nx/commit/2c0186a))
- **landing-page:** install all bun dependencies ([d9bd701](https://github.com/F-O-T/contentagen-nx/commit/d9bd701))
- **landing-page:** configure server to listen on all interfaces ([2d0ce30](https://github.com/F-O-T/contentagen-nx/commit/2d0ce30))
- **landing-page:** Update Dockerfile for improved build and dependencies ([44b2f69](https://github.com/F-O-T/contentagen-nx/commit/44b2f69))
- **landing-page:** Update Dockerfile and Astro config ([867dd91](https://github.com/F-O-T/contentagen-nx/commit/867dd91))
- **Dockerfile:** optimize build and production stages ([6ecc461](https://github.com/F-O-T/contentagen-nx/commit/6ecc461))
- **landing-page:** Use nodejs image and command in Dockerfile ([df19cfc](https://github.com/F-O-T/contentagen-nx/commit/df19cfc))
- **landing-page:** update Dockerfile and astro config for node adapter ([bc19a1e](https://github.com/F-O-T/contentagen-nx/commit/bc19a1e))
- **landing-page:** add Dockerfile and update astro config ([7714023](https://github.com/F-O-T/contentagen-nx/commit/7714023))
- **landing-page:** Update VITE_SERVER_URL to api.contentagen.com ([3a321cc](https://github.com/F-O-T/contentagen-nx/commit/3a321cc))
- **landing-page:** Add VITE_SERVER_URL environment variable ([7bd4b77](https://github.com/F-O-T/contentagen-nx/commit/7bd4b77))
- **landing-page:** add wrangler types to build ([3654c13](https://github.com/F-O-T/contentagen-nx/commit/3654c13))
- **landing-page:** Use react-dom/server.edge for server output ([6ad5731](https://github.com/F-O-T/contentagen-nx/commit/6ad5731))
- **landing-page:** Update configuration to use VITE_SERVER_URL and clean up WaitlistForm component ([380add6](https://github.com/F-O-T/contentagen-nx/commit/380add6))
- **landing-page:** Add react-dom/server edge alias ([b8e6125](https://github.com/F-O-T/contentagen-nx/commit/b8e6125))
- **landing-page:** Add Cloudflare adapter configuration and KV namespace ([6b02cc8](https://github.com/F-O-T/contentagen-nx/commit/6b02cc8))
- **landing-page:** Remove unnecessary prerender: false ([1297ecd](https://github.com/F-O-T/contentagen-nx/commit/1297ecd))
- **landing-page:** set output to server ([91c8019](https://github.com/F-O-T/contentagen-nx/commit/91c8019))
- **waitlist:** Allow overriding API URL for WaitlistForm ([70ed6ae](https://github.com/F-O-T/contentagen-nx/commit/70ed6ae))
- **landing-page:** add wrangler config and prerender false ([7da5dff](https://github.com/F-O-T/contentagen-nx/commit/7da5dff))
- **landing-page:** Add Cloudflare adapter and disable prerendering ([abdd73b](https://github.com/F-O-T/contentagen-nx/commit/abdd73b))
- **landing-page:** update .assetsignore and tsconfig.json for improved path resolution ([ad49659](https://github.com/F-O-T/contentagen-nx/commit/ad49659))
- **landing-page:** add .assetsignore and update wrangler name ([122af70](https://github.com/F-O-T/contentagen-nx/commit/122af70))
- **landing-page:** add astro.config.mjs and update package.json ([22c73f0](https://github.com/F-O-T/contentagen-nx/commit/22c73f0))
- **biome:** update biome schema and disable unused imports ([1fa54fd](https://github.com/F-O-T/contentagen-nx/commit/1fa54fd))
- **landing-page:** Add new components and update dev scripts ([deeb701](https://github.com/F-O-T/contentagen-nx/commit/deeb701))

### 🩹 Fixes

- **docker:** add missing package.json copy for brand package in Dockerfile ([4deb5d6](https://github.com/F-O-T/contentagen-nx/commit/4deb5d6))
- **favicon:** Update favicon size from 58x58 to 48x48 ([#48](https://github.com/F-O-T/contentagen-nx/pull/48))
- **biome:** Disable unused imports for Astro files ([3e76802](https://github.com/F-O-T/contentagen-nx/commit/3e76802))
- **emails:** Correct image className order ([#28](https://github.com/F-O-T/contentagen-nx/pull/28))
- **landing-page:** Adjust padding for consistent layout ([b2f1a9e](https://github.com/F-O-T/contentagen-nx/commit/b2f1a9e))
- **landing:** Remove unnecessary main tag ([3a80ebe](https://github.com/F-O-T/contentagen-nx/commit/3a80ebe))
- **Footer:** Remove redundant brandConfig import ([8f9389c](https://github.com/F-O-T/contentagen-nx/commit/8f9389c))
- **landing-page:** Remove unused astro components ([b31cb4e](https://github.com/F-O-T/contentagen-nx/commit/b31cb4e))
- **landing:** Add smooth scroll to html tag ([fbf5e0d](https://github.com/F-O-T/contentagen-nx/commit/fbf5e0d))
- **Footer:** Adjust spacing and alignment for footer elements ([488c456](https://github.com/F-O-T/contentagen-nx/commit/488c456))
- **dev:** set specific ports for dev servers ([6c7fd7c](https://github.com/F-O-T/contentagen-nx/commit/6c7fd7c))
- **landing:** Remove unnecessary class from body tag ([784120e](https://github.com/F-O-T/contentagen-nx/commit/784120e))
- **docker:** remove frozen-lockfile from bun install commands ([bb673f6](https://github.com/F-O-T/contentagen-nx/commit/bb673f6))
- **build:** Update Dockerfile to copy bun.lock ([c7d2ceb](https://github.com/F-O-T/contentagen-nx/commit/c7d2ceb))
- **Dockerfile:** update runner base image to oven/bun:latest ([e40a120](https://github.com/F-O-T/contentagen-nx/commit/e40a120))
- **landing-page:** correct CMD in Dockerfile ([ec903fc](https://github.com/F-O-T/contentagen-nx/commit/ec903fc))
- **landing-page:** Use bun for production CMD ([4befed8](https://github.com/F-O-T/contentagen-nx/commit/4befed8))
- **landing-page:** Correctly copy package directories in Dockerfile ([8e8242f](https://github.com/F-O-T/contentagen-nx/commit/8e8242f))
- **Dockerfile:** Correctly copy tooling/typescript directory instead of package.json ([f0ea29e](https://github.com/F-O-T/contentagen-nx/commit/f0ea29e))
- **Dockerfile:** Copy correct build output to image ([dba0b21](https://github.com/F-O-T/contentagen-nx/commit/dba0b21))
- **landing-page:** Correctly copy landing page source code ([76b4c24](https://github.com/F-O-T/contentagen-nx/commit/76b4c24))
- **landing-page:** Remove unused imageService config ([46a3d21](https://github.com/F-O-T/contentagen-nx/commit/46a3d21))
- **landing-page:** Remove unnecessary output config ([e6c529e](https://github.com/F-O-T/contentagen-nx/commit/e6c529e))
- **landing-page:** Use passthrough image service in astro config ([7d1821f](https://github.com/F-O-T/contentagen-nx/commit/7d1821f))
- **landing-page:** Update VITE_SERVER_URL to new deployment ([1c6583b](https://github.com/F-O-T/contentagen-nx/commit/1c6583b))
- **landing-page:** Add default value for VITE_SERVER_URL ([a5edc68](https://github.com/F-O-T/contentagen-nx/commit/a5edc68))
- **landing-page:** Make VITE_SERVER_URL public and client-accessible ([fa9fdea](https://github.com/F-O-T/contentagen-nx/commit/fa9fdea))
- **landing-page:** Update compatibility date and alias for React 19 ([b40dd66](https://github.com/F-O-T/contentagen-nx/commit/b40dd66))

### 🧱 Updated Dependencies

- Updated @packages/posthog to 0.3.0
- Updated @packages/brand to 0.3.0
- Updated @packages/ui to 0.3.0

### ❤️ Thank You

- Alessandro Rodrigo @AlessandroRodrigo
- Manoel
- Manoel Neto @Yorizel

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0]

### Added
- Language support for LLMs output (English and Portuguese) across API, Mastra, and workers
- Real GitHub repository statistics fetching and display on landing page
- Idea generation workflow with dedicated agent
- RAG package with database setup and runtime context
- Tests workflow and localization tests

### Changed
- Migrated documentation to static site using nginx and alpine image with gzip compression and long-term caching
- Improved workflow context propagation for consistent language behavior
- Removed unused RuntimeContext import from workers

### Added
- Content version history: versions card, selectable version rows, and a details modal with line-by-line and inline diffs, changed-fields badges, and change stats.
- Diff viewer and a detailed version modal with clear empty/initial-version states.

### Improved
- Profile photo uploads now replace prior images and are compressed for faster loading.

### Backend
- Full content versioning: new version storage, version APIs, database schema updates, worker flow, and cache invalidation to surface versions in the dashboard.

### Chores
- Added initial CHANGELOG.md.
