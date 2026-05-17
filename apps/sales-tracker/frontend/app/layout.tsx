import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/layout/sidebar-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sales Tracker",
  description: "Small business sales tracking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <SidebarProvider>
          {children}
          <Toaster richColors position="top-right" />
        </SidebarProvider>
      </body>
    </html>
  );
}
