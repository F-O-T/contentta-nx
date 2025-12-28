import { toast } from "sonner";

interface CreateToastOptions {
   message: string;
   type: "success" | "danger" | "warning" | "info";
   description?: string;
}

export function createToast({ message, type, description }: CreateToastOptions) {
   switch (type) {
      case "success":
         toast.success(message, { description });
         break;
      case "danger":
         toast.error(message, { description });
         break;
      case "warning":
         toast.warning(message, { description });
         break;
      case "info":
         toast.info(message, { description });
         break;
   }
}
