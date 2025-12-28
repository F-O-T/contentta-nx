import { AlertCircle } from "lucide-react";
import type { FallbackProps } from "react-error-boundary";
import { Button } from "./button";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "./empty";

interface ErrorFallbackProps extends FallbackProps {
   errorTitle?: string;
   errorDescription?: string;
   retryText?: string;
}

export function ErrorFallback({
   resetErrorBoundary,
   errorTitle = "Error loading content",
   errorDescription = "Something went wrong while loading this content. Please try again.",
   retryText = "Retry",
}: ErrorFallbackProps) {
   return (
      <Empty>
         <EmptyHeader>
            <EmptyMedia variant="icon">
               <AlertCircle className="size-6" />
            </EmptyMedia>
            <EmptyTitle>{errorTitle}</EmptyTitle>
            <EmptyDescription>{errorDescription}</EmptyDescription>
         </EmptyHeader>
         <EmptyContent>
            <Button onClick={resetErrorBoundary} size="sm" variant="outline">
               {retryText}
            </Button>
         </EmptyContent>
      </Empty>
   );
}

export function createErrorFallback(options?: Partial<ErrorFallbackProps>) {
   return function CustomErrorFallback(props: FallbackProps) {
      return <ErrorFallback {...options} {...props} />;
   };
}
