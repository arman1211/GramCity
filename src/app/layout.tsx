import type { Metadata } from "next";
import { DM_Sans, Hind_Siliguri } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-en",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-bn",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "GramCity Express | গ্রামসিটি এক্সপ্রেস",
    template: "%s | GramCity Express",
  },
  description:
    "Community parcel delivery with travelers already going your way — Bangladesh demo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${dmSans.variable} ${hindSiliguri.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
