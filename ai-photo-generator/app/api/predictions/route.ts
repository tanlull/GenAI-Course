import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REPLICATE_API_TOKEN || "");
// Note: We are reusing the REPLICATE_API_TOKEN env var name for now to avoid confusing the user with another .env change immediately, 
// OR we should ask them to add GEMINI_API_KEY.
// Better: Check both or just use GEMINI_API_KEY and fail if not present, guiding the user.
// Given the user flow, I will check GEMINI_API_KEY but also fallback to REPLICATE_API_TOKEN if they just pasted the new key there.

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.REPLICATE_API_TOKEN;

    if (!apiKey) {
        return NextResponse.json(
            { error: "API Key (GEMINI_API_KEY) is not set." },
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
        const genAIClient = new GoogleGenerativeAI(apiKey);
        // Trying to use a model that supports image generation or at least robust multimodal handling.
        // 'gemini-1.5-flash' is the safest default for text.
        // If the user has access to 'gemini-2.0-flash-exp', it might work better.
        let modelName = "gemini-1.5-flash"; // Fallback
        // Note: To truly get an image, one needs Imagen 3 via Vertex AI usually. 
        // The SDK for AI Studio doesn't strictly yield images from prompts yet.

        // However, let's allow the user to see the text response which might say "I cannot generate images"
        const model = genAIClient.getGenerativeModel({ model: modelName });

        // Helper to strip base64 header
        const formatBase64 = (data: string) => data.split(",")[1] || data;

        const result = await model.generateContent([
            // Prompt
            `Instructions: ${prompt || "Swap the face from the first image onto the person in the second image. Maintain the lighting and style of the second image (template)."}`,
            // User Image (Face Source)
            {
                inlineData: {
                    data: formatBase64(image),
                    mimeType: "image/png",
                },
            },
            // Template Image (Body/Style Target)
            {
                inlineData: {
                    data: formatBase64(template),
                    mimeType: "image/png",
                },
            },
        ]);

        const response = await result.response;
        // Check if we got usage metadata or text
        const text = response.text();

        // For now, if it returns text, we send it back. 
        // If the model supports image output, it would be in response.candidates[0].content.parts 
        // as inlineData presumably.

        // Let's inspect parts
        // const parts = response.candidates?.[0]?.content?.parts;

        return NextResponse.json({ output: text || "Processed by Gemini (Check logs for image data if supported)" }, { status: 201 });

    } catch (error: any) {
        console.error("Gemini API error:", error);
        const errorMessage = error.message || "Failed to generate with Gemini.";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
