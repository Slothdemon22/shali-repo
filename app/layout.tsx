import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fatimas Collection | The Fabric of Pakistan",
  description: "The Fabric of Pakistan",
};

import AiAssistant from "@/components/AiAssistant";
import CartSidebar from "@/components/CartSidebar";
import AppToaster from "@/components/AppToaster";
import { CartProvider } from "@/context/CartContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <CartProvider>
          <div className="site-content">{children}</div>
          <AppToaster />
          <CartSidebar />
          <AiAssistant />
        </CartProvider>
      </body>
    </html>
  );
}
