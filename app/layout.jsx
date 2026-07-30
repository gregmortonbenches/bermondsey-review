import { Zilla_Slab, Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";

const zilla = Zilla_Slab({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-zilla",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "The Bermondsey Review",
  description:
    "A fortnightly, free publication about Bermondsey, London — plus books, film, and whatever else we're reading.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${zilla.variable} ${sourceSerif.variable} ${inter.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
