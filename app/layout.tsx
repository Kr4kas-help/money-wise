import type { Metadata, Viewport } from "next";
import { Literata, Onest } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import WarningModal from "@/components/WarningModal";
import { ProfileProvider } from "@/lib/store";

const serif = Literata({
  subsets: ["latin", "cyrillic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Из долгов — к мечте",
  description:
    "Расскажите о доходе, долгах и целях. Получите понятный план: сколько отдавать, сколько откладывать и когда исполнится желаемое.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen">
        <ProfileProvider>
          <Header />
          <WarningModal />
          <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
        </ProfileProvider>
      </body>
    </html>
  );
}
