"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  slug: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const { toast } = useToast()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setItems(JSON.parse(savedCart))
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    const existingItem = items.find((i) => i.productId === item.productId)
    if (existingItem) {
      setItems((prev) => prev.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i)))
      toast({
        title: "Đã cập nhật giỏ hàng",
        description: `Số lượng ${item.name} đã được tăng lên`,
      })
      return
    }
    setItems([...items, { ...item, quantity }])
    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${item.name} đã được thêm vào giỏ hàng`,
    })
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
    toast({
      title: "Đã xóa khỏi giỏ hàng",
      description: "Sản phẩm đã được xóa khỏi giỏ hàng",
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setItems([])
    toast({
      title: "Đã xóa giỏ hàng",
      description: "Tất cả sản phẩm đã được xóa khỏi giỏ hàng",
    })
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}
