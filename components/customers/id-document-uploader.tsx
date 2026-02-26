"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { UploadDropzone } from "@/lib/uploadthing";

export function IdDocumentUploader({ customerId }: { customerId: string }) {
    const queryClient = useQueryClient();

    const persistUrls = async (urls: string[]) => {
        try {
            const res = await fetch(`/api/customers/${customerId}/id-images`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ urls }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to persist documents");
            }

            queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
            toast.success("Documents uploaded successfully");
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="space-y-4">
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 p-2">
                <UploadDropzone
                    endpoint="customerIdUploader"
                    onClientUploadComplete={(res) => {
                        if (res && res.length > 0) {
                            const urls = res.map((file) => file.url);
                            persistUrls(urls);
                        }
                    }}
                    onUploadError={(error: Error) => {
                        toast.error(`Upload failed: ${error.message}`);
                    }}
                    appearance={{
                        container: "border-none max-w-none text-zinc-900 border-zinc-200 dark:border-zinc-800",
                        label: "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-300",
                        allowedContent: "text-zinc-500",
                        button: "bg-primary text-primary-foreground hover:bg-primary/90",
                    }}
                />
            </div>
        </div>
    );
}
