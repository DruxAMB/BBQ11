import { useMemo } from "react";
import { formatUnits } from "viem";
import { FAUCET_BALANCE_THRESHOLD } from "@/lib/faucet";
import { USDC } from "@/lib/usdc";

interface FaucetEligibility {
  isEligible: boolean;
  reason?: string;
  currentBalance: string;
  threshold: number;
}

/**
 * Hook to check if a user is eligible for faucet funds
 * Based on their current USDC balance
 */
export function useFaucetEligibility(
  balance: bigint | undefined
): FaucetEligibility {
  return useMemo(() => {
    if (balance === undefined) {
      return {
        isEligible: false,
        reason: "Balance loading...",
        currentBalance: "0",
        threshold: FAUCET_BALANCE_THRESHOLD,
      };
    }

    const balanceFormatted = formatUnits(balance, USDC.decimals);
    const balanceNumber = parseFloat(balanceFormatted);

    if (balanceNumber > FAUCET_BALANCE_THRESHOLD) {
      return {
        isEligible: false,
        reason: `You have ${balanceFormatted} USDC (threshold: ${FAUCET_BALANCE_THRESHOLD} USDC)`,
        currentBalance: balanceFormatted,
        threshold: FAUCET_BALANCE_THRESHOLD,
      };
    }

    return {
      isEligible: true,
      currentBalance: balanceFormatted,
      threshold: FAUCET_BALANCE_THRESHOLD,
    };
  }, [balance]);
}
