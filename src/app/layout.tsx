import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import GlobalEffects from "@/components/effects/GlobalEffects";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CVEEEZ | بوابة التوظيف - سجل الآن",
  description:
    "سجل في وظائف CVEEEZ - فرص عمل متنوعة في التصميم، البرمجة، التسويق، كتابة المحتوى وأكثر. انضم لفريقنا الآن!",
  keywords: [
    "وظائف",
    "توظيف",
    "CVEEEZ",
    "سيرة ذاتية",
    "تقديم وظيفة",
    "فرص عمل",
    "مصمم",
    "مبرمج",
    "تسويق",
  ],
  openGraph: {
    title: "CVEEEZ | بوابة التوظيف",
    description: "سجل في وظائف CVEEEZ - فرص عمل متنوعة. انضم لفريقنا الآن!",
    type: "website",
    locale: "ar_EG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans antialiased`}>
        <GlobalEffects />
        {children}
      </body>
    </html>
  );
}
