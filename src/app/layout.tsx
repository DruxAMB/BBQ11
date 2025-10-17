import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { type ReactNode } from "react";
import { cookieToInitialState } from "wagmi";
import { Toaster } from "sonner";

import { getConfig } from "../wagmi";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Image Generator",
  description: "Generate and reimagine images with AI. Pay $0.1 per generation using crypto.",
};

export default function RootLayout(props: { children: ReactNode }) {
  const initialState = cookieToInitialState(
    getConfig(),
    headers().get("cookie")
  );
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers initialState={initialState}>{props.children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
