"use client";

import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, DocumentAttachmentIcon } from '@hugeicons/core-free-icons';
import Image from "next/image";

export function FilePreviewThumbnail({
    file,
    onRemove,
}: {
    file: File;
    onRemove?: () => void;
}) {
    const isImage = file.type.startsWith("image/");
    const url = isImage ? URL.createObjectURL(file) : null;

    return (
        <div className="relative group w-24 h-24 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center">
            {isImage && url ? (
                <img src={url} alt={file.name} className="object-cover w-full h-full" />
            ) : (
                <div className="flex flex-col items-center p-2 text-center text-zinc-500">
                    <HugeiconsIcon icon={DocumentAttachmentIcon} className="w-8 h-8 mb-1" />
                    <span className="text-[10px] truncate max-w-full">{file.name}</span>
                </div>
            )}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <HugeiconsIcon icon={Cancel01Icon} className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}
