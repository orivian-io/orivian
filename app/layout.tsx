import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orivian — Free Online Courses",
  description: "A free online learning platform for professionals, starting with CISSP certification prep.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="bg-yellow-500 text-black text-center text-sm font-medium py-2 px-4">
          🚧 Orivian is under active construction. Content, accounts, and features may change or reset without notice. 🚧
        </div>
        <Navbar />
        {children}
      </body>
    </html>
  );
}