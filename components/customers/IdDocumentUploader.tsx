"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadCloudIcon } from "lucide-react";
import { FilePreviewThumbnail } from "@/components/shared/FilePreviewThumbnail";
import { getErrorMessage } from "@/lib/errors";

export function IdDocumentUploader({ customerId }: { customerId: string }) {
    const [files, setFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            files.forEach((file) => formData.append("files", file));

            const res = await fetch(`/api/customers/${customerId}/id-images`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to upload documents");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
            toast.success("Documents uploaded successfully");
            setFiles([]);
            if (inputRef.current) inputRef.current.value = "";
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error));
        }
    });

    const handleUpload = () => {
        if (files.length === 0) return;
        mutation.mutate();
    };

    return (
        <div className="space-y-4">
            <div
                className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                onClick={() => inputRef.current?.click()}
            >
                <UploadCloudIcon className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Click to select files or drag and drop</p>
                <p className="text-xs text-zinc-500 mt-1">JPEG, PNG, or PDF up to 5MB each</p>
                <input
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    multiple
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleFileChange}
                />
            </div>

            {files.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {files.map((file, i) => (
                            <FilePreviewThumbnail key={i} file={file} onRemove={() => removeFile(i)} />
                        ))}
                    </div>
                    <Button
                        onClick={handleUpload}
                        disabled={mutation.isPending}
                        className="w-full sm:w-auto"
                    >
                        {mutation.isPending ? "Uploading..." : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
                    </Button>
                </div>
            )}
        </div>
    );
}
