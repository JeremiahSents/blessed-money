"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { getSignedUrlAction } from "../../app/actions/storage";
import { Skeleton } from "@/components/ui/skeleton";

interface SignedImageProps extends Omit<ImageProps, "src"> {
    bucket: string;
    path: string;
    fallbackText?: string;
}

export function SignedImage({ bucket, path, fallbackText, alt, ...props }: SignedImageProps) {
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await getSignedUrlAction(bucket, path);
                if (res.url && active) {
                    setUrl(res.url);
                } else if (res.error && active) {
                    setError(true);
                }
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

    // Using standard img tag if width/height props are missing, but Image accepts fill
    if (props.fill) {
        return <Image src={url} alt={alt || "Image"} {...props} unoptimized />;
    }

    return <img src={url} alt={alt || "Image"} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
}
