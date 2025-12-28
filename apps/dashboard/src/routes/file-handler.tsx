import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { getQueryClient, trpc } from "@/integrations/clients";

interface LaunchParams {
   files?: FileSystemFileHandle[];
}

interface LaunchQueue {
   setConsumer: (callback: (params: LaunchParams) => void) => void;
}

declare global {
   interface Window {
      launchQueue?: LaunchQueue;
   }
}

export const Route = createFileRoute("/file-handler")({
   beforeLoad: async () => {
      const queryClient = getQueryClient();

      try {
         const organizations = await queryClient.fetchQuery(
            trpc.organization.getOrganizations.queryOptions(),
         );

         if (!organizations.length) {
            throw redirect({ to: "/auth/sign-in" });
         }
      } catch (error) {
         if (
            error instanceof Response ||
            (error as { isRedirect?: boolean })?.isRedirect
         ) {
            throw error;
         }
         throw redirect({ to: "/auth/sign-in" });
      }
   },
   component: FileHandlerComponent,
});

function FileHandlerComponent() {
   const navigate = useNavigate();

   useEffect(() => {
      async function handleLaunch() {
         const queryClient = getQueryClient();

         const organizations = await queryClient.fetchQuery(
            trpc.organization.getOrganizations.queryOptions(),
         );

         const lastSlug = localStorage.getItem("montte:last-organization-slug");
         const foundOrg = lastSlug
            ? organizations.find((o) => o.slug === lastSlug)
            : null;
         const org = foundOrg ?? organizations[0];

         if (!org) {
            navigate({ to: "/auth/sign-in" });
            return;
         }

         const orgSlug = org.slug;

         if (window.launchQueue) {
            window.launchQueue.setConsumer(
               async (launchParams: LaunchParams) => {
                  if (!launchParams.files?.length || !launchParams.files[0]) {
                     navigate({
                        params: { slug: orgSlug },
                        to: "/$slug/home",
                     });
                     return;
                  }

                  const fileHandle = launchParams.files[0];
                  const file = await fileHandle.getFile();
                  const arrayBuffer = await file.arrayBuffer();
                  const bytes = new Uint8Array(arrayBuffer);
                  const chunkSize = 32768;
                  let binaryString = "";
                  for (let i = 0; i < bytes.length; i += chunkSize) {
                     const chunk = bytes.subarray(i, i + chunkSize);
                     binaryString += String.fromCharCode(...chunk);
                  }
                  const base64Content = btoa(binaryString);

                  // Detect file type from extension
                  const ext = file.name.split(".").pop()?.toLowerCase();
                  const fileType = ext === "csv" ? "csv" : "ofx";

                  sessionStorage.setItem(
                     "montte:pending-import",
                     JSON.stringify({
                        fileType,
                        content: base64Content,
                        filename: file.name,
                        timestamp: Date.now(),
                        bankAccountId: null,
                        parsedTransactions: [],
                        selectedRowIndices: [],
                        duplicates: [],
                        duplicatesChecked: false,
                        csvPreviewData: null,
                        columnMapping: null,
                     }),
                  );

                  navigate({
                     params: { slug: orgSlug },
                     to: "/$slug/home",
                  });
               },
            );
         } else {
            navigate({
               params: { slug: orgSlug },
               to: "/$slug/home",
            });
         }
      }

      handleLaunch();
   }, [navigate]);

   return (
      <div className="flex h-screen items-center justify-center bg-background">
         <Loader2 className="size-8 animate-spin text-primary" />
      </div>
   );
}
