import type { Polar } from "@polar-sh/sdk";
import type { EventCreateCustomer } from "@polar-sh/sdk/models/components/eventcreatecustomer.js";
export const MODELS = {
   "deepseek-v3.1-terminus": "deepseek/deepseek-chat-v3.1-terminus",
   "grok-4-fast": "x-ai/grok-4-fast",
   "gpt-5-mini": "openai/gpt-5-mini",
} as const;
export const POLAR_BILLING_EVENTS = {
   CREDIT: "credit",
} as const;

export const USAGE_TYPE = {
   LLM: "llm_usage",
   WEB_SEARCH: "web_search",
   RAG_OPERATIONS: "rag_operations",
   DB_OPERATIONS: "db_operations",
} as const;

export const BILLING_CONFIG = {
   rag_usage: 0.05,
   llmPricePerMillionTokens: 2.5, // $2.5 per 1M tokens
   webSearchCost: 0.0008, // $0.08 cents per search
};

interface IngestBillingParams {
   externalCustomerId: string;
   metadata: EventCreateCustomer["metadata"];
}
export async function getCustomerState(
   client: Polar,
   externalId: IngestBillingParams["externalCustomerId"],
) {
   return await client.customers.getStateExternal({
      externalId,
   });
}

export async function ingestBilling(
   client: Polar,
   params: IngestBillingParams,
) {
   await client.events.ingest({
      events: [
         {
            name: POLAR_BILLING_EVENTS.CREDIT,
            externalCustomerId: params.externalCustomerId,
            metadata: params.metadata,
         },
      ],
   });
}
export const createAiUsageMetadata = (params: {
   inputTokens: number;
   outputTokens: number;
   effort: keyof typeof MODELS;
}) => {
   const creditsDebited = params.inputTokens + params.outputTokens;
   return {
      usage_type: USAGE_TYPE.LLM,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      effort: params.effort,
      credits_debited: creditsDebited,
   };
};
export const createWebSearchUsageMetadata = (params: {
   method: "crawl" | "search" | "advanced";
}) => {
   let costMultiplier = 1;
   if (params.method === "crawl" || params.method === "advanced") {
      costMultiplier = 2;
   }

   const actualCost = BILLING_CONFIG.webSearchCost * costMultiplier;
   const tokenEquivalent = convertWebSearchCostToTokens(actualCost);

   return {
      usage_type: USAGE_TYPE.WEB_SEARCH,
      method: params.method,
      credits_debited: tokenEquivalent,
      actual_cost: actualCost,
   };
};

export const createRagUsageMetadata = (params: { agentId: string }) => {
   const cost = convertRagOperationCostToTokens(BILLING_CONFIG.rag_usage);
   return {
      usage_type: USAGE_TYPE.RAG_OPERATIONS,
      agent_id: params.agentId,
      credits_debited: cost,
   };
};

function convertRagOperationCostToTokens(cost: number): number {
   const tokens = (cost / BILLING_CONFIG.rag_usage) * 1000000;
   return Math.round(tokens);
}

function convertWebSearchCostToTokens(cost: number): number {
   const tokens = (cost / BILLING_CONFIG.llmPricePerMillionTokens) * 1000000;
   return Math.round(tokens);
}
