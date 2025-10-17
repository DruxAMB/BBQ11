import { useMutation } from "@tanstack/react-query";

interface FaucetRequest {
  address: string;
}

interface FaucetResponse {
  success: boolean;
  transactionHash: string;
  explorerUrl: string;
  message: string;
}

interface FaucetError {
  error: string;
  details?: string;
}

async function requestFaucet(address: string): Promise<FaucetResponse> {
  const response = await fetch("/api/faucet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ address }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as FaucetError;
    throw new Error(error.error || "Failed to fund account");
  }

  return data as FaucetResponse;
}

export function useFaucet() {
  return useMutation({
    mutationFn: (request: FaucetRequest) => requestFaucet(request.address),
    retry: false,
  });
}
