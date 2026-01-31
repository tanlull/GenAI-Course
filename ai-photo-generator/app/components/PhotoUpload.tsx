"use client";

import { UploadCloud } from "lucide-react";
import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
    onImageSelect: (base64: string) => void;
    selectedImage: string | null;
}

export function PhotoUpload({ onImageSelect, selectedImage }: PhotoUploadProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            onImageSelect(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const onDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
            }
        },
        [onImageSelect]
    );

    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Your Photo</label>
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[200px]",
                    isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 bg-gray-50",
                    selectedImage ? "p-0 overflow-hidden border-indigo-500" : ""
                )}
            >
                <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            handleFile(e.target.files[0]);
                        }
                    }}
                />

                {selectedImage ? (
                    <img
                        src={selectedImage}
                        alt="Preview"
                        className="w-full h-full object-contain max-h-[300px]"
                    />
                ) : (
                    <div className="text-center space-y-2 pointer-events-none">
                        <div className="bg-indigo-100 p-3 rounded-full inline-block">
                            <UploadCloud className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-indigo-600">Click to upload</p>
                            <p className="text-xs text-gray-500">or drag and drop your photo here</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
