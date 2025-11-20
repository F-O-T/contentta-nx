import { beforeEach, describe, expect, it } from "vitest";
import { createPostHogHelper } from "../src/posthog";

describe("PostHogHelper", () => {
	let helper: ReturnType<typeof createPostHogHelper>;

	beforeEach(() => {
		helper = createPostHogHelper();
	});

	describe("trackBlogPostView", () => {
		it("generates tracking script with all required fields", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				title: "My Awesome Post",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			expect(script).toContain("<script>");
			expect(script).toContain("</script>");
			expect(script).toContain("typeof posthog !== 'undefined'");
			expect(script).toContain("posthog.capture");
			expect(script).toContain("blog_post_view");
			expect(script).toContain('"post_id":"post-123"');
			expect(script).toContain('"post_slug":"my-awesome-post"');
			expect(script).toContain('"post_title":"My Awesome Post"');
			expect(script).toContain('"agent_id":"agent-456"');
			expect(script).toContain('"event_type":"blog_post_view"');
			expect(script).toContain('"timestamp"');
			// Verify JSON is properly escaped
			expect(script).toContain("posthog.capture('blog_post_view', {");
		});

		it("handles post without title", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			expect(script).toContain('"post_title":"Untitled"');
		});

		it("includes timestamp in ISO format", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				title: "My Awesome Post",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			const scriptContent = script
				.replace("<script>", "")
				.replace("</script>", "");
			const captureCall = scriptContent.match(
				/posthog\.capture\('blog_post_view', (\{.*\})\)/,
			);
			expect(captureCall).toBeTruthy();

			const eventData = JSON.parse(captureCall?.[1] || "{}");
			expect(eventData.timestamp).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
			);
		});

		it("generates valid escaped JSON in the script", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				title: "My Awesome Post",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			const scriptContent = script
				.replace("<script>", "")
				.replace("</script>", "");
			const captureCall = scriptContent.match(
				/posthog\.capture\('blog_post_view', (\{.*\})\)/,
			);
			expect(captureCall).toBeTruthy();

			const escapedJson = captureCall?.[1] || "{}";
			expect(() => JSON.parse(escapedJson)).not.toThrow();

			const parsed = JSON.parse(escapedJson);
			expect(parsed).toHaveProperty("post_id", "post-123");
			expect(parsed).toHaveProperty("post_slug", "my-awesome-post");
			expect(parsed).toHaveProperty("post_title", "My Awesome Post");
			expect(parsed).toHaveProperty("agent_id", "agent-456");
			expect(parsed).toHaveProperty("event_type", "blog_post_view");
			expect(parsed).toHaveProperty("timestamp");
		});

		it("handles special characters in title", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				title: "My \"Awesome\" Post with 'quotes' and <tags>",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			expect(script).toContain(
				'"post_title":"My \\"Awesome\\" Post with \'quotes\' and \\u003Ctags\\u003E"',
			);
		});

		it("returns a string that can be safely injected into HTML", () => {
			const postData = {
				id: "post-123",
				slug: "my-awesome-post",
				title: "My Awesome Post",
				agentId: "agent-456",
			};

			const script = helper.trackBlogPostView(postData);

			expect(script).toMatch(/^<script>/);
			expect(script).toMatch(/<\/script>$/);
			expect(script).not.toMatch(/<script[^>]*<script/);
			expect(script).not.toMatch(/<\/script[^>]*<\/script/);
		});
	});

	describe("trackCTAClick", () => {
		it("generates tracking script for CTA click events", () => {
			const ctaData = {
				ctaId: "hero-primary",
				ctaText: "Get Started",
				ctaType: "primary" as const,
				placement: "hero",
				userId: "user-123",
				metadata: { page: "homepage" },
			};

			const script = helper.trackCTAClick(ctaData);

			expect(script).toContain("<script>");
			expect(script).toContain("</script>");
			expect(script).toContain("typeof posthog !== 'undefined'");
			expect(script).toContain("posthog.capture");
			expect(script).toContain("cta_click");
			expect(script).toContain('"ctaId":"hero-primary"');
			expect(script).toContain('"ctaText":"Get Started"');
			expect(script).toContain('"ctaType":"primary"');
			expect(script).toContain('"placement":"hero"');
			expect(script).toContain('"userId":"user-123"');
			expect(script).toContain('"type":"click"');
			expect(script).toContain('"sessionId"');
			expect(script).toContain('"timestamp"');
		});

		it("generates unique session and event IDs", () => {
			const ctaData = {
				ctaId: "test-cta",
				ctaText: "Click Me",
				ctaType: "secondary" as const,
				placement: "footer",
			};

			const script1 = helper.trackCTAClick(ctaData);
			const script2 = helper.trackCTAClick(ctaData);

			// Extract session and event IDs from both scripts
			const script1Content = script1.replace(/<script>|<\/script>/g, "");
			const script2Content = script2.replace(/<script>|<\/script>/g, "");

			const event1Match = script1Content.match(/"id":"(event_[^"]+)"/);
			const event2Match = script2Content.match(/"id":"(event_[^"]+)"/);
			const session1Match = script1Content.match(
				/"sessionId":"(session_[^"]+)"/,
			);
			const session2Match = script2Content.match(
				/"sessionId":"(session_[^"]+)"/,
			);

			expect(event1Match?.[1]).toBeTruthy();
			expect(event2Match?.[1]).toBeTruthy();
			expect(session1Match?.[1]).toBeTruthy();
			expect(session2Match?.[1]).toBeTruthy();

			// IDs should be different between calls
			expect(event1Match?.[1]).not.toBe(event2Match?.[1]);
			expect(session1Match?.[1]).not.toBe(session2Match?.[1]);
		});

		it("works without optional userId and metadata", () => {
			const ctaData = {
				ctaId: "hero-primary",
				ctaText: "Get Started",
				ctaType: "tertiary" as const,
				placement: "hero",
			};

			const script = helper.trackCTAClick(ctaData);

			expect(script).toContain('"ctaId":"hero-primary"');
			expect(script).toContain('"ctaText":"Get Started"');
			expect(script).toContain('"ctaType":"tertiary"');
			expect(script).toContain('"placement":"hero"');
			expect(script).toContain('"type":"click"');
			// Should not contain userId or metadata fields
			expect(script).not.toContain('"userId"');
			expect(script).not.toContain('"metadata"');
		});

		it("handles different CTA types", () => {
			const ctaTypes = ["primary", "secondary", "tertiary"] as const;

			ctaTypes.forEach((ctaType) => {
				const ctaData = {
					ctaId: "test-cta",
					ctaText: "Test Button",
					ctaType,
					placement: "test",
				};

				const script = helper.trackCTAClick(ctaData);
				expect(script).toContain(`"ctaType":"${ctaType}"`);
			});
		});
	});

	describe("trackCTAImpression", () => {
		it("generates tracking script for CTA impression events", () => {
			const ctaData = {
				ctaId: "hero-primary",
				ctaText: "Get Started",
				ctaType: "primary" as const,
				placement: "hero",
				metadata: { visible: true },
			};

			const script = helper.trackCTAImpression(ctaData);

			expect(script).toContain("<script>");
			expect(script).toContain("</script>");
			expect(script).toContain("typeof posthog !== 'undefined'");
			expect(script).toContain("posthog.capture");
			expect(script).toContain("cta_impression");
			expect(script).toContain('"ctaId":"hero-primary"');
			expect(script).toContain('"ctaText":"Get Started"');
			expect(script).toContain('"placement":"hero"');
			expect(script).toContain('"type":"impression"');
		});

		it("generates proper event structure for impressions", () => {
			const ctaData = {
				ctaId: "sidebar-cta",
				ctaText: "Learn More",
				ctaType: "secondary" as const,
				placement: "sidebar",
			};

			const script = helper.trackCTAImpression(ctaData);

			const scriptContent = script.replace(/<script>|<\/script>/g, "");
			const captureCall = scriptContent.match(
				/posthog\.capture\('cta_impression', (\{.*\})\)/,
			);
			expect(captureCall).toBeTruthy();

			const eventData = JSON.parse(captureCall?.[1] || "{}");
			expect(eventData).toHaveProperty("id");
			expect(eventData).toHaveProperty("type", "impression");
			expect(eventData).toHaveProperty("ctaId", "sidebar-cta");
			expect(eventData).toHaveProperty("ctaText", "Learn More");
			expect(eventData).toHaveProperty("ctaType", "secondary");
			expect(eventData).toHaveProperty("placement", "sidebar");
			expect(eventData).toHaveProperty("sessionId");
			expect(eventData).toHaveProperty("timestamp");
		});
	});

	describe("trackCTAConversion", () => {
		it("generates tracking script for CTA conversion events", () => {
			const conversionData = {
				ctaId: "hero-primary",
				conversionType: "sign_up" as const,
				revenue: 99.99,
				currency: "USD",
				userId: "user-123",
				funnelSteps: [
					{
						step: "landing_page",
						timestamp: "2023-01-01T10:00:00Z",
						time_from_previous: 0,
					},
				],
			};

			const script = helper.trackCTAConversion(conversionData);

			expect(script).toContain("<script>");
			expect(script).toContain("</script>");
			expect(script).toContain("typeof posthog !== 'undefined'");
			expect(script).toContain("posthog.capture");
			expect(script).toContain("cta_conversion");
			expect(script).toContain('"cta_id":"hero-primary"');
			expect(script).toContain('"conversion_type":"sign_up"');
			expect(script).toContain('"revenue":99.99');
			expect(script).toContain('"currency":"USD"');
			expect(script).toContain('"user_id":"user-123"');
			expect(script).toContain('"session_id"');
		});

		it("works with minimal conversion data", () => {
			const conversionData = {
				ctaId: "test-cta",
				conversionType: "demo_request" as const,
			};

			const script = helper.trackCTAConversion(conversionData);

			expect(script).toContain('"cta_id":"test-cta"');
			expect(script).toContain('"conversion_type":"demo_request"');
			expect(script).toContain('"session_id"');
			expect(script).toContain('"timestamp"');
			// Should not contain optional fields
			expect(script).not.toContain('"revenue"');
			expect(script).not.toContain('"currency"');
			expect(script).not.toContain('"user_id"');
		});

		it("handles different conversion types", () => {
			const conversionTypes = [
				"sign_up",
				"purchase",
				"demo_request",
				"trial_start",
			] as const;

			conversionTypes.forEach((conversionType) => {
				const conversionData = {
					ctaId: "test-cta",
					conversionType,
				};

				const script = helper.trackCTAConversion(conversionData);
				expect(script).toContain(`"conversion_type":"${conversionType}"`);
			});
		});

		it("includes funnel steps when provided", () => {
			const conversionData = {
				ctaId: "test-cta",
				conversionType: "purchase" as const,
				funnelSteps: [
					{
						step: "landing_page",
						timestamp: "2023-01-01T10:00:00Z",
						time_from_previous: 0,
					},
					{
						step: "checkout",
						timestamp: "2023-01-01T10:05:00Z",
						time_from_previous: 300,
					},
				],
			};

			const script = helper.trackCTAConversion(conversionData);

			expect(script).toContain('"funnel_steps"');
			expect(script).toContain('"step":"landing_page"');
			expect(script).toContain('"step":"checkout"');
			expect(script).toContain('"time_from_previous":300');
		});
	});

	describe("generateCTATrackingScript", () => {
		it("generates comprehensive tracking script with click and impression tracking", () => {
			const ctaData = {
				ctaId: "hero-primary",
				ctaText: "Get Started",
				ctaType: "primary" as const,
				placement: "hero",
				metadata: { page: "homepage" },
			};

			const script = helper.generateCTATrackingScript(ctaData);

			expect(script).toContain("<script>");
			expect(script).toContain("</script>");
			expect(script).toContain("DOMContentLoaded");
			expect(script).toContain("IntersectionObserver");
			expect(script).toContain("addEventListener('click'");
			expect(script).toContain('[data-cta-id="');
			expect(script).toContain("cta_click");
			expect(script).toContain("cta_impression");
			expect(script).toContain("threshold: 0.5");

			// Safety assertions to prevent nested or multiple script tags
			expect(script).toMatch(/^<script>/);
			expect(script).toMatch(/<\/script>$/);
			expect(script).not.toMatch(/<script[^>]*<script/);
			expect(script).not.toMatch(/<\/script[^>]*<\/script/);
		});

		it("includes both click and impression event generation", () => {
			const ctaData = {
				ctaId: "test-cta",
				ctaText: "Test Button",
				ctaType: "secondary" as const,
				placement: "test",
			};

			const script = helper.generateCTATrackingScript(ctaData);

			// Should contain both click and impression tracking
			expect(script).toContain("cta_click");
			expect(script).toContain("cta_impression");

			// Should contain the specific CTA ID in the data attribute selector
			expect(script).toContain('[data-cta-id="');

			// Extract sessionIds from both click and impression events
			const scriptContent = script.replace(/<script>|<\/script>/g, "");
			const sessionMatches = scriptContent.match(/"sessionId":"(session_[^"]+)"/g);
			
			expect(sessionMatches).toHaveLength(2);
			expect(sessionMatches?.[0]).toBe(sessionMatches?.[1]);
		});

		it("generates proper DOMContentLoaded and observer setup", () => {
			const ctaData = {
				ctaId: "hero-cta",
				ctaText: "Hero Button",
				ctaType: "primary" as const,
				placement: "hero",
			};

			const script = helper.generateCTATrackingScript(ctaData);

			expect(script).toContain("document.addEventListener('DOMContentLoaded'");
			expect(script).toContain("const ctaElement = document.querySelector");
			expect(script).toContain("const observer = new IntersectionObserver");
			expect(script).toContain("observer.observe(ctaElement)");
			expect(script).toContain("observer.unobserve(entry.target)");
		});

		it("safely escapes CTA ID with characters that could break HTML/script contexts", () => {
			const problematicCtaId = '<div>&"\n/hero-primary';
			const ctaData = {
				ctaId: problematicCtaId,
				ctaText: "Test Button",
				ctaType: "primary" as const,
				placement: "test",
			};

			const script = helper.generateCTATrackingScript(ctaData);

			// Verify the script tag structure is intact
			expect(script).toMatch(/^<script>/);
			expect(script).toMatch(/<\/script>$/);
			
			// Verify no premature script tag injection (before the end of the script)
			const scriptContent = script.replace(/^<script>|<\/script>$/g, '');
			expect(scriptContent).not.toContain('</script>');
			expect(scriptContent).not.toContain('<script');
			
			// Verify the CTA ID appears in a safely escaped form
			expect(script).toContain('\\x3cdiv'); // Escaped <div in comment
			expect(script).toContain('hero-primary');
			
			// Verify the JSON string literal is properly quoted and escaped
			expect(script).toContain('const ctaId = "<div>&\\"\\n/hero-primary";');
			
			// Verify the escaped selector is generated safely
			expect(script).toContain('escapedSelector');
			expect(script).toContain('CSS.escape');
			
			// Verify the script structure is intact and no injection occurred
			expect(script).toMatch(/^<script>/);
			expect(script).toMatch(/<\/script>$/);
			expect(scriptContent).not.toContain('</script>');
			expect(scriptContent).not.toContain('<script');
		});
	});

	describe("ID Generation", () => {
		it("generates properly formatted session IDs", () => {
			const sessionId = helper.generateSessionId();

			expect(sessionId).toMatch(/^session_[a-z0-9]{9}$/);
			expect(sessionId.length).toBe(17); // "session_" + 9 chars
		});

		it("generates properly formatted event IDs", () => {
			const eventId = helper.generateEventId();

			expect(eventId).toMatch(/^event_[a-z0-9]{9}$/);
			expect(eventId.length).toBe(15); // "event_" + 9 chars
		});

		it("generates unique IDs across multiple calls", () => {
			const sessionIds = [];
			const eventIds = [];

			for (let i = 0; i < 10; i++) {
				sessionIds.push(helper.generateSessionId());
				eventIds.push(helper.generateEventId());
			}

			// All IDs should be unique
			expect(new Set(sessionIds).size).toBe(10);
			expect(new Set(eventIds).size).toBe(10);
		});
	});

	describe("JSON Escaping", () => {
		it("properly escapes special characters in CTA text", () => {
			const ctaData = {
				ctaId: "test-cta",
				ctaText: 'Get "Started" & Learn <More>',
				ctaType: "primary" as const,
				placement: "test",
			};

			const script = helper.trackCTAClick(ctaData);

			expect(script).toContain(
				'"ctaText":"Get \\"Started\\" \\u0026 Learn \\u003CMore\\u003E"',
			);
		});

		it("properly escapes special characters in metadata", () => {
			const ctaData = {
				ctaId: "test-cta",
				ctaText: "Test Button",
				ctaType: "primary" as const,
				placement: "test",
				metadata: {
					title: 'Special "Characters" & <Tags>',
					description: "Test & Learn",
				},
			};

			const script = helper.trackCTAClick(ctaData);

			expect(script).toContain("\\u003CTags\\u003E");
			expect(script).toContain('\\"Characters\\"');
			expect(script).toContain("\\u0026");
		});
	});
});
