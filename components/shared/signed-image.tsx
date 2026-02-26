"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface SignedImageProps extends Omit<ImageProps, "src"> {
    bucket: string;
    path: string;
    fallbackText?: string;
}

type SignedUrlResponse =
    | { url: string }
    | { error: true; message?: string };

export function SignedImage({ bucket, path, fallbackText, alt, ...props }: SignedImageProps) {
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setError(false);
                setUrl(null);

                const res = await fetch(
                    `/api/storage/signed-url?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`
                );
                if (!res.ok) throw new Error("Failed to fetch signed URL");

                const data = (await res.json()) as SignedUrlResponse;
                if ("url" in data && typeof data.url === "string") {
                    if (active) setUrl(data.url);
                    return;
                }

                throw new Error("Failed to fetch signed URL");
            } catch (e) {
                if (active) setError(true);
            }
        })();
        return () => {
            active = false;
        };
    }, [bucket, path]);

    if (error) {
        return (
            <div className={`bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs text-center p-2 rounded-md border border-zinc-200 ${props.className || ''}`}>
                {fallbackText || "Failed to load image"}
            </div>
        );
    }

    if (!url) {
        return <Skeleton className={`rounded-md ${props.className || ''}`} />;
    }

    if (props.fill) {
        return <Image fill src={url} alt={alt || "Image"} {...props} unoptimized />;
    }

    return <Image src={url} alt={alt || "Image"} {...props} unoptimized />;
}
