import "./globals.css"
import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "AI Product Intelligence",
  description: "Next-generation AI-powered product intelligence and marketplace platform",
}

import Chatbot from "@/components/Chatbot";
import SessionProvider from "@/components/SessionProvider";

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <SessionProvider>
          {children}
          <Chatbot />
        </SessionProvider>
      </body>
    </html>
  )
}
