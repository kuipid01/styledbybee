import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://styledbybee.com"),
  title: {
    default: "StyledByBee Booking",
    template: "%s | StyledByBee",
  },
  description:
    "Premium South East London hairstylist booking for braids and twists.",
  applicationName: "StyledByBee",
  authors: [{ name: "StyledByBee" }],
  keywords: [
    "StyledByBee",
    "South East London hairstylist",
    "braids",
    "knotless braids",
    "box braids",
    "twists",
    "hair booking",
  ],
  creator: "StyledByBee",
  publisher: "StyledByBee",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "StyledByBee Booking",
    description:
      "Book premium braids and twists with StyledByBee in South East London.",
    siteName: "StyledByBee",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "StyledByBee Booking",
    description:
      "Book premium braids and twists with StyledByBee in South East London.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${syne.variable}`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: {
              background: "#171614",
              border: "1px solid #3b3429",
              color: "#f5f5f5",
            },
          }}
        />
      </body>
    </html>
  );
}
