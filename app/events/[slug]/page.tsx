"use client"

import type React from "react"

import { useEffect, useMemo, useState, use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"
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

function formatTime(d: any) {
  try {
    const dt = typeof d === "string" ? new Date(d) : d instanceof Date ? d : null
    if (!dt || isNaN(dt.getTime())) return ""
    const hh = String(dt.getHours()).padStart(2, "0")
    const mm = String(dt.getMinutes()).padStart(2, "0")
    return `${hh}:${mm}`
  } catch {
    return ""
  }
}

function isUpcoming(start?: any) {
  if (!start) return false
  const dt = new Date(start)
  const today = new Date()
  return dt.getTime() >= new Date(today.toDateString()).getTime()
}

export default function EventDetailPage({ params }: { params: any }) {
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any | null>(null)

  const resolvedParams = use(params as any) as any
  const slug = (resolvedParams?.slug ?? "") as string

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await api("/api/Events")
        const list = Array.isArray(res) ? res : []
        const found = list.find((c: any) => (c.slug ?? c.Slug ?? "") === slug)
        if (!found) {
          notFound()
          return
        }
        const mapped = {
          id: found.eventId ?? found.EventId,
          title: found.title ?? found.Title ?? "",
          slug: found.slug ?? found.Slug ?? "",
          description: found.description ?? found.Description ?? "",
          date: formatDate(found.startDate ?? found.StartDate ?? found.createdAt ?? found.CreatedAt),
          time: formatTime(found.startDate ?? found.StartDate),
          location: found.location ?? found.Location ?? "",
          image: found.featuredImage ?? found.FeaturedImage ?? "",
          startRaw: found.startDate ?? found.StartDate ?? null,
        }
        setEvent(mapped)
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  const isClosed = useMemo(() => (event ? !isUpcoming(event.startRaw) : false), [event])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại sự kiện
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Event Details */}
        <div className="lg:col-span-2">
          {/* Event Image */}
          <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden mb-6">
            <img src={(event?.image || "/placeholder.svg") as string} alt={event?.title || "Event"} className="w-full h-full object-cover" />
            <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
              {event && isUpcoming(event.startRaw) ? "Sắp diễn ra" : "Đã kết thúc"}
            </Badge>
          </div>

          {/* Event Info */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">{event?.title || ""}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">{event?.description || ""}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Ngày diễn ra</p>
                  <p className="font-semibold text-foreground">{event?.date || ""}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Thời gian</p>
                  <p className="font-semibold text-foreground">{event?.time || ""}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg md:col-span-2">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Địa điểm</p>
                  <p className="font-semibold text-foreground">{event?.location || ""}</p>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="prose prose-lg max-w-none">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Về sự kiện</h2>
              <p className="text-muted-foreground leading-relaxed">
                Đây là một cơ hội tuyệt vời để bạn học hỏi, giao lưu và kết nối với cộng đồng yêu âm nhạc. Sự kiện sẽ
                được tổ chức bởi các chuyên gia hàng đầu trong ngành với nhiều năm kinh nghiệm.
              </p>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
