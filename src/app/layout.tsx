import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ClientLayout } from "@/components/ClientLayout";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Mission Control | DJ & Larry",
  description: "Our Command Center — Work, Life & Everything",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900 text-slate-100`}
      >
        <ClientLayout>
          <div className="flex min-h-screen">
            {/* Sidebar - Navigation handles mobile/desktop display */}
            <Navigation />

            {/* Main Content */}
            <main className="flex-1 overflow-auto pt-16 lg:pt-0 lg:ml-0">
              {children}
            </main>
          </div>
        </ClientLayout>
      </body>
    </html>
  );
}
