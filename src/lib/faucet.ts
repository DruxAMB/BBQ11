import { createPublicClient, http, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { USDC, erc20Abi } from "./usdc";

// Minimum balance threshold - if user has more than this, they can't use the faucet
export const FAUCET_BALANCE_THRESHOLD = 0.1;

/**
 * Check if an address is eligible for faucet funds
 * Returns true if balance is <= threshold
 */
export async function isEligibleForFaucet(
  address: string
): Promise<{ eligible: boolean; balance: string; reason?: string }> {
  try {
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    const balance = await publicClient.readContract({
      address: USDC.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    const balanceFormatted = formatUnits(balance, USDC.decimals);
    const balanceNumber = parseFloat(balanceFormatted);

    if (balanceNumber > FAUCET_BALANCE_THRESHOLD) {
      return {
        eligible: false,
        balance: balanceFormatted,
        reason: `Balance (${balanceFormatted} USDC) exceeds threshold of ${FAUCET_BALANCE_THRESHOLD} USDC`,
      };
    }

    return {
      eligible: true,
      balance: balanceFormatted,
    };
  } catch (error) {
    console.error("Error checking faucet eligibility:", error);
    throw new Error("Failed to check faucet eligibility");
  }
}
