"use client";

import { useRef } from "react";
import { HugeiconsIcon } from '@hugeicons/react';
import { CloudUploadIcon, Camera01Icon } from '@hugeicons/core-free-icons';

export interface CollateralFormData {
    description: string;
    estimatedValue: string;
    serialNumber: string;
    notes: string;
    files: File[];
    // If editing/persisted
    id?: string;
    imagePaths?: string[];
}

export function CollateralUploader({
    onAdd,
}: {
    onAdd: (data: CollateralFormData) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
            onAdd({
                description: file.name,
                estimatedValue: "",
                serialNumber: "",
                notes: "",
                files: [file],
            });
        });

        // Reset so selecting the same file again still triggers onChange
        e.target.value = "";
    };

    return (
        <div className="grid grid-cols-2 gap-3">
            <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
            >
                <HugeiconsIcon icon={Camera01Icon} className="w-6 h-6 text-zinc-500" />
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Take Photo</span>
                <input
                    type="file"
                    ref={cameraRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                />
            </button>

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
            >
                <HugeiconsIcon icon={CloudUploadIcon} className="w-6 h-6 text-zinc-500" />
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Upload Image</span>
                <input
                    type="file"
                    ref={inputRef}
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </button>
        </div>
    );
}
