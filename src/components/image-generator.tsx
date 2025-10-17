"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Image as ImageIcon, Download, Upload } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { encodeFunctionData, parseUnits, parseEther } from "viem";

interface GeneratedImage {
  imageUrl: string;
  prompt: string;
  timestamp: Date;
}

export default function ImageGenerator() {
  const account = useAccount();
  const { data: balance } = useBalance({
    address: account.address,
  });
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GeneratedImage[]>([]);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toastId, setToastId] = useState<string | number | null>(null);

  const {
    sendTransaction,
    data: hash,
    isPending: isTransactionPending,
    reset: resetTransaction,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Handle transaction confirmation - similar to Post.tsx
  useEffect(() => {
    if (isConfirmed && toastId !== null) {
      toast.success("Payment confirmed!", {
        description: "0.00005 ETH payment confirmed. Generating your image...",
        duration: 2000,
      });

      setTimeout(() => {
        toast.dismiss(toastId);
      }, 0);

      setToastId(null);
      resetTransaction();
    }
  }, [isConfirmed, toastId, resetTransaction]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast.success("Image uploaded successfully!");
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (!account.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsGenerating(true);

    try {
      // Process the $0.00005 ETH payment
      sendTransaction({
        to: "0xaf59B12ea11914A0373ffbb13FF8b03F8537C599" as `0x${string}`,
        value: parseEther("0.00005"), // 0.00005 ETH
      });

      // Show payment toast - same as Post.tsx
      const toastId_ = toast("Processing payment...", {
        description: "Paying 0.00005 ETH for image generation",
        duration: Infinity,
      });

      setToastId(toastId_);

      // Wait for transaction confirmation before generating image
      // This is different from Post.tsx - we need to block here for image generation
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      while (!isConfirmed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        if (isConfirmed) break;
      }

      if (!isConfirmed) {
        throw new Error("Payment confirmation timeout - transaction may have failed");
      }

      // Call the generation API only after payment is confirmed
      const formData = new FormData();
      formData.append('prompt', prompt);
      
      if (uploadedImage) {
        formData.append('image', uploadedImage);
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData, // Send as FormData for file upload
      });

      const apiData = await response.json();

      if (!response.ok) {
        throw new Error(apiData.error || "Failed to generate image");
      }

      const newImage: GeneratedImage = {
        imageUrl: apiData.imageUrl,
        prompt: uploadedImage ? `Reimagined: ${prompt}` : prompt,
        timestamp: new Date(),
      };

      // Validate that we have a valid URL
      if (!newImage.imageUrl || typeof newImage.imageUrl !== 'string') {
        throw new Error("Invalid image URL received from API");
      }

      setGeneratedImage(newImage);
      setGenerationHistory(prev => [newImage, ...prev.slice(0, 4)]);
      toast.success("Image generated successfully!");

    } catch (error) {
      console.error("Generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
      resetTransaction();
      if (toastId) {
        toast.dismiss(toastId);
        setToastId(null);
      }
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            AI Image Generator & Reimager 🍌
          </CardTitle>
          <CardDescription>
            Generate new images from text or reimagine existing ones with nano banna. Each generation costs $0.1.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={uploadedImage ? "How should the AI reimagine this image?" : "Describe the image you want to generate..."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isGenerating && !isTransactionPending) {
                  handleGenerate();
                }
              }}
            />
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || !account.address || isGenerating || isTransactionPending || isConfirming}
              className={`min-w-[120px] ${isGenerating || isTransactionPending || isConfirming ? 'animate-pulse' : ''}`}
            >
              {isGenerating || isTransactionPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isTransactionPending ? "Paying..." : isConfirming ? "Confirming..." : "Generating..."}
                </>
              ) : (
                <>
                  Generate
                </>
              )}
            </Button>
          </div>

          {/* File Upload Section */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
            <div className="text-center space-y-2">
              {uploadedImagePreview ? (
                <div className="space-y-2">
                  <div className="relative mx-auto max-w-xs">
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded"
                      className="w-full rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={clearUploadedImage}
                    >
                      ×
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Image uploaded! The AI will reimagine it based on your prompt.
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Upload an image to reimagine (optional)</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, or WEBP up to 10MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                  >
                    Choose File
                  </Button>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {!account.address && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              Connect your wallet to start generating images. Each generation costs 0.00005 ETH.
            </div>
          )}

          {/* Conditional Content: Loading, Generated Image, or History */}
          {isGenerating && (
            <div className="space-y-4 pt-4 border-t">
              <div className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Your Image
                </CardTitle>
                <CardDescription className="mt-2">
                  AI is creating your image... This may take a few seconds
                </CardDescription>
              </div>
              <div className="relative mx-auto max-w-md">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                      <ImageIcon className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Creating magic...
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse rounded-lg"></div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse rounded-full"></div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Processing your payment and generating image...
                </p>
              </div>
            </div>
          )}

          {generatedImage && !isGenerating && (
            <div className="space-y-4 pt-4 border-t">
              <div className="text-center">
                <CardTitle>Latest Generation</CardTitle>
                <CardDescription>Prompt: "{generatedImage.prompt}"</CardDescription>
              </div>
              <div className="relative mx-auto max-w-md">
                <img
                  src={generatedImage.imageUrl}
                  alt={generatedImage.prompt}
                  className="w-full rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-500"
                />
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={() => downloadImage(generatedImage.imageUrl, `generated-image-${Date.now()}.webp`)}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Image
                </Button>
              </div>
            </div>
          )}

          {generationHistory.length > 1 && !generatedImage && !isGenerating && (
            <div className="space-y-4 pt-4 border-t">
              <div className="text-center">
                <CardTitle>Recent Generations</CardTitle>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generationHistory.slice(1).map((image, index) => (
                  <div key={index} className="space-y-2">
                    <img
                      src={image.imageUrl}
                      alt={image.prompt}
                      className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setGeneratedImage(image)}
                    />
                    <p className="text-xs text-muted-foreground truncate" title={image.prompt}>
                      {image.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
