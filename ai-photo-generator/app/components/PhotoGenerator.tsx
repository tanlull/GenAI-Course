"use client";

import React, { useState } from "react";
import { PhotoUpload } from "./PhotoUpload";
import { TemplateGallery } from "./TemplateGallery";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoGeneratorProps {
    templates: string[];
}

export default function PhotoGenerator({ templates }: PhotoGeneratorProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!selectedImage || !selectedTemplate) return;

        setIsGenerating(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/predictions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: selectedImage,
                    template: window.location.origin + `/templates/${selectedTemplate}`, // Pass full URL or path depending on API needs. For base64, we might need to fetch and convert, but Replicate often takes URLs.
                    // Wait, Replicate's API usually expects a URL accessible from the internet OR a base64 string.
                    // Since we are running locally, `localhost` won't work for Replicate to download the template unless we use ngrok.
                    // Solution: Convert local template to base64 before sending using canvas or fetch.
                    prompt: prompt,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate");
            }

            // Replicate run response structure: output is usually the image URL (or array of URLs)
            if (Array.isArray(data.output)) {
                setResult(data.output[0]);
            } else {
                setResult(data.output);
            }

        } catch (err) {
            console.error(err);
            setError("Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper to convert template to base64 if needed, 
    // but for now let's hope we can handle it in the API route or the client.
    // Actually, sending a "localhost" URL to Replicate will definitely fail.
    // We MUST convert the selected template to base64.
    const handleGenerateWithBase64 = async () => {
        if (!selectedImage || !selectedTemplate) return;

        setIsGenerating(true);
        setError(null);
        setResult(null);

        try {
            // 1. Fetch template and convert to blob -> base64
            const templateRes = await fetch(`/templates/${selectedTemplate}`);
            const blob = await templateRes.blob();
            const reader = new FileReader();

            const templateBase64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            const response = await fetch("/api/predictions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: selectedImage,
                    template: templateBase64,
                    prompt: prompt,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed");

            const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
            setResult(outputUrl);

        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto p-2 h-[calc(100vh-20px)] flex flex-col">
            <div className="text-center shrink-0 mb-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    AI Photo Studio
                </h1>
                <p className="text-gray-500 text-sm">
                    Upload selfie, pick style, generate.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">

                {/* Column 1: Style Selection */}
                <div className="flex flex-col h-full min-h-0">
                    <div className="bg-white p-3 rounded-xl shadow-sm border flex flex-col h-full min-h-0">
                        <h2 className="text-sm font-semibold flex items-center gap-2 shrink-0 mb-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px]">1</span>
                            Select Style
                        </h2>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <TemplateGallery
                                templates={templates}
                                selectedTemplate={selectedTemplate}
                                onSelect={setSelectedTemplate}
                            />
                        </div>
                    </div>
                </div>

                {/* Column 2: Upload & Settings */}
                <div className="flex flex-col gap-3 h-full min-h-0">
                    <div className="bg-white p-3 rounded-xl shadow-sm border shrink-0">
                        <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px]">2</span>
                            Upload Selfie
                        </h2>
                        <div className="h-[180px]">
                            <PhotoUpload
                                selectedImage={selectedImage}
                                onImageSelect={setSelectedImage}
                            />
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-sm border shrink-0">
                        <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-[10px]">3</span>
                            Prompt <span className="text-gray-400 text-[10px] font-normal ml-auto">Optional</span>
                        </h2>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="E.g. Make it look cinematic..."
                            className="w-full border-gray-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-[60px] resize-none"
                        />
                    </div>

                    <button
                        onClick={handleGenerateWithBase64}
                        disabled={!selectedImage || !selectedTemplate || isGenerating}
                        className={cn(
                            "w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shrink-0",
                            !selectedImage || !selectedTemplate || isGenerating
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] shadow-indigo-500/25"
                        )}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin w-4 h-4" />
                                Generating...
                            </>
                        ) : !selectedTemplate ? (
                            "Select a Style to Continue"
                        ) : !selectedImage ? (
                            "Upload a Selfie to Continue"
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4" />
                                Generate Photo
                            </>
                        )}
                    </button>
                    {error && <div className="text-red-500 text-center text-xs font-medium bg-red-50 p-2 rounded-lg">{error}</div>}
                </div>

                {/* Column 3: Result */}
                <div className="flex flex-col h-full min-h-0">
                    <div className="bg-white p-3 rounded-xl shadow-sm border h-full flex flex-col">
                        <h2 className="text-sm font-semibold mb-2 flex items-center gap-2 shrink-0">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            Result
                        </h2>

                        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 overflow-hidden relative min-h-0 p-4">
                            {result ? (
                                result.startsWith("http") || result.startsWith("data:") ? (
                                    <img src={result} alt="Generated AI" className="max-w-full max-h-full object-contain shadow-lg" />
                                ) : (
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm border max-w-full overflow-auto">
                                        <p className="text-sm font-semibold text-indigo-600 mb-2">AI Response:</p>
                                        <p className="text-gray-700 whitespace-pre-wrap text-sm">{result}</p>
                                    </div>
                                )
                            ) : (
                                <div className="text-center text-gray-400 space-y-2">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-xs">Result will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
