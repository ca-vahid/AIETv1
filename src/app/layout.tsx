import "./globals.css";
import Providers from "@/components/Providers";
import dynamic from "next/dynamic";
import { Metadata } from "next";

// Dynamically import ThemeScript to avoid SSR errors
const ThemeScript = dynamic(() => import("@/components/ThemeScript"), { ssr: false });

export const metadata: Metadata = {
  title: "AIET Portal - BGC Engineering & Cambio Earth",
  description: "Unlock AI & Automation Opportunities with the AI Efficiency Team",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
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
