import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BluetoothProvider } from "./bt_provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

const TITLE = "Daly BMS Dashboard";
const TEMPLATE = "%s - Dashboard";
const DESCRIPTION = "Dashboard which is automatically updated with the latest data from a Daly BMS over Bluetooth.";

export const metadata: Metadata = {
	applicationName: TITLE,
	manifest: "/manifest.json",
	title: TITLE,
	authors: [{ name: "Bohdan Vanieiev", url: "https://github.com/warchant" }],
	creator: "Bohdan Vanieiev",
	icons: [
		{ rel: "icon", sizes: "16x16", url: "/favicon-16x16.png" },
		{ rel: "icon", sizes: "32x32", url: "/favicon-32x32.png" },
		{ rel: "apple-touch-icon", url: "apple-touch-icon.png" }
	],
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: TITLE,
	},
	formatDetection: {
		telephone: false
	},
	openGraph: {
		type: "website",
		siteName: TITLE,
		description: DESCRIPTION,
		title: {
			default: TITLE,
			template: TEMPLATE,
		}
	},
	description: DESCRIPTION,
};


export const viewport: Viewport = {
	themeColor: "#FFFFFF",
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
