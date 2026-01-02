import Link from "next/link"
import { Calendar, User, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BlogCardProps {
  slug: string
  title: string
  excerpt: string
  image: string
  author: string
  date: string
  category: string
  readTime?: string
}

export function BlogCard({ slug, title, excerpt, image, author, date, category, readTime }: BlogCardProps) {
  return (
    <article className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link href={`/blog/${slug}`} className="block relative aspect-[16/10] bg-secondary overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-4 left-4">{category}</Badge>
      </Link>
      <div className="p-6">
        <Link href={`/blog/${slug}`}>
          <h3 className="font-serif text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">{excerpt}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{date}</span>
            </div>
          </div>
          {readTime && <span>{readTime}</span>}
        </div>
        <Link
          href={`/blog/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all mt-4"
        >
          Đọc thêm
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
