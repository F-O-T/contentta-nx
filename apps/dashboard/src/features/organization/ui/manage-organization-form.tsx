import type { RouterOutput } from "@packages/api/client";
import { Button } from "@packages/ui/components/button";
import {
   Dropzone,
   DropzoneContent,
   DropzoneEmptyState,
} from "@packages/ui/components/dropzone";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Textarea } from "@packages/ui/components/textarea";
import { createSlug } from "@packages/utils/text";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
   compressImage,
   getCompressedFileName,
} from "@/features/file-upload/lib/image-compression";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { usePresignedUpload } from "@/features/file-upload/lib/use-presigned-upload";
import { useSetActiveOrganization } from "@/features/organization/hooks/use-set-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { betterAuthClient, useTRPC } from "@/integrations/clients";

type Organization =
   RouterOutput["organization"]["getActiveOrganization"]["organization"];
type ManageOrganizationFormProps = {
   organization?: Organization;
};

export function ManageOrganizationForm({
   organization,
}: ManageOrganizationFormProps) {
   const trpc = useTRPC();
   const { closeSheet } = useSheet();
   const isEditMode = !!organization;
   const { uploadToPresignedUrl } = usePresignedUpload();
   const [isCreatePending, setIsCreatePending] = useState(false);
   const [isUpdatePending, setIsUpdatePending] = useState(false);

   const { data: logoData } = useQuery({
      ...trpc.organization.getLogo.queryOptions(),
      enabled: isEditMode,
   });

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: "Create your first organization to start collaborating",
         title: "Create Organization",
      };

      const editTexts = {
         description: "Update your organization information and logo",
         title: "Edit Organization",
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode]);

   const fileUpload = useFileUpload({
      acceptedTypes: ["image/*"],
      maxSize: 5 * 1024 * 1024,
   });

   const { setActiveOrganization } = useSetActiveOrganization({
      showToast: false,
   });

   const createOrganization = useCallback(
      async (data: { name: string; slug: string; description?: string }) => {
         await betterAuthClient.organization.create(
            {
               name: data.name,
               slug: data.slug,
            },
            {
               onRequest: () => {
                  setIsCreatePending(true);
                  toast.loading("Creating organization...");
               },
               onSuccess: async (ctx) => {
                  setIsCreatePending(false);
                  toast.success("Organization created successfully");
                  if (ctx.data?.id) {
                     await setActiveOrganization({
                        organizationId: ctx.data.id,
                     });
                  }
                  fileUpload.clearFile();
                  closeSheet();
               },
               onError: (ctx) => {
                  setIsCreatePending(false);
                  toast.error(
                     ctx.error.message || "Failed to create organization",
                  );
               },
            },
         );
      },
      [closeSheet, fileUpload, setActiveOrganization],
   );

   const updateOrganization = useCallback(
      async (data: { organizationId: string; name?: string }) => {
         await betterAuthClient.organization.update(
            {
               data: {
                  name: data.name,
               },
               organizationId: data.organizationId,
            },
            {
               onRequest: () => {
                  setIsUpdatePending(true);
                  toast.loading("Updating organization...");
               },
               onSuccess: () => {
                  setIsUpdatePending(false);
                  toast.success("Organization updated successfully");
                  fileUpload.clearFile();
                  closeSheet();
               },
               onError: (ctx) => {
                  setIsUpdatePending(false);
                  toast.error(
                     ctx.error.message || "Failed to update organization",
                  );
               },
            },
         );
      },
      [closeSheet, fileUpload],
   );

   const requestLogoUploadUrlMutation = useMutation(
      trpc.organization.uploadLogo.mutationOptions({
         onError: (error) => {
            console.error("Logo upload URL request error:", error);
            toast.error("Failed to request upload URL");
            fileUpload.setError("Failed to request upload URL");
         },
      }),
   );

   const confirmLogoUploadMutation = useMutation(
      trpc.organization.confirmLogoUpload.mutationOptions({
         onError: (error) => {
            console.error("Logo upload confirm error:", error);
            toast.error("Failed to confirm logo upload");
            fileUpload.setError("Failed to confirm logo upload");
         },
         onSuccess: () => {
            toast.success("Logo uploaded successfully");
            fileUpload.clearFile();
         },
      }),
   );

   const cancelLogoUploadMutation = useMutation(
      trpc.organization.cancelLogoUpload.mutationOptions({}),
   );

   const uploadLogo = async (file: File) => {
      fileUpload.setUploading(true);
      let storageKey: string | null = null;

      try {
         const compressed = await compressImage(file, {
            format: "webp",
            quality: 0.8,
            maxWidth: 512,
            maxHeight: 512,
         });

         const compressedFileName = getCompressedFileName(file.name, "webp");

         const { presignedUrl, storageKey: key } =
            await requestLogoUploadUrlMutation.mutateAsync({
               contentType: "image/webp",
               fileName: compressedFileName,
               fileSize: compressed.size,
            });

         storageKey = key;

         await uploadToPresignedUrl(presignedUrl, compressed, "image/webp");

         await confirmLogoUploadMutation.mutateAsync({
            storageKey: key,
         });
      } catch (error) {
         console.error("Logo upload failed:", error);
         if (storageKey) {
            await cancelLogoUploadMutation.mutateAsync({ storageKey });
         }
         throw error;
      } finally {
         fileUpload.setUploading(false);
      }
   };

   const handleFileSelect = (acceptedFiles: File[]) => {
      fileUpload.handleFileSelect(acceptedFiles, (file) => {
         form.setFieldValue("logo", file);
      });
   };

   const form = useForm({
      defaultValues: {
         description: organization?.description || "",
         logo: null as File | null,
         name: organization?.name || "",
      },
      onSubmit: async ({ value, formApi }) => {
         try {
            if (isEditMode && organization) {
               if (value.logo) {
                  try {
                     await uploadLogo(value.logo);
                  } catch (error) {
                     console.error("Logo upload failed:", error);
                     toast.error("Failed to upload logo");
                     return;
                  }
               }

               await updateOrganization({
                  organizationId: organization.id,
                  name: value.name,
               });
            } else {
               await createOrganization({
                  description: value.description,
                  name: value.name,
                  slug: createSlug(value.name),
               });

               if (value.logo) {
                  try {
                     await uploadLogo(value.logo);
                  } catch (error) {
                     console.error("Logo upload failed:", error);
                     toast.error("Failed to upload logo");
                  }
               }
            }

            formApi.reset();
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} organization:`,
               error,
            );
         }
      },
   });

   return (
      <form
         className="h-full flex flex-col"
         onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
         }}
      >
         <SheetHeader>
            <SheetTitle>{modeTexts.title}</SheetTitle>
            <SheetDescription>{modeTexts.description}</SheetDescription>
         </SheetHeader>
         <div className="grid gap-4 px-4">
            <form.Field name="logo">
               {(field) => {
                  const currentLogoFile = field.state.value;
                  const displayImage = fileUpload.filePreview || logoData?.data;

                  return (
                     <Field
                        data-invalid={
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid
                        }
                     >
                        <FieldLabel>Organization Logo</FieldLabel>
                        <Dropzone
                           accept={{
                              "image/*": [
                                 ".png",
                                 ".jpg",
                                 ".jpeg",
                                 ".gif",
                                 ".webp",
                              ],
                           }}
                           className="h-44"
                           disabled={
                              fileUpload.isUploading ||
                              requestLogoUploadUrlMutation.isPending ||
                              confirmLogoUploadMutation.isPending
                           }
                           maxFiles={1}
                           maxSize={5 * 1024 * 1024}
                           onDrop={handleFileSelect}
                           src={currentLogoFile ? [currentLogoFile] : undefined}
                        >
                           <DropzoneEmptyState>
                              {isEditMode && logoData?.data && (
                                 <img
                                    alt="Current logo"
                                    className="max-h-20 max-w-20 object-contain"
                                    src={logoData.data}
                                 />
                              )}
                              {!isEditMode && (
                                 <Building className="size-8 text-muted-foreground" />
                              )}
                           </DropzoneEmptyState>
                           <DropzoneContent>
                              {displayImage && (
                                 <img
                                    alt="Logo preview"
                                    className="h-full w-full object-contain rounded-md"
                                    src={displayImage}
                                 />
                              )}
                           </DropzoneContent>
                        </Dropzone>
                        {currentLogoFile && (
                           <p className="text-sm text-muted-foreground">
                              Logo will be uploaded when you{" "}
                              {isEditMode ? "save" : "create"} the organization
                           </p>
                        )}
                        {fileUpload.error && (
                           <p className="text-sm text-destructive">
                              {fileUpload.error}
                           </p>
                        )}
                        {field.state.meta.isTouched &&
                           !field.state.meta.isValid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                     </Field>
                  );
               }}
            </form.Field>

            <form.Field name="name">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           Organization Name
                        </FieldLabel>
                        <Input
                           aria-invalid={isInvalid}
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           value={field.state.value}
                        />

                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>

            <form.Field name="description">
               {(field) => {
                  const isInvalid =
                     field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                     <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                           Description
                        </FieldLabel>
                        <Textarea
                           aria-invalid={isInvalid}
                           className="w-full"
                           id={field.name}
                           name={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           rows={3}
                           value={field.state.value}
                        />

                        {isInvalid && (
                           <FieldError errors={field.state.meta.errors} />
                        )}
                     </Field>
                  );
               }}
            </form.Field>
         </div>

         <SheetFooter>
            <form.Subscribe>
               {(state) => (
                  <Button
                     className="w-full"
                     disabled={
                        !state.canSubmit ||
                        state.isSubmitting ||
                        isCreatePending ||
                        isUpdatePending
                     }
                     type="submit"
                  >
                     {state.isSubmitting
                        ? isEditMode
                           ? "Saving..."
                           : "Creating..."
                        : modeTexts.title}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </form>
   );
}
