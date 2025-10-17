import Replicate from "replicate";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const uploadedImage = formData.get('image') as File | null;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Validate Replicate API token
    const replicateApiToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateApiToken) {
      console.error("Missing Replicate API token");
      return NextResponse.json(
        { error: "Server configuration error: Replicate API token not configured" },
        { status: 500 }
      );
    }

    // Initialize Replicate
    const replicate = new Replicate({
      auth: replicateApiToken,
    });

    let output;

    if (uploadedImage) {
      // Image-to-image generation using Nano Banana
      console.log("Processing image-to-image generation with Nano Banana...");

      // Convert uploaded image to base64 for Replicate
      const imageBuffer = Buffer.from(await uploadedImage.arrayBuffer());
      const base64Image = imageBuffer.toString('base64');
      const mimeType = uploadedImage.type || 'image/png';

      output = await replicate.run(
        "google/nano-banana",
        {
          input: {
            prompt: prompt,
            image_input: [`data:${mimeType};base64,${base64Image}`],
            aspect_ratio: "1:1",
            output_format: "png",
          }
        }
      );
    } else {
      // Text-to-image generation using Nano Banana
      console.log("Processing text-to-image generation with Nano Banana...");

      output = await replicate.run(
        "google/nano-banana",
        {
          input: {
            prompt: prompt,
            image_input: [], // Empty array for text-only generation
            aspect_ratio: "1:1",
            output_format: "png",
          }
        }
      );
    }

    // Nano Banana returns an object with a url() method
    const imageUrl = (output as any).url();

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      prompt: uploadedImage ? `Reimagined: ${prompt}` : prompt,
    });
  } catch (error) {
    console.error("Image generation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
