# ContentaGen SDK

Official TypeScript SDK for interacting with the ContentaGen API.

## Features
- Lightweight client for ContentaGen API
- Input validation with Zod schemas and shared schema exports
- Automatic date parsing for `createdAt` / `updatedAt`
- Consistent error codes and robust error handling
- Locale support via `x-locale` header for internationalization
- Agent-aware author, content, and related slug helpers
- Streaming AI assistant responses with runtime context awareness
- Image fetch helpers that proxy assets as base64 payloads

## Installation

npm:
```bash
npm install @contentagen/sdk
```

yarn:
```bash
yarn add @contentagen/sdk
```

## Quick Start (TypeScript)

```ts
import { createSdk } from "@contentagen/sdk";

const sdk = createSdk({
	apiKey: "YOUR_API_KEY",
	locale: "en-US", // Optional: sets the x-locale header for all requests
	host: "https://custom.api.example.com", // Optional: custom API host
});

async function example() {
	const agentId = "00000000-0000-0000-0000-000000000000";

	// List content by agent(s)
	const listParams = {
		agentId, // required agent ID
		status: ["approved", "draft"], // optional: string or array, defaults to approved
		limit: 10, // optional, default 10
		page: 1, // optional, default 1
	};
	const list = await sdk.listContentByAgent(listParams);
	// Use list.total and list.posts[0] as needed

	// Get content by slug (use the same agentId you queried with)
	const selectParams = { slug: "my-post-slug", agentId };
	const post = await sdk.getContentBySlug(selectParams);
	// Use post.id, post.meta.title, post.createdAt, post.shareStatus as needed

	// Get related slugs for a post
	const relatedSlugs = await sdk.getRelatedSlugs({ slug: "my-post-slug", agentId });
	// Use relatedSlugs array as needed

	// Get author info by agent ID
	const author = await sdk.getAuthorByAgentId({ agentId });
	// Use author.name and author.profilePhoto as needed

	// Get the image data for a specific content ID
	const image = await sdk.getContentImage({ contentId: post.id });
	// Use image?.contentType and image?.data as needed

	// Get assistant response
	const stream = sdk.streamAssistantResponse({
		message: "Hello, assistant!",
		agentId,
		language: "en", // Optional, defaults to "en"
	});

	for await (const chunk of stream) {
		// Consume streaming chunks as they arrive
	}
}
```

## API

### Exports
- `createSdk(config: { apiKey: string; locale?: string; host?: string }): ContentaGenSDK` — factory for SDK instance
- `ContentaGenSDK` class — all methods available on instances
- `type ShareStatus` — union type: `"private" | "shared"`
- Zod schemas for advanced validation:
  - `ContentListResponseSchema`
  - `ContentSelectSchema`
  - `GetContentBySlugInputSchema`
  - `ListContentByAgentInputSchema`
  - `AuthorByAgentIdSchema`
  - `ImageSchema`
  - `ShareStatusValues`
	- `StreamAssistantResponseInputSchema`

Note: The PostHog helper is currently internal and not exported from the package entry. See "PostHog Analytics Helper" below for usage details when working inside this repository.

### Methods

- `sdk.listContentByAgent(params)`
  - params (validated by `ListContentByAgentInputSchema`):
		- `agentId`: string (UUID) — required
		- `status`: "draft" | "approved" | array of the same — optional, defaults to approved on the API
    - `limit?: number` — optional, default 10, between 1 and 100
    - `page?: number` — optional, default 1, min 1
  - Returns: `Promise<{ posts: Array<{ id, meta, imageUrl, status, shareStatus, createdAt, stats, image }>; total: number }>`

- `sdk.getContentBySlug(params)`
  - params (validated by `GetContentBySlugInputSchema`):
    - `slug`: string — required
    - `agentId`: string (UUID) — required
  - Returns: `Promise<ContentSelect-like object>` (see Types below)

- `sdk.getRelatedSlugs(params)`
  - params: `{ slug: string; agentId: string }`
  - Returns: `Promise<string[]>` (array of related slugs)

- `sdk.getAuthorByAgentId(params)`
  - params: `{ agentId: string }`
  - Returns: `{ name: string; profilePhoto: { data: string; contentType: string } | null }`
  - Note: The agent serves as the author. The returned name and profile photo are derived directly from the agent config.

- `sdk.getContentImage(params)`
  - params: `{ contentId: string }`
  - Returns: `{ data: string; contentType: string } | null`

- `sdk.streamAssistantResponse(params)`
  - params (validated by `StreamAssistantResponseInputSchema`):
    - `message`: string — required
		- `agentId`: string — required
		- `language`: string — optional, defaults to `"en"`
	- Returns: `AsyncGenerator<string>` — yields streaming chunks from the assistant
	- Note: Iterate with `for await ... of` to consume the response stream

### PostHog Analytics Helper

The codebase includes a PostHog helper for tracking blog post views and custom events, designed for build-time frameworks like AstroJS.

Note: In v0.11.0 the helper is not exported through the package entry. If you are working inside this repo (or until a public export is added), import it directly from the source file.

#### Import (internal use in this repo)

```ts
import { createPostHogHelper } from "./src/posthog"; // not exported from the package entry yet
```

#### PostHogHelper Methods

- `posthogHelper.trackBlogPostView(postData)`
  - params: `{ id: string; slug: string; title?: string; agentId: string }`
  - Returns: `string` — HTML script tag to track a blog post view event

#### Event payload

- Includes stable identifiers for the post (`post_id`, `post_slug`) and agent (`agent_id`).
- May include optional metadata such as `post_title`.
- Includes event classification fields and a timestamp.
- Security: JSON payload is escaped for safe HTML injection.

## Types

Shapes shown here reflect the runtime Zod schemas returned by the SDK. Only `ShareStatus` is exported as a type; use the schemas above for runtime validation if needed.

- ContentList
  - posts: Array of summary objects:
    - `id`: string
    - `meta`: { title?: string; description?: string; keywords?: string[]; slug?: string; sources?: string[] }
    - `imageUrl`: string | null
    - `status`: "draft" | "approved"
		- `shareStatus`: "private" | "shared"
    - `stats`: { wordsCount?: string; readTimeMinutes?: string; qualityScore?: string }
    - `createdAt`: Date
    - `image`: { data: string; contentType: string } | null
  - total: number

- ContentSelect
  - `id`: string
  - `agentId`: string
  - `imageUrl`: string | null
  - `body`: string
  - `status`: "draft" | "approved"
	- `shareStatus`: "private" | "shared"
  - `meta`: { title?: string; description?: string; keywords?: string[]; slug?: string; sources?: string[] }
  - `request`: { description: string; layout: "tutorial" | "interview" | "article" | "changelog" }
  - `stats`: { wordsCount?: string; readTimeMinutes?: string; qualityScore?: string }
  - `createdAt`: Date
  - `updatedAt`: Date
  - `image`: { data: string; contentType: string } | null

- AuthorByAgentId
  - `name`: string
  - `profilePhoto`: { data: string; contentType: string } | null

- RelatedSlugsResponse
  - Array of strings (slugs)

- ShareStatus
  - `"private" | "shared"`

## Error Codes
- `SDK_E001`: apiKey is required to initialize the ContentaGenSDK
- `SDK_E002`: API request failed
- `SDK_E003`: Invalid API response format
- `SDK_E004`: Invalid input

## Example with Error Handling

```ts
async function run() {
	try {
		const sdk = createSdk({ apiKey: process.env.CONTENTAGEN_API_KEY! });

		const agentId = "00000000-0000-0000-0000-000000000000";

		const list = await sdk.listContentByAgent({
			agentId,
			status: "approved",
			limit: 5,
			page: 1,
		});

		if (list.total === 0) {
			// Handle no posts found
			return;
		}

		const first = list.posts[0];
		// Use first.id as needed

		const post = await sdk.getContentBySlug({
			slug: first.meta.slug ?? "unknown-slug",
			agentId,
		});

		// Use post.body as needed
	} catch (err) {
		console.error("SDK error:", err);
	}
}
```

## PostHog Analytics Example (internal import in this repo)

```ts
import { createSdk } from "@contentagen/sdk";
import { createPostHogHelper } from "./src/posthog"; // not exported from the package entry yet

const sdk = createSdk({ apiKey: "YOUR_API_KEY" });
const posthogHelper = createPostHogHelper();

// Example usage in AstroJS or other build-time frameworks
async function renderBlogPost(slug: string, agentId: string) {
	// Get post data
	const post = await sdk.getContentBySlug({ slug, agentId });

	// Generate tracking script for blog post view
	const trackViewScript = posthogHelper.trackBlogPostView({
		id: post.id,
		slug: post.meta.slug || slug,
		title: post.meta.title,
		agentId: post.agentId,
	});

	// In AstroJS, inject the tracking script into the page
	return {
		trackingScript: trackViewScript,
		post,
	};
}
```

## Changelog
See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.

## License
Apache License 2.0

## Star History

<a href="https://www.star-history.com/#F-O-T/contentagen-sdk&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=F-O-T/contentagen-sdk&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=F-O-T/contentagen-sdk&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=F-O-T/contentagen-sdk&type=Date" />
 </picture>
</a>
