import { CdpClient } from "@coinbase/cdp-sdk";
import { NextResponse } from "next/server";
import { isEligibleForFaucet } from "@/lib/faucet";

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Check if address is eligible for faucet funds
    const eligibility = await isEligibleForFaucet(address);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: "Not eligible for faucet",
          details: eligibility.reason,
          balance: eligibility.balance,
        },
        { status: 403 }
      );
    }

    // Validate that required environment variables are set
    const apiKeyId = process.env.CDP_API_KEY_ID;
    const apiKeySecret = process.env.CDP_API_KEY_SECRET;
    const walletSecret = process.env.CDP_WALLET_SECRET;

    if (!apiKeyId || !apiKeySecret || !walletSecret) {
      console.error("Missing CDP credentials in environment variables");
      return NextResponse.json(
        { error: "Server configuration error: CDP credentials not configured" },
        { status: 500 }
      );
    }

    // Initialize CDP client
    const cdp = new CdpClient();

    // Request USDC from faucet for the provided address
    const faucetResponse = await cdp.evm.requestFaucet({
      address: address,
      network: "base-sepolia",
      token: "usdc",
    });

    return NextResponse.json({
      success: true,
      transactionHash: faucetResponse.transactionHash,
      explorerUrl: `https://sepolia.basescan.org/tx/${faucetResponse.transactionHash}`,
      message: "USDC sent successfully to your wallet",
    });
  } catch (error) {
    console.error("Faucet error:", error);

    // Handle rate limiting or other API errors
    if (error && typeof error === "object" && "response" in error) {
      const apiError = error as { response?: { status?: number } };
      if (apiError.response?.status === 429) {
        return NextResponse.json(
          { error: "Rate limit reached. Please try again in 24 hours." },
          { status: 429 }
        );
      }
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to fund account",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
