import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BluetoothProvider } from "./bt_provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Daly BMS Dashboard",
  description: "Dashboard which is automatically updated with the latest data from a Daly BMS over Bluetooth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BluetoothProvider>{children}</BluetoothProvider>
        <Toaster />
      </body>
    </html>
  );
}
