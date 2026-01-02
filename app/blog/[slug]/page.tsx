"use client"
import { Calendar, User, Clock, Facebook, Twitter, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BlogCard } from "@/components/blog-card"
import { api } from "@/lib/api"
import Link from "next/link"
import React from "react"
import { useToast } from "@/hooks/use-toast"

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

function calcReadTime(t: string) {
  const words = String(t || "").trim().split(/\s+/).filter(Boolean).length
  const mins = Math.max(1, Math.round(words / 200))
  return `${mins} phút đọc`
}

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const [article, setArticle] = React.useState<any | null>(null)
  const [relatedPosts, setRelatedPosts] = React.useState<any[]>([])
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await api(`/api/BlogPosts/slug/${slug}`)
        const mapped = res && typeof res === 'object' ? {
          slug: res.slug ?? res.Slug ?? String(res.blogId ?? res.BlogId),
          title: res.title ?? res.Title,
          excerpt: res.metaDescription ?? res.MetaDescription ?? "",
          content: res.content ?? res.Content ?? "",
          image: res.featuredImage ?? res.FeaturedImage ?? "",
          author: res.author && (res.author.fullName ?? res.author.FullName) ? (res.author.fullName ?? res.author.FullName) : "Admin",
          date: formatDate(res.publishedDate ?? res.PublishedDate ?? res.createdAt ?? res.CreatedAt),
          category: "Tin tức",
          readTime: calcReadTime(res.content ?? res.Content ?? res.metaDescription ?? res.MetaDescription ?? ""),
        } : null
        setArticle(mapped)
        const list = await api('/api/BlogPosts')
        const related = Array.isArray(list) ? list
          .filter((p: any) => (p.slug ?? p.Slug) !== (res.slug ?? res.Slug))
          .slice(0, 2)
          .map((c: any) => ({
            slug: c.slug ?? c.Slug ?? String(c.blogId ?? c.BlogId),
            title: c.title ?? c.Title,
            excerpt: c.metaDescription ?? c.MetaDescription ?? "",
            image: c.featuredImage ?? c.FeaturedImage ?? "",
            author: c.author && (c.author.fullName ?? c.author.FullName) ? (c.author.fullName ?? c.author.FullName) : "Admin",
            date: formatDate(c.publishedDate ?? c.PublishedDate ?? c.createdAt ?? c.CreatedAt),
            category: "Tin tức",
            readTime: calcReadTime(c.content ?? c.Content ?? c.metaDescription ?? c.MetaDescription ?? ""),
          })) : []
        setRelatedPosts(related)
      } catch {
        setArticle(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy bài viết</h1>
        <Button asChild>
          <Link href="/blog">Quay lại trang tin tức</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-8">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Trang chủ
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/blog" className="hover:text-foreground">
              Tin tức
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground line-clamp-1">{article.title}</li>
        </ol>
      </nav>

      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <Badge className="mb-4">{article.category}</Badge>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{article.readTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Chia sẻ:</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                const url = typeof window !== 'undefined' ? window.location.href : ''
                if (!url) return
                const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
                window.open(shareUrl, '_blank', 'noopener,noreferrer')
              }}
            >
              <Facebook className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                const url = typeof window !== 'undefined' ? window.location.href : ''
                if (!url) return
                const text = article.title || ''
                const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
                window.open(shareUrl, '_blank', 'noopener,noreferrer')
              }}
            >
              <Twitter className="h-4 w-4" />
            </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              try {
                const url = typeof window !== 'undefined' ? window.location.href : ''
                if (url) navigator.clipboard?.writeText(url)
                toast({ title: "Đã sao chép liên kết" })
              } catch {}
            }}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-video bg-secondary rounded-lg overflow-hidden mb-8">
          <img src={article.image || "/placeholder.svg"} alt={article.title} className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-12 text-foreground">
          {article.excerpt ? (
            <p className="text-lg leading-relaxed">{article.excerpt}</p>
          ) : null}
          {article.content ? (
            <div className="leading-relaxed whitespace-pre-line">{article.content}</div>
          ) : null}
        </div>

        <Separator className="my-12" />

        {/* Author Info */}
        <div className="bg-muted rounded-lg p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Về tác giả: {article.author}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chuyên gia tư vấn nhạc cụ với hơn 10 năm kinh nghiệm trong ngành. Đam mê chia sẻ kiến thức và giúp đỡ
                người mới bắt đầu tìm được nhạc cụ phù hợp.
              </p>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((post) => (
                <BlogCard key={post.slug} {...post} />
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
