import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600", "700", "800","900"],
  fallback: ["Roboto","Poppins", "sans-serif"],
  variable: "--outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plagiarism Checker",
  description: "Implementation of String Matching Algorithm in Plagiarism Checker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
