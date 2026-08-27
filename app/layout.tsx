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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500&family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
