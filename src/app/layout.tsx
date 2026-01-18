import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimCity Web - Build Your Dream City",
  description: "A beautiful city-building simulation game. Build roads, zones, and watch your city grow!",
  keywords: ["simcity", "city builder", "simulation", "game", "web game"],
  authors: [{ name: "SimCity Web" }],
  openGraph: {
    title: "SimCity Web - Build Your Dream City",
    description: "A beautiful city-building simulation game. Build roads, zones, and watch your city grow!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SimCity Web - Build Your Dream City",
    description: "A beautiful city-building simulation game. Build roads, zones, and watch your city grow!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
