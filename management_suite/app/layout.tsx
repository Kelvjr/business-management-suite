import type { Metadata } from "next";
import { Geist, Manrope } from "next/font/google";
import { BusinessSettingsProvider } from "@/components/providers/business-settings-provider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Renaissance | Business OS",
  description: "A refined operating system for sales, spending, customers, inventory, purchasing, and financial intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning className={`${geist.variable} ${manrope.variable}`}><head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var d=localStorage.getItem('renaissance-theme-v2')==='dark';document.documentElement.classList.toggle('dark',d);localStorage.removeItem('renaissance-theme')}catch(e){}})()` }}/></head><body><BusinessSettingsProvider>{children}</BusinessSettingsProvider></body></html>;
}
