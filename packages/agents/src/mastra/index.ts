import { Mastra } from "@mastra/core/mastra";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { PinoLogger } from "@mastra/loggers";
import type { SupportedLng } from "@packages/localization";
import { appAssistantAgent } from "./agents/app-assistant-agent";
import { createCompetitorInsightsWorkflow } from "./workflows/competitor/create-competitor-insights-workflow";
import { createCompleteKnowledgeWorkflow } from "./workflows/create-complete-knowledge-workflow";
import { createNewContentWorkflow } from "./workflows/create-new-content-workflow";
import { createFeaturesKnowledgeWorkflow } from "./workflows/knowledge/create-features-knowledge-workflow";
import { createKnowledgeAndIndexDocumentsWorkflow } from "./workflows/knowledge/create-knowledge-and-index-documents-workflow";
export type CustomRuntimeContext = {
   brandId?: string;
   language?: SupportedLng;
   userId: string;
   agentId?: string;
};
export const mastra = new Mastra({
   agents: {
      appAssistantAgent,
   },
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
   logger: new PinoLogger({
      level: "info",
      name: "Mastra",
   }),
   workflows: {
      createCompetitorInsightsWorkflow,
      createCompleteKnowledgeWorkflow,
      createFeaturesKnowledgeWorkflow,
      createKnowledgeAndIndexDocumentsWorkflow,
      createNewContentWorkflow,
   },
});

export function setRuntimeContext(context: CustomRuntimeContext) {
   const runtimeContext = new RuntimeContext<CustomRuntimeContext>();
   runtimeContext.set("userId", context.userId);
   runtimeContext.set("language", context.language ?? "en-US");

   if (context.brandId) {
      runtimeContext.set("brandId", context.brandId);
   }
   if (context.agentId) {
      runtimeContext.set("agentId", context.agentId);
   }
   return runtimeContext;
}
