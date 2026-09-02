import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MediTrack — Your Personal Health Dashboard",
    template: "%s | MediTrack",
  },
  description:
    "MediTrack helps you manage your medications, appointments, and vital signs in one secure, easy-to-use platform.",
  keywords: ["medical tracking", "health dashboard", "medications", "appointments", "vitals"],
  authors: [{ name: "MediTrack" }],
  openGraph: {
    title: "MediTrack — Your Personal Health Dashboard",
    description:
      "Manage your medications, appointments, and vital signs securely in one place.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}