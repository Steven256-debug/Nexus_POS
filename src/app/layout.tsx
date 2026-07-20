import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navigation } from "@/components/navigation";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Nexus POS MVP",
  description: "Point of Sale and Inventory Management System",
};

import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <Providers>
          <div className="flex flex-col lg:flex-row min-h-screen">
            <Navigation />
            <main className="flex-1 pb-20 lg:pb-0 lg:ml-64 min-h-screen">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
