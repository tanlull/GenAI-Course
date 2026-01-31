import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: "API Key (GEMINI_API_KEY) is not set. Add GEMINI_API_KEY to your .env.local file." },
            { status: 500 }
        );
    }

    const { image, template, prompt } = await request.json();

    if (!image || !template) {
        return NextResponse.json(
            { error: "Both user image and template are required." },
            { status: 400 }
        );
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Use Nano Banana - Gemini's native image generation model
        // Options: "gemini-2.0-flash-exp-image-generation" or "imagen-3.0-generate-002"
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp-image-generation",
            generationConfig: {
                // @ts-ignore - responseModalities is supported but types may be outdated
                responseModalities: ["Text", "Image"],
            },
        });

        // Helper to strip base64 header (data:image/png;base64,...)
        const formatBase64 = (data: string) => data.split(",")[1] || data;
        
        // Detect mime type from base64 string
        const getMimeType = (data: string): string => {
            if (data.startsWith("data:image/jpeg")) return "image/jpeg";
            if (data.startsWith("data:image/jpg")) return "image/jpeg";
            if (data.startsWith("data:image/png")) return "image/png";
            if (data.startsWith("data:image/webp")) return "image/webp";
            return "image/png";
        };

        // Build the prompt - use custom prompt if provided, otherwise use default face swap instruction
        const baseInstruction = `Use photo in template as suit and use exact face in upload photo put in suit in selected the template.

Rules:
- FIRST image = face/selfie to use
- SECOND image = template with suit/outfit
- Put the exact face from the first image onto the person in the second image
- Keep the suit, pose, body, and background from the template
- Preserve the same facial features, skin tone, and expression from the uploaded face
- Make it look natural`;

        const finalPrompt = prompt 
            ? `${baseInstruction}\n\nAdditional instructions: ${prompt}`
            : baseInstruction;

        const result = await model.generateContent([
            finalPrompt,
            // User's selfie (face source)
            {
                inlineData: {
                    data: formatBase64(image),
                    mimeType: getMimeType(image),
                },
            },
            // Template image (body/style target)
            {
                inlineData: {
                    data: formatBase64(template),
                    mimeType: getMimeType(template),
                },
            },
        ]);

        const response = await result.response;
        
        // Check response parts for image data
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            const parts = candidates[0].content?.parts || [];
            
            for (const part of parts) {
                // Check if this part contains image data
                if (part.inlineData && part.inlineData.data) {
                    const mimeType = part.inlineData.mimeType || "image/png";
                    const base64Image = `data:${mimeType};base64,${part.inlineData.data}`;
                    return NextResponse.json({ output: base64Image }, { status: 201 });
                }
            }
            
            // If no image found, return text response
            const textPart = parts.find((p: any) => p.text);
            if (textPart && textPart.text) {
                return NextResponse.json({ 
                    output: textPart.text,
                    note: "Model returned text instead of an image. This could be due to safety filters."
                }, { status: 201 });
            }
        }

        // Fallback
        const text = response.text();
        return NextResponse.json({ 
            output: text || "No output received from Gemini.",
        }, { status: 201 });

    } catch (error: any) {
        console.error("Gemini API error:", error);
        
        let errorMessage = error.message || "Failed to generate with Gemini.";
        
        if (errorMessage.includes("not found") || errorMessage.includes("404")) {
            errorMessage = "Model not available. Check if image generation is enabled for your API key at https://aistudio.google.com";
        } else if (errorMessage.includes("SAFETY") || errorMessage.includes("blocked")) {
            errorMessage = "Request blocked by safety filters. Try different images.";
        } else if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
            errorMessage = "API quota exceeded. Please try again later.";
        }
        
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
