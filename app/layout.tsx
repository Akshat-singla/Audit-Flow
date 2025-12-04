import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Smart Contract Deployer",
    description: "Deploy Solidity smart contracts to EVM networks",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
