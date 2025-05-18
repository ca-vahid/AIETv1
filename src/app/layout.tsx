import "./globals.css";
import Providers from "@/components/Providers";
import dynamic from "next/dynamic";
import { Metadata, Viewport } from "next";

// Dynamically import ThemeScript to avoid SSR errors
const ThemeScript = dynamic(() => import("@/components/ThemeScript"), { ssr: false });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "AIET Portal - BGC Engineering & Cambio Earth",
  description: "Revolutionize Your Workflow with AI at Cambio Earth & BGC!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeScript />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
