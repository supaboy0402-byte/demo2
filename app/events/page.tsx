"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react"
import { api } from "@/lib/api"

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

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await api("/api/Events")
        const mapped = Array.isArray(res)
          ? res.map((c: any) => ({
              id: c.eventId ?? c.EventId,
              title: c.title ?? c.Title ?? "",
              slug: c.slug ?? c.Slug ?? "",
              description: c.description ?? c.Description ?? "",
              date: formatDate(c.startDate ?? c.StartDate ?? c.createdAt ?? c.CreatedAt),
              time: formatTime(c.startDate ?? c.StartDate),
              location: c.location ?? c.Location ?? "",
              image: c.featuredImage ?? c.FeaturedImage ?? "",
              startRaw: c.startDate ?? c.StartDate ?? null,
              status: c.status ?? c.Status ?? 1,
            }))
          : []
        setEvents(mapped.filter((e) => Number((e as any).status ?? 1) === 1))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const upcomingEvents = events.filter((e) => isUpcoming(e.startRaw))
  const endedEvents = events.filter((e) => !isUpcoming(e.startRaw))

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Sự kiện</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Tham gia các workshop, buổi biểu diễn và sự kiện âm nhạc đặc biệt tại Harmony
        </p>
      </div>

      {/* Events Grid */}
      {upcomingEvents.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Sắp diễn ra</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {upcomingEvents.map((event) => (
              <article
                key={event.slug}
                className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-video bg-secondary overflow-hidden">
                  <img
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    {isUpcoming(event.startRaw) ? "Sắp diễn ra" : "Đã kết thúc"}
                  </Badge>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{event.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{event.date}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{event.time || ""}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{event.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Button asChild>
                      <Link href={`/events/${event.slug}`}>
                        Xem sự kiện
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {loading && upcomingEvents.length === 0 && endedEvents.length === 0 ? (
        <div className="text-center text-muted-foreground">Đang tải sự kiện...</div>
      ) : null}

      {!loading && upcomingEvents.length === 0 && (
        <>
          {endedEvents.length === 0 ? (
            <div className="text-center text-muted-foreground">Không có sự kiện nào</div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Sự kiện đã kết thúc</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {endedEvents.map((event) => (
                  <article
                    key={event.slug || String(event.id)}
                    className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative aspect-video bg-secondary overflow-hidden">
                      <img
                        src={event.image || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">Đã kết thúc</Badge>
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{event.description}</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{event.date}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{event.time || ""}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
