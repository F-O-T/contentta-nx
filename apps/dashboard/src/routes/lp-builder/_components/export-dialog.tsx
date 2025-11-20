import { Button } from "@packages/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@packages/ui/components/dialog";
import { Check, Copy, Terminal } from "lucide-react";
import { useState } from "react";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockIds: string[];
}

export function ExportDialog({
  open,
  onOpenChange,
  blockIds,
}: ExportDialogProps) {
  const [copied, setCopied] = useState(false);

  const command = `npx @contentagen/create --blocks=${blockIds.join(",")}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Landing Page</DialogTitle>
          <DialogDescription>
            Copy and run this command to create your landing page project with
            the selected blocks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Terminal className="size-4 mt-1 shrink-0 text-muted-foreground" />
                <code className="text-sm font-mono break-all">{command}</code>
              </div>
              <Button
                className="shrink-0"
                onClick={handleCopy}
                size="sm"
                variant="ghost"
              >
                {copied ? (
                  <>
                    <Check className="size-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Next steps:</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Copy the command above</li>
              <li>Open your terminal in the directory where you want to create the project</li>
              <li>Paste and run the command</li>
              <li>Follow the prompts to set up your project</li>
              <li>
                Run <code className="bg-muted px-1 py-0.5 rounded">npm install</code> to
                install dependencies
              </li>
              <li>
                Run <code className="bg-muted px-1 py-0.5 rounded">npm run dev</code> to
                start the development server
              </li>
            </ol>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Selected blocks:</h4>
            <div className="flex flex-wrap gap-2">
              {blockIds.map((id) => (
                <span
                  className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
                  key={id}
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

