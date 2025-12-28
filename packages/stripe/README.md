# @packages/stripe

Stripe integration package for subscription management via better-auth.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Your Stripe secret API key (starts with `sk_`) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signing secret for verifying Stripe events (starts with `whsec_`) |
| `STRIPE_BASIC_PRICE_ID` | No | Price ID for the Basic plan monthly subscription |
| `STRIPE_BASIC_ANNUAL_PRICE_ID` | No | Price ID for the Basic plan annual subscription |
| `STRIPE_PRO_PRICE_ID` | No | Price ID for the Pro plan monthly subscription |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | No | Price ID for the Pro plan annual subscription |

## Setup Guide

### 1. Get Your Stripe Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API keys**
3. Copy your **Secret key** (use test key for development)

### 2. Create Products and Prices in Stripe

1. Go to **Products** in Stripe Dashboard
2. Create two products: "Basic" and "Pro"
3. For each product, create two prices:
   - Monthly recurring price
   - Annual recurring price (with discount)
4. Copy the Price IDs (starts with `price_`)

### 3. Configure Webhook Endpoint

The webhook endpoint is required for Stripe to notify your application about subscription events (payments, cancellations, etc.).

#### Production Setup

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://your-api-domain.com/api/auth/stripe/webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Click on the created webhook to reveal the **Signing secret**
7. Copy the signing secret (starts with `whsec_`) - this is your `STRIPE_WEBHOOK_SECRET`

#### Local Development Setup

Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks to your local server:

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:9876/api/auth/stripe/webhook
```

The CLI will output a webhook signing secret - use this as your local `STRIPE_WEBHOOK_SECRET`.

## How It Works

### Subscription Flow

1. User clicks "Subscribe" on the Plans page
2. `betterAuthClient.subscription.upgrade()` creates a Stripe Checkout session
3. User is redirected to Stripe Checkout to enter payment details
4. After successful payment, Stripe redirects user back to `successUrl`
5. Stripe sends a webhook event to your server
6. better-auth verifies the webhook signature using `STRIPE_WEBHOOK_SECRET`
7. Subscription is saved to database with organization's `referenceId`

### Organization-Level Subscriptions

Subscriptions are tied to organizations, not individual users. When subscribing:

```typescript
await betterAuthClient.subscription.upgrade({
  plan: "pro",
  referenceId: organization.id, // Organization ID
  successUrl: "/plans?success=true",
  cancelUrl: "/plans",
});
```

All members of the organization inherit the same subscription plan.

## Troubleshooting

### Webhook signature verification failed

- Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe Dashboard
- For local development, use the secret provided by `stripe listen` command
- Check that webhook URL is correct and accessible

### Subscription not updating after payment

- Verify webhook endpoint is receiving events (check Stripe Dashboard → Webhooks → Events)
- Check server logs for webhook processing errors
- Ensure all required webhook events are selected

### Checkout redirects but nothing happens

- Webhook might not be configured or is failing
- Check that `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify the subscription table exists in database

