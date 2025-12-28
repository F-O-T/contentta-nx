import { Mastra } from "@mastra/core/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { PinoLogger } from "@mastra/loggers";
import type { SupportedLng } from "@packages/localization";
import { createNewContentWorkflow } from "./workflows/create-new-content-workflow";
import { createKnowledgeAndIndexDocumentsWorkflow } from "./workflows/knowledge/create-knowledge-and-index-documents-workflow";

export type CustomRequestContext = {
   brandId?: string;
   language?: SupportedLng;
   userId: string;
   agentId?: string;
};

export const mastra = new Mastra({
   agents: {},
   bundler: {
      transpilePackages: [
         "@packages/files/client",
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
      createKnowledgeAndIndexDocumentsWorkflow,
      createNewContentWorkflow,
   },
});

export function createRequestContext(context: CustomRequestContext) {
   const requestContext = new RequestContext<CustomRequestContext>();
   requestContext.set("userId", context.userId);
   if (context.language) {
      requestContext.set("language", context.language);
   }

   if (context.brandId) {
      requestContext.set("brandId", context.brandId);
   }
   if (context.agentId) {
      requestContext.set("agentId", context.agentId);
   }
   return requestContext;
}
