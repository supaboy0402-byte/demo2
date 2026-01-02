"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface WishlistItem {
  productId: string
  name: string
  price: number
  image: string
  slug: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  toggleItem: (item: WishlistItem) => void
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const { toast } = useToast()

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlist")
    if (savedWishlist) {
      setItems(JSON.parse(savedWishlist))
    }
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(items))
  }, [items])

  const addItem = (item: WishlistItem) => {
    const exists = items.some((i) => i.productId === item.productId)
    if (exists) return
    setItems([...items, item])
    toast({
      title: "Đã thêm vào yêu thích",
      description: `${item.name} đã được thêm vào danh sách yêu thích`,
    })
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
    toast({
      title: "Đã xóa khỏi yêu thích",
      description: "Sản phẩm đã được xóa khỏi danh sách yêu thích",
    })
  }

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.productId === productId)
  }

  const toggleItem = (item: WishlistItem) => {
    if (isInWishlist(item.productId)) {
      removeItem(item.productId)
    } else {
      addItem(item)
    }
  }

  const clearWishlist = () => {
    setItems([])
    toast({
      title: "Đã xóa danh sách yêu thích",
      description: "Tất cả sản phẩm đã được xóa",
    })
  }

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, isInWishlist, toggleItem, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider")
  }
  return context
}
