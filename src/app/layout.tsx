import "./globals.css";
import Providers from "@/components/Providers";
import dynamic from "next/dynamic";

// Dynamically import ThemeScript to avoid SSR errors
const ThemeScript = dynamic(() => import("@/components/ThemeScript"), { ssr: false });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeScript />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
