import { translate } from "@packages/localization";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import { getInitials } from "@packages/utils/text";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import {
	compressImage,
	getCompressedFileName,
} from "@/features/file-upload/lib/image-compression";
import { useFileUpload } from "@/features/file-upload/lib/use-file-upload";
import { usePresignedUpload } from "@/features/file-upload/lib/use-presigned-upload";
import { useTRPC } from "@/integrations/clients";

type WriterPhotoUploadProps = {
	agentId?: string;
	currentPhotoUrl?: string | null;
	name: string;
	onPhotoChange?: (storageKey: string | null) => void;
	size?: "sm" | "md" | "lg";
};

const sizeClasses = {
	lg: "size-24",
	md: "size-16",
	sm: "size-12",
};

const iconSizeClasses = {
	lg: "size-8",
	md: "size-6",
	sm: "size-4",
};

export function WriterPhotoUpload({
	agentId,
	currentPhotoUrl,
	name,
	onPhotoChange,
	size = "md",
}: WriterPhotoUploadProps) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fileUpload = useFileUpload({
		acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
		maxSize: 5 * 1024 * 1024,
	});

	const { uploadToPresignedUrl, isUploading: isUploadingToS3 } =
		usePresignedUpload();

	const requestUploadUrlMutation = useMutation(
		trpc.agent.requestPhotoUploadUrl.mutationOptions(),
	);

	const confirmUploadMutation = useMutation(
		trpc.agent.confirmPhotoUpload.mutationOptions({
			onSuccess: () => {
				toast.success(translate("dashboard.routes.writers.form.photo-success"));
				if (agentId) {
					queryClient.invalidateQueries({
						queryKey: trpc.agent.getById.queryKey({ id: agentId }),
					});
					queryClient.invalidateQueries({
						queryKey: trpc.agent.list.queryKey(),
					});
				}
			},
			onError: () => {
				toast.error(translate("dashboard.routes.writers.form.photo-error"));
			},
		}),
	);

	const cancelUploadMutation = useMutation(
		trpc.agent.cancelPhotoUpload.mutationOptions(),
	);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files) {
			fileUpload.handleFileSelect(Array.from(files));
		}
	};

	const handleUpload = async () => {
		if (!fileUpload.selectedFile || !agentId) return;

		fileUpload.setUploading(true);
		let storageKey: string | null = null;

		try {
			// Compress the image
			const compressed = await compressImage(fileUpload.selectedFile, {
				format: "webp",
				maxHeight: 512,
				maxWidth: 512,
				quality: 0.8,
			});

			const compressedFileName = getCompressedFileName(
				fileUpload.selectedFile.name,
				"webp",
			);

			// Request presigned URL
			const { presignedUrl, storageKey: key } =
				await requestUploadUrlMutation.mutateAsync({
					agentId,
					contentType: "image/webp",
					fileName: compressedFileName,
					fileSize: compressed.size,
				});

			storageKey = key;

			// Upload to S3
			await uploadToPresignedUrl(presignedUrl, compressed, "image/webp");

			// Confirm upload
			await confirmUploadMutation.mutateAsync({ agentId, storageKey: key });

			onPhotoChange?.(key);
			fileUpload.clearFile();
		} catch (error) {
			console.error("Writer photo upload error:", error);
			if (storageKey) {
				await cancelUploadMutation.mutateAsync({ storageKey });
			}
			toast.error(translate("dashboard.routes.writers.form.photo-error"));
		} finally {
			fileUpload.setUploading(false);
		}
	};

	const isUploading =
		fileUpload.isUploading ||
		isUploadingToS3 ||
		requestUploadUrlMutation.isPending ||
		confirmUploadMutation.isPending;

	const initials = getInitials(name || "Writer");
	const previewUrl = fileUpload.filePreview || currentPhotoUrl;

	// For create mode (no agentId), just show preview without upload
	if (!agentId) {
		return (
			<div className="flex flex-col items-center gap-3">
				<div className="relative group">
					<Avatar className={sizeClasses[size]}>
						<AvatarImage alt={name} src={previewUrl || undefined} />
						<AvatarFallback className="text-lg">{initials}</AvatarFallback>
					</Avatar>
					<button
						className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
						onClick={() => fileInputRef.current?.click()}
						type="button"
					>
						<Camera className={`text-white ${iconSizeClasses[size]}`} />
					</button>
				</div>
				<input
					accept="image/jpeg,image/png,image/webp,image/avif"
					className="hidden"
					onChange={handleFileSelect}
					ref={fileInputRef}
					type="file"
				/>
				<p className="text-xs text-muted-foreground">
					{translate("dashboard.routes.writers.form.photo-hint")}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center gap-3">
			<div className="relative group">
				<Avatar className={sizeClasses[size]}>
					<AvatarImage alt={name} src={previewUrl || undefined} />
					<AvatarFallback className="text-lg">{initials}</AvatarFallback>
				</Avatar>
				<button
					className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
					disabled={isUploading}
					onClick={() => fileInputRef.current?.click()}
					type="button"
				>
					{isUploading ? (
						<Loader2 className={`text-white animate-spin ${iconSizeClasses[size]}`} />
					) : (
						<Camera className={`text-white ${iconSizeClasses[size]}`} />
					)}
				</button>
			</div>

			<input
				accept="image/jpeg,image/png,image/webp,image/avif"
				className="hidden"
				onChange={handleFileSelect}
				ref={fileInputRef}
				type="file"
			/>

			{fileUpload.selectedFile && (
				<div className="flex items-center gap-2">
					<p className="text-xs text-muted-foreground truncate max-w-[150px]">
						{fileUpload.selectedFile.name}
					</p>
					<Button
						disabled={isUploading}
						onClick={handleUpload}
						size="sm"
						variant="outline"
					>
						{isUploading ? (
							<Loader2 className="size-3 animate-spin" />
						) : (
							<Upload className="size-3" />
						)}
						{translate("common.actions.upload")}
					</Button>
				</div>
			)}

			{!fileUpload.selectedFile && (
				<p className="text-xs text-muted-foreground">
					{translate("dashboard.routes.writers.form.photo-hint")}
				</p>
			)}
		</div>
	);
}
