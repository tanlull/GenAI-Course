"use client";

import { cn } from "@/lib/utils";

interface TemplateGalleryProps {
    templates: string[];
    selectedTemplate: string | null;
    onSelect: (template: string) => void;
}

export function TemplateGallery({ templates, selectedTemplate, onSelect }: TemplateGalleryProps) {
    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose a Template</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2 border rounded-lg bg-gray-50">
                {templates.map((template) => (
                    <div
                        key={template}
                        onClick={() => onSelect(template)}
                        className={cn(
                            "cursor-pointer group relative rounded-lg overflow-hidden border-2 transition-all aspect-[2/3]",
                            selectedTemplate === template
                                ? "border-indigo-600 ring-2 ring-indigo-600 ring-offset-2"
                                : "border-transparent hover:border-gray-300"
                        )}
                    >
                        <img
                            src={`/templates/${template}`}
                            alt={template}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        {selectedTemplate === template && (
                            <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                                <div className="bg-white rounded-full p-1">
                                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
