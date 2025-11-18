import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Studio of G10",
  description: "Portraits & Life Stories Captured with Heart",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-brand-background`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#F5EEEB",
              color: "#2B2520",
              border: "1px solid #B8AFA3",
            },
            success: {
              iconTheme: {
                primary: "#D4A574",
                secondary: "#2B2520",
              },
            },
            error: {
              iconTheme: {
                primary: "#EA4335",
                secondary: "#FAFAF8",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
