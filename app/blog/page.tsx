"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { BlogCard } from "@/components/blog-card"
import { Badge } from "@/components/ui/badge"

const categories = ["Tất cả", "Tin tức"]

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("Tất cả")
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  function formatDate(d: any) {
    try {
      const dt = typeof d === "string" ? new Date(d) : d instanceof Date ? d : null
      if (!dt || isNaN(dt.getTime())) return ""
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, "0")
      const dd = String(dt.getDate()).padStart(2, "0")
      return `${y}-${m}-${dd}`
    } catch {
      return ""
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await api("/api/BlogPosts")
        const mapped = Array.isArray(res)
          ? res.map((c: any) => ({
              slug: c.slug ?? c.Slug ?? String(c.blogId ?? c.BlogId),
              title: c.title ?? c.Title,
              excerpt: c.metaDescription ?? c.MetaDescription ?? "",
              image: c.featuredImage ?? c.FeaturedImage ?? "",
              author:
                c.author && (c.author.fullName ?? c.author.FullName)
                  ? (c.author.fullName ?? c.author.FullName)
                  : "Admin",
              date: formatDate(c.publishedDate ?? c.PublishedDate ?? c.createdAt ?? c.CreatedAt),
              category: "Tin tức",
              readTime: (() => {
                const text = c.content ?? c.Content ?? c.metaDescription ?? c.MetaDescription ?? ""
                const words = String(text).trim().split(/\s+/).filter(Boolean).length
                const mins = Math.max(1, Math.round(words / 200))
                return `${mins} phút đọc`
              })(),
            }))
          : []
        setPosts(mapped)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filteredPosts = selectedCategory === "Tất cả" ? posts : posts.filter((post) => post.category === selectedCategory)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Tin tức & Bài viết</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Khám phá kiến thức, mẹo hay và tin tức mới nhất về thế giới nhạc cụ
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={category === selectedCategory ? "default" : "secondary"}
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-2"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {loading && filteredPosts.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-muted-foreground">Đang tải...</div>
        ) : (
          filteredPosts.map((post) => <BlogCard key={post.slug} {...post} />)
        )}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Không tìm thấy bài viết nào</p>
        </div>
      )}
    </div>
  )
}
