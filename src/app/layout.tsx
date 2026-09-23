import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sky IPTV",
  description: "Your personal TV lounge",
  icons: {
    icon: "/sky-iptv-logo-5.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
