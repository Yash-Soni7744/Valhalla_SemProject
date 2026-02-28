import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MiEstilo Leads CRM",
  description: "Manufacturing CRM for Garments & Bedding",
};


/**
 * ROOT LAYOUT
 * 
 * This is the very first file Next.js loads. 
 * It sets up the HTML structure for the entire website.
 * We wrap everything in <AuthProvider> so that every page knows
 * if a user is logged in or not.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <AuthProvider>

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}


