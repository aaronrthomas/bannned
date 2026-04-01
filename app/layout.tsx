import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BANNNED — The Best Streetwears Are Only Here",
  description: "Premium streetwear and hoodies. Explore the latest collections of hoodies, caps, bags, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
