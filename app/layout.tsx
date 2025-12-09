import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Audit Flow",
    description: "Deploy and audit Solidity smart contracts with AI-powered security analysis",
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
