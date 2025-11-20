export interface CTAEvent {
	id: string;
	type: "click" | "impression" | "hover" | "conversion";
	ctaId: string;
	ctaText: string;
	ctaType: "primary" | "secondary" | "tertiary";
	placement: string;
	timestamp: string;
	userId?: string;
	sessionId: string;
	metadata?: Record<string, unknown>;
}

export interface CTAConversionEvent {
	cta_id: string;
	conversion_type: "sign_up" | "purchase" | "demo_request" | "trial_start";
	revenue?: number;
	currency?: string;
	timestamp: string;
	user_id?: string;
	session_id: string;
	funnel_steps?: Array<{
		step: string;
		timestamp: string;
		time_from_previous: number;
	}>;
}

export class PostHogHelper {
	public generateSessionId(): string {
		return `session_${Math.random().toString(36).substring(2, 11)}`;
	}

	public generateEventId(): string {
		return `event_${Math.random().toString(36).substring(2, 11)}`;
	}

	private escapeJson(json: string): string {
		return json
			.replace(/</g, "\\u003C")
			.replace(/>/g, "\\u003E")
			.replace(/&/g, "\\u0026")
			.replace(/\u2028/g, "\\u2028")
			.replace(/\u2029/g, "\\u2029");
	}

	trackBlogPostView(postData: {
		id: string;
		slug: string;
		title?: string;
		agentId: string;
	}): string {
		const eventData = {
			post_id: postData.id,
			post_slug: postData.slug,
			post_title: postData.title || "Untitled",
			agent_id: postData.agentId,
			event_type: "blog_post_view",
			timestamp: new Date().toISOString(),
		};

		const payloadJson = this.escapeJson(JSON.stringify(eventData));

		return `<script>
  if (typeof posthog !== 'undefined') {
    posthog.capture('blog_post_view', ${payloadJson});
  }
</script>`;
	}

	trackCTAClick(ctaData: {
		ctaId: string;
		ctaText: string;
		ctaType: "primary" | "secondary" | "tertiary";
		placement: string;
		userId?: string;
		metadata?: Record<string, unknown>;
	}): string {
		const eventData: CTAEvent = {
			id: this.generateEventId(),
			type: "click",
			ctaId: ctaData.ctaId,
			ctaText: ctaData.ctaText,
			ctaType: ctaData.ctaType,
			placement: ctaData.placement,
			timestamp: new Date().toISOString(),
			userId: ctaData.userId,
			sessionId: this.generateSessionId(),
			metadata: ctaData.metadata,
		};

		const payloadJson = this.escapeJson(JSON.stringify(eventData));

		return `<script>
  if (typeof posthog !== 'undefined') {
    posthog.capture('cta_click', ${payloadJson});
  }
</script>`;
	}

	trackCTAImpression(ctaData: {
		ctaId: string;
		ctaText: string;
		ctaType: "primary" | "secondary" | "tertiary";
		placement: string;
		userId?: string;
		metadata?: Record<string, unknown>;
	}): string {
		const eventData: CTAEvent = {
			id: this.generateEventId(),
			type: "impression",
			ctaId: ctaData.ctaId,
			ctaText: ctaData.ctaText,
			ctaType: ctaData.ctaType,
			placement: ctaData.placement,
			timestamp: new Date().toISOString(),
			userId: ctaData.userId,
			sessionId: this.generateSessionId(),
			metadata: ctaData.metadata,
		};

		const payloadJson = this.escapeJson(JSON.stringify(eventData));

		return `<script>
  if (typeof posthog !== 'undefined') {
    posthog.capture('cta_impression', ${payloadJson});
  }
</script>`;
	}

	trackCTAConversion(conversionData: {
		ctaId: string;
		conversionType: "sign_up" | "purchase" | "demo_request" | "trial_start";
		revenue?: number;
		currency?: string;
		userId?: string;
		funnelSteps?: Array<{
			step: string;
			timestamp: string;
			time_from_previous: number;
		}>;
	}): string {
		const eventData: CTAConversionEvent = {
			cta_id: conversionData.ctaId,
			conversion_type: conversionData.conversionType,
			revenue: conversionData.revenue,
			currency: conversionData.currency,
			timestamp: new Date().toISOString(),
			user_id: conversionData.userId,
			session_id: this.generateSessionId(),
			funnel_steps: conversionData.funnelSteps,
		};

		const payloadJson = this.escapeJson(JSON.stringify(eventData));

		return `<script>
  if (typeof posthog !== 'undefined') {
    posthog.capture('cta_conversion', ${payloadJson});
  }
</script>`;
	}

	generateCTATrackingScript(ctaData: {
		ctaId: string;
		ctaText: string;
		ctaType: "primary" | "secondary" | "tertiary";
		placement: string;
		userId?: string;
		metadata?: Record<string, unknown>;
	}): string {
		// Use a single session across both events
		const sessionId = this.generateSessionId();
		const clickEvent: CTAEvent = {
			id: this.generateEventId(),
			type: "click",
			ctaId: ctaData.ctaId,
			ctaText: ctaData.ctaText,
			ctaType: ctaData.ctaType,
			placement: ctaData.placement,
			timestamp: new Date().toISOString(),
			userId: ctaData.userId,
			sessionId,
			metadata: ctaData.metadata,
		};
		const impressionEvent: CTAEvent = {
			id: this.generateEventId(),
			type: "impression",
			ctaId: ctaData.ctaId,
			ctaText: ctaData.ctaText,
			ctaType: ctaData.ctaType,
			placement: ctaData.placement,
			timestamp: new Date().toISOString(),
			userId: ctaData.userId,
			sessionId,
			metadata: ctaData.metadata,
		};
		const clickPayload = this.escapeJson(JSON.stringify(clickEvent));
		const impressionPayload = this.escapeJson(JSON.stringify(impressionEvent));
		const escapedCtaId = ctaData.ctaId
			.replace(/\\/g, '\\\\')
			.replace(/"/g, '\\"')
			.replace(/'/g, "\\'")
			.replace(/</g, '\\x3c')
			.replace(/>/g, '\\x3e')
			.replace(/&/g, '\\x26')
			.replace(/\n/g, '\\n')
			.replace(/\r/g, '\\r')
			.replace(/\u2028/g, '\\u2028')
			.replace(/\u2029/g, '\\u2029');

		return `<script>
// CTA Tracking for ${escapedCtaId}
(function() {
  let setupCalled = false;
  
  function setupCtaTracking() {
    if (setupCalled) return;
    setupCalled = true;
    
    // Track impression when CTA is visible
    const ctaId = ${JSON.stringify(ctaData.ctaId)};
    const escapedSelector = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' 
      ? CSS.escape(ctaId) 
      : ctaId.replace(/["'<>\\&\\n\\r\\u2028\\u2029]/g, function(c) {
          return {
            '"': '\\"',
            "'": "\\'",
            '<': '\\x3c',
            '>': '\\x3e',
            '\\': '\\\\',
            '&': '\\x26',
            '\n': '\\n',
            '\r': '\\r',
            '\u2028': '\\u2028',
            '\u2029': '\\u2029'
          }[c];
        });
    const ctaElement = document.querySelector('[data-cta-id="' + escapedSelector + '"]');
    if (ctaElement) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (typeof posthog !== 'undefined') {
              const impressionPayloadWithTimestamp = { ...${impressionPayload} };
              impressionPayloadWithTimestamp.timestamp = new Date().toISOString();
              posthog.capture('cta_impression', impressionPayloadWithTimestamp);
            }
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      
      observer.observe(ctaElement);
      
      // Track click events
      ctaElement.addEventListener('click', function() {
        if (typeof posthog !== 'undefined') {
          const clickPayloadWithTimestamp = { ...${clickPayload} };
          clickPayloadWithTimestamp.timestamp = new Date().toISOString();
          posthog.capture('cta_click', clickPayloadWithTimestamp);
        }
      });
    }
  }
  
  // Check if DOM is already loaded
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setupCtaTracking();
  } else {
    // Fallback for when script runs before DOM is loaded
    document.addEventListener('DOMContentLoaded', setupCtaTracking);
  }
})();
</script>`;
	}
}

export const createPostHogHelper = (): PostHogHelper => {
	return new PostHogHelper();
};
