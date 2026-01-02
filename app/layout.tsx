import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/lib/contexts/cart-context"
import { WishlistProvider } from "@/lib/contexts/wishlist-context"
import { AuthProvider } from "@/lib/contexts/auth-context"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "Harmony Music Store - Nhạc cụ chất lượng cao",
  description: "Cửa hàng nhạc cụ chuyên nghiệp - Guitar, Piano, Drum và phụ kiện",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Navbar />
              <main className="min-h-screen">{children}</main>
              <Footer />
              <Toaster />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
