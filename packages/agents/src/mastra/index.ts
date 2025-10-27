import { Mastra } from "@mastra/core/mastra";
import { appAssistantAgent } from "./agents/app-assistant-agent";
import { createCompleteKnowledgeWorkflow } from "./workflows/create-complete-knowledge-workflow";
import { PinoLogger } from "@mastra/loggers";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { createNewContentWorkflow } from "./workflows/create-new-content-workflow";
import { createFeaturesKnowledgeWorkflow } from "./workflows/knowledge/create-features-knowledge-workflow";
import { createKnowledgeAndIndexDocumentsWorkflow } from "./workflows/knowledge/create-knowledge-and-index-documents-workflow";
import { createOverviewWorkflow } from "./workflows/knowledge/create-overview-workflow";
import { createCompetitorInsightsWorkflow } from "./workflows/competitor/create-competitor-insights-workflow";

import type { SupportedLng } from "@packages/localization";
export type CustomRuntimeContext = {
   brandId?: string;
   language: SupportedLng;
   userId: string;
   agentId?: string;
};
export const mastra = new Mastra({
   bundler: {
      transpilePackages: [
         "@packages/files/client",
         "@packages/payment/client",
         "@packages/payment/ingestion",
         "@packages/environment/helpers",
         "@packages/environment/server",
         "@packages/database/client",
         "@packages/database/schema",
         "@packages/rag/client",
         "@packages/utils/errors",
         "@packages/utils/text",
      ],
   },
   workflows: {
      createCompleteKnowledgeWorkflow,
      createNewContentWorkflow,
      createFeaturesKnowledgeWorkflow,
      createKnowledgeAndIndexDocumentsWorkflow,
      createOverviewWorkflow,
      createCompetitorInsightsWorkflow,
   },
   agents: {
      appAssistantAgent,
   },
   logger: new PinoLogger({
      name: "Mastra",
      level: "info",
   }),
});

export function setRuntimeContext(context: CustomRuntimeContext) {
   const runtimeContext = new RuntimeContext<CustomRuntimeContext>();
   runtimeContext.set("language", context.language);
   runtimeContext.set("userId", context.userId);

   if (context.brandId) {
      runtimeContext.set("brandId", context.brandId);
   }
   if (context.agentId) {
      runtimeContext.set("agentId", context.agentId);
   }
   return runtimeContext;
}
