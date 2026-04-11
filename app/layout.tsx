import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { ThemeInit } from "@/components/theme-init";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GestorCuentas",
  description: "Gestion de cuentas y carteras compartidas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <ThemeInit />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
