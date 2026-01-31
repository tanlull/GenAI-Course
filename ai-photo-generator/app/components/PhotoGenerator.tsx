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
        <div className="max-w-6xl mx-auto p-6 space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent pb-1">
                    AI Photo Studio
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                    Upload your selfie, pick a style, and let AI transform you.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm">1</span>
                            Select Style
                        </h2>
                        <TemplateGallery
                            templates={templates}
                            selectedTemplate={selectedTemplate}
                            onSelect={setSelectedTemplate}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm">2</span>
                            Upload Selfie
                        </h2>
                        <PhotoUpload
                            selectedImage={selectedImage}
                            onImageSelect={setSelectedImage}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm">3</span>
                            Custom Prompts <span className="text-gray-400 text-sm font-normal ml-auto">(Optional)</span>
                        </h2>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="E.g. Make it look cinematic, add cybernetic enhancements..."
                            className="w-full border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px] resize-none"
                        />
                    </div>

                    <button
                        onClick={handleGenerateWithBase64}
                        disabled={!selectedImage || !selectedTemplate || isGenerating}
                        className={cn(
                            "w-full py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/25",
                            !selectedImage || !selectedTemplate || isGenerating
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02]"
                        )}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin w-6 h-6" />
                                Generating Magic...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-6 h-6" />
                                Generate Photo
                            </>
                        )}
                    </button>
                    {error && <div className="text-red-500 text-center font-medium bg-red-50 p-4 rounded-lg">{error}</div>}

                </div>

                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border min-h-[600px] flex flex-col">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            Result
                        </h2>

                        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 overflow-hidden relative">
                            {result ? (
                                <img src={result} alt="Generated AI" className="max-w-full max-h-full object-contain shadow-2xl" />
                            ) : (
                                <div className="text-center text-gray-400 space-y-4">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                                        <Sparkles className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <p>Your masterpiece will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
