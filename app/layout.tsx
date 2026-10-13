import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PageViewTracker from "@/components/PageViewTracker";
import { Analytics } from "@vercel/analytics/next";

// Variable Fraunces with its optical-size and "soft" axes, plus a true
// italic (used for small labels in place of all-caps).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orivian — Free Online Courses",
  description: "Free courses and certification prep for every career, starting with IT and security.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="border-b border-brand-primary/20 bg-brand-surface-raised py-2 px-4 text-center text-sm text-brand-secondary">
          <span className="font-display italic text-brand-primary">Orivian is in beta.</span> Content, accounts and features may
          change or reset without notice.
        </div>
        <Navbar />
        {children}
        <Analytics />
        <PageViewTracker />
      </body>
    </html>
  );
}
