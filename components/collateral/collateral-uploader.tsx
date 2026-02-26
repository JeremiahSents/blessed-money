"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HugeiconsIcon } from '@hugeicons/react';
import { CloudUploadIcon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { FilePreviewThumbnail } from "@/components/shared/file-preview-thumbnail";

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
    onCancel,
}: {
    onAdd: (data: CollateralFormData) => void;
    onCancel?: () => void;
}) {
    const [description, setDescription] = useState("");
    const [estimatedValue, setEstimatedValue] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const [notes, setNotes] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;

        onAdd({
            description,
            estimatedValue,
            serialNumber,
            notes,
            files,
        });

        // Reset
        setDescription("");
        setEstimatedValue("");
        setSerialNumber("");
        setNotes("");
        setFiles([]);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4 bg-zinc-50/50 dark:bg-zinc-900/50">
            <h3 className="font-medium">Add Collateral Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Description *</Label>
                    <Input
                        required
                        placeholder="e.g. 2019 Toyota Corolla"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Estimated Value ($)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="15000"
                        value={estimatedValue}
                        onChange={e => setEstimatedValue(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Serial / VIN Number</Label>
                    <Input
                        placeholder="SN-123456789"
                        value={serialNumber}
                        onChange={e => setSerialNumber(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                    placeholder="Condition, location, etc."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Images / Documents</Label>
                <div
                    className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    onClick={() => inputRef.current?.click()}
                >
                    <HugeiconsIcon icon={CloudUploadIcon} className="w-6 h-6 mx-auto text-zinc-400 mb-2" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Add Files</p>
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
                    <div className="flex flex-wrap gap-2 mt-2">
                        {files.map((file, i) => (
                            <FilePreviewThumbnail key={i} file={file} onRemove={() => removeFile(i)} />
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={!description.trim()}>
                    <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4 mr-2" />
                    Save Item
                </Button>
            </div>
        </form>
    );
}
