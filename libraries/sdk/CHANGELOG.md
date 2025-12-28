# Changelog

All notable changes to this package will be documented in this file.

## [0.16.1] - 2025-11-12

### Fixed
- **Locale Type Safety**: Added proper `Locale` type with restricted enum values
  - Created `LocaleSchema` with `z.enum(["en-US", "pt-BR"])` for validation
  - Updated `SdkConfig` interface to use typed `Locale` instead of generic `string`
  - Removed redundant locale header assignment in `streamAssistantResponse` method
  - Improves type safety and ensures only valid locale codes are accepted

## [0.16.0] - 2025-10-21

### Breaking
- **Simplified Stream Assistant Response**: Removed `language` and `agentId` fields from `StreamAssistantResponseInputSchema`
  - Stream assistant response now only requires a `message` parameter
  - Simplified API interface for easier integration
  - Updated method implementation to use default locale ("en") and removed agent-specific routing

### Changed
- **Stream Assistant Response Implementation**: Simplified parameter handling and URL construction
  - Removed agent-specific query parameters from stream requests
  - Simplified locale header handling with default fallback to "en"
  - Updated code formatting for cleaner implementation

## [0.15.10] - 2025-10-18

### Fixed
- **Layout Validation**: Removed "interview" option from ContentRequest layout enum to match API constraints
  - Updated `ContentRequestSchema` to only accept "tutorial", "article", and "changelog" layouts
  - Improves validation accuracy and prevents invalid layout submissions

### Changed
- **Enhanced Publish Script**: Improved `publish-release.ts` with robust publication handling
  - Added retry mechanism with configurable delays and maximum attempts
  - Enhanced error handling to detect when a version is already available on npm
  - Added `waitForPublication` function to verify successful package publication
  - Improved logging and error messaging for better debugging during release process

## [0.15.9] - 2025-10-18

### Changed
- **Documentation Alignment**: Updated README examples and API reference to reflect the current SDK implementation
  - Quick start now uses the normalized `agentId` input and demonstrates streaming consumption
  - Method signatures document the async iterator return type and expanded language handling
  - Share status descriptions now match the SDK's `"private" | "shared"` enum values

## [0.15.8] - 2025-10-18

### Changed
- **Enhanced Content Status Validation**: Improved `ListContentByAgentInputSchema` status field handling
  - Changed from required array to optional field that accepts both single status and array of statuses
  - Added automatic transformation to normalize single status values to arrays
  - Uses dedicated `ContentStatusSchema` for consistent validation messaging
- **Improved Agent ID Validation**: Added `.min(1)` validation to all `agentId` fields with descriptive error messages
  - `ListContentByAgentInputSchema`, `GetContentBySlugInputSchema`, `StreamAssistantResponseInputSchema`
- **Flexible Language Support**: Updated `StreamAssistantResponseInputSchema` language field
  - Changed from enum to string with minimum length validation for broader language support
  - Default value maintained as "en" with `.min(2)` validation
- **Coerced Number Validation**: Updated `limit` and `page` fields to use `.coerce.number()` for automatic string-to-number conversion
  - Improves API usability by accepting string values that get converted to numbers

### Fixed
- **Improved Streaming Implementation**: Enhanced `streamAssistantResponse` method
  - Added proper error handling for network requests with detailed error messages
  - Improved URL construction and query parameter handling
  - Enhanced locale header handling with fallback to language parameter
  - Better stream reading with proper UTF-8 decoding and lock management
  - Added trailing chunk processing for complete data capture
- **URL Construction Fix**: Normalized base URL by removing trailing slashes to prevent double slashes in API endpoints

## [0.15.7] - 2025-10-18

### Fixed
- **UUID Validation Issue**: Changed `agentId` field validation from `z.uuid()` to `z.string()` in multiple schemas
  - Updated `ListContentByAgentInputSchema`, `GetContentBySlugInputSchema`, and `StreamAssistantResponseInputSchema`
  - Resolves UUID validation errors when using string-based agent IDs
  - Maintains compatibility while improving flexibility for agent ID formats

### Added
- **GitHub Issue Templates**: Added comprehensive issue templates for better bug tracking and feature requests
  - `bug-report.yml`: Template for reporting bugs with structured information
  - `feature-request.yml`: Template for proposing new features
  - `general-issue.yml`: Template for general questions and issues
  - `mega-issue.yml`: Template for complex issues requiring detailed information

## [0.15.6] - 2025-10-16

### Added
- **Enhanced Test Scripts**: Added comprehensive test scripts for SDK functionality
  - `test-content-image.ts`: Test script for `getContentImage` functionality with image saving and validation
  - `test-author-by-agent-id.ts`: Test script for `getAuthorByAgentId` functionality with profile photo handling
  - `test-list-content-by-agent.ts`: Test script for `listContentByAgent` functionality with pagination and filtering
  - All scripts include comprehensive error handling, input validation, and detailed output formatting
  - Support for environment variable configuration for API keys and IDs
  - Automatic file export for images and JSON results

### Changed
- **Test Organization**: Improved test script structure and consistency
  - Standardized error handling and output formatting across all test scripts
  - Enhanced troubleshooting guidance and debugging information
  - Better environment variable support for credentials and configuration

## [0.15.5] - 2025-10-15

### Changed
- **Console Log Cleanup**: Removed all console.log statements from SDK methods for cleaner production usage
  - Removed debug logging from constructor, `_get` method, and `streamAssistantResponse` method
  - Removed console.error statements from error handling
  - SDK methods now run silently without console output
  - Updated README examples to remove console.log usage

## [0.15.4] - 2025-10-14

### Fixed
- **streamAssistantResponse Schema**: Updated to use proper output schema instead of input schema
  - Now correctly returns `StreamAssistantResponseOutputSchema` instead of input schema
  - Added `StreamAssistantResponseOutputSchema` to exported schemas for type safety
  - Updated method signature and documentation to reflect correct return type

## [0.15.3] - 2025-10-14

### Changed
- **streamAssistantResponse Method**: Refactored from streaming async generator to simple query method
  - Changed from `AsyncGenerator<string>` to standard `Promise<T>` return type
  - Removed internal streaming logic and now uses the `_query` method
  - Improved consistency with other SDK methods and simplified implementation
  - Updated method signature to return validated response data

## [0.15.2] - 2025-10-14

### Fixed
- **Streaming Implementation**: Simplified `streamAssistantResponse` chunk decoding to match standard streaming patterns
  - Removed `TextDecoder` stream option to prevent UTF-8 sequence issues
  - Simplified chunk handling with direct `new TextDecoder().decode(value)` calls
  - Improved streaming reliability and compatibility

## [0.15.1] - 2025-10-14

### Fixed
- **Streaming Headers**: Fixed `streamAssistantResponse` requests to include proper HTTP headers
  - Added `Accept: text/event-stream` header to properly request streaming responses
  - Added `Content-Type: application/json` header for correct request formatting
  - Resolves "Unsupported Media Type" errors in streaming API calls

## [0.15.0] - 2025-10-14

### Added
- **Locale Support**: New `locale` parameter in SDK constructor to set `x-locale` header for all API requests
  - Supports internationalization by automatically including locale information in HTTP headers
  - Optional parameter that can be set during SDK initialization
- **Custom Host Support**: New `host` parameter in SDK constructor to override default API endpoint
  - Allows usage with different API environments (staging, custom deployments, etc.)
  - Defaults to production API when not specified
- **Enhanced Language Support**: Added `language` field to `streamAssistantResponse` input schema
  - Supports `"en"` (English) and `"pt"` (Portuguese) languages
  - Defaults to `"en"` when not specified
  - Validates language input with proper error messages

### Changed
- **SDK Constructor**: Updated to accept optional `locale` and `host` parameters
- **API Headers**: All requests now include `x-locale` header when locale is configured
- **Stream Assistant Response**: Enhanced with language selection for localized AI responses
- **Default Behavior**: Improved URL resolution to use custom host when provided

### Enhanced
- **Test Coverage**: Added comprehensive tests for locale and host functionality
- **Type Safety**: Updated TypeScript interfaces to reflect new optional parameters
- **Documentation**: Updated README with examples for new configuration options

## [0.14.0] - 2025-10-14

### Added
- **Streaming Assistant Response**: New `streamAssistantResponse` procedure for real-time AI assistant responses
  - `sdk.streamAssistantResponse({ message: string })` method that returns an `AsyncGenerator<string>`
  - Support for streaming text responses from the AI assistant
  - `StreamAssistantResponseInputSchema` for input validation
  - Real-time response processing using async generators
  - Enhanced error handling for streaming connections
- **Updated Documentation**: README updated with streaming method examples and API documentation

### Changed
- **Enhanced API Coverage**: SDK now provides comprehensive access to all ContentaGen API procedures including streaming capabilities

## [0.13.0] - 2025-09-25

### Added
- **Layout Field Support**: Added `layout` field to `ContentRequest` schema and type
- **Enhanced Content Types**: Content requests now support layout specification with options: "tutorial", "interview", "article", "changelog"
- **Updated Documentation**: README and types updated to reflect new layout field functionality
- **Test Coverage**: Updated test suite to validate new layout field requirements

### Changed
- **ContentRequest Schema**: Extended to include mandatory `layout` field alongside existing `description` field
- **Type Definitions**: Updated `ContentRequest` type to enforce layout specification for content creation

## [0.12.0] - 2025-09-23

### Added
- **Enhanced PostHog Analytics Helper**: Comprehensive CTA (Call-to-Action) tracking capabilities
  - `trackCTAClick()`: Track CTA click events with user context and metadata
  - `trackCTAImpression()`: Track when CTAs become visible using IntersectionObserver
  - `trackCTAConversion()`: Track conversion events with revenue attribution and funnel analysis
  - `generateCTATrackingScript()`: Auto-generate complete tracking scripts for CTAs
  - Support for primary, secondary, and tertiary CTA types
  - Automatic session and event ID generation
  - Comprehensive metadata support for advanced analytics
- **Package Export Configuration**: Added dedicated PostHog export via `@contentagen/sdk/posthog`
- **Type Safety Improvements**: Replaced `any` types with `unknown` for better type safety
- **Code Quality**: Fixed deprecated `substr()` methods with modern `substring()` alternatives
- **Comprehensive Test Suite**: Added 50+ test cases covering all new CTA tracking functionality

### Changed
- **PostHog Helper Architecture**: Enhanced to support both blog post and CTA analytics tracking
- **Package Structure**: Added separate export entry for PostHog helper to avoid barrel files

## [0.11.0] - 2025-09-03

### Added
- New `shareStatus` field added to content type and schemas
- Enhanced content data structure to support share status tracking

## [0.10.0] - 2025-09-02

### Added
- New `getContentImage` procedure: fetches image data for a specific content ID
- Enhanced image support across all content-related procedures with consistent `ImageSchema` format
- Comprehensive tests for the new `getContentImage` functionality

### Changed
- Updated all content-related schemas to include image data fields
- Improved type safety with consistent image data structure (`{ data: string, contentType: string }`)
- Enhanced `getAuthorByAgentId` to return profile photos in the new image format

## [0.9.2] - 2025-09-01

### Fixed
- Fixed release script edge case where `extractForVersion` could match partial versions (e.g., searching for "0.9" would incorrectly match "0.9.1" or "0.9.0")
- Fixed backfill mode tag naming inconsistency - now consistently uses "v" prefixed tags for all releases
- Improved version extraction to use exact matching instead of regex partial matching

## [0.9.1] - 2025-09-01
### Security
- Fixed XSS/script-breakout vulnerability in PostHog helper by properly escaping JSON before injection into script tags
- Added comprehensive input sanitization to prevent script injection attacks

## [0.9.0] - 2025-09-01
### Added
- New PostHog analytics helper for tracking blog post views in build-time frameworks like AstroJS
- `createPostHogHelper()` factory function for creating PostHog tracking instances
- `PostHogHelper.trackBlogPostView()` method for generating tracking scripts
- Comprehensive tests for the PostHog helper functionality

### Changed
- Moved PostHog helper to separate `posthog.ts` file for better organization
- Simplified PostHog configuration to only require API key and optional host
- Reduced bundle size by removing unnecessary PostHog initialization code

### Security
- Fixed XSS/script-breakout vulnerability in PostHog helper by properly escaping JSON before injection into script tags

## [0.8.0] - 2025-08-27
### Added
- New `getAuthorByAgentId` procedure: fetches author name and profile photo by agent ID.
- Tests for `getAuthorByAgentId`.

### Breaking
- `getContentBySlug` no longer returns the `agent` field in its response (schema change).

### Changed
- Updated and added tests for all procedures to ensure correct behavior and type safety.

## [0.7.0] - 2025-08-27
### Added
- New `getRelatedSlugs` procedure: fetches related post slugs for a given content slug and agent ID.

### Changed
- `getContentBySlug` now returns the agent persona config in its response.
- Updated and added tests for both procedures to ensure correct behavior and type safety.

## [0.6.0] - 2025-08-20
### Breaking
- Removed deprecated `generating` status from all content-related types, schemas, and API validation. The SDK now only supports `draft` and `approved` statuses for content.

## [0.5.0] - 2025-08-17
### Changed
- Removed `userId` from the return types of content-related API responses for improved privacy and schema clarity.
- Updated `listContentByAgent` input schema to accept an array of agent IDs instead of a single agent ID
- Enhanced date transformation to properly convert ISO strings to Date objects in API responses
- Improved error handling with more descriptive error messages

## [0.4.6] - 2025-08-13
### Changed
- Improved `listContentByAgent`: now supports advanced pagination (`limit` and `page`), status filtering (`draft`, `approved`, `generating`), and stricter input validation via Zod schemas.
- Returns a full content list response including post metadata, image URL, status, and total count.
- See README for updated usage and schema details.

## [0.4.1] - 2025-08-12
### Added
- Added new function `getContentBySlug` to the SDK. This function allows fetching a content item by its slug.

