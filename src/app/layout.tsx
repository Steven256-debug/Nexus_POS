import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navigation } from "@/components/navigation";
import { TopHeader } from "@/components/header";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { OfflineSyncProvider } from "@/components/offline-sync-provider";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Francis Amoako Ventures - POS & ERP System",
  description: "Enterprise Point of Sale and Inventory Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className={`${inter.variable} antialiased bg-background text-foreground min-h-screen`}>
        <Providers>
          <OfflineSyncProvider>
            <Toaster position="top-right" richColors closeButton />
            <div className="flex flex-col lg:flex-row min-h-screen">
              <Navigation />
              <main className="flex-1 pb-20 lg:pb-0 lg:ml-20 flex flex-col min-h-screen">
                <TopHeader />
                <div className="flex-1 p-4 md:p-8">
                  {children}
                </div>
              </main>
            </div>
          </OfflineSyncProvider>
        </Providers>
      </body>
    </html>
  );
}
