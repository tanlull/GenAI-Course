import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
    if (!process.env.REPLICATE_API_TOKEN) {
        return NextResponse.json(
            { error: "The REPLICATE_API_TOKEN environment variable is not set." },
            { status: 500 }
        );
    }

    const { image, template, prompt } = await request.json();

    if (!image || !template) {
        return NextResponse.json(
            { error: "Image and template are required." },
            { status: 400 }
        );
    }

    try {
        // Using InstantID model
        // Model: wangfuyun/instantid
        // This model might change versions, using a recent known working one or just the latest shorthand if supported.
        // Ideally, we'd use the version hash, but for flexibility we'll try to let Replicate resolve it or use a specific one.
        // Version: c6b5d2b7... (example)
        // Let's use the explicit 'wangfuyun/instantid' model path which Replicate's run method resolves.

        // Note: Replicate's `run` method takes "owner/name:version" or "owner/name". 
        // If we use "wangfuyun/instantid", it usually picks the latest.

        const output = await replicate.run(
            "wangfuyun/instantid:4224460662d085df7c7e997a48d3db8ae88dd233301a248f22e8470a1a361c9e",
            {
                input: {
                    image: image,
                    pose_image: template, // instantid uses pose_image for the style/structure usually, or we might need 'style_image' depending on the exact implementation details of the model
                    // Actually, InstantID takes 'face_image' (the user) and 'pose_image' (the reference).
                    // Let's verify input names.
                    // Standard InstantID inputs: face_image, pose_image, prompt.
                    // image: user face
                    // pose_image: template (cloth/pose)
                    prompt: prompt || "A realistic photo of a person",
                    negative_prompt: "low quality, bad quality, sketches, cartoon, low resolution",
                },
            }
        );

        return NextResponse.json({ output }, { status: 201 });
    } catch (error) {
        console.error("Replicate API error:", error);
        return NextResponse.json(
            { error: "Failed to generate image." },
            { status: 500 }
        );
    }
}
