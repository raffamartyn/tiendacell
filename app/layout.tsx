import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockCenter | Repuestos para celulares",
  description:
    "Repuestos y accesorios para celulares. Entregas realizadas por DeliveryBald.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}