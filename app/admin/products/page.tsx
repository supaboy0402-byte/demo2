"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, Eye, Image as ImageIcon, List as ListIcon, Tag as TagIcon, Clipboard, X } from "lucide-react"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api, apiBase } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// Mock products data
const mockProducts = [
  {
    id: "1",
    name: "Yamaha FG800 Acoustic Guitar",
    category: "Guitar",
    price: 5500000,
    stock: 15,
    status: "active",
    image: "/yamaha-acoustic-guitar.jpg",
  },
  {
    id: "2",
    name: "Fender Player Stratocaster",
    category: "Guitar",
    price: 18500000,
    stock: 8,
    status: "active",
    image: "/fender-stratocaster.jpg",
  },
  {
    id: "3",
    name: "Roland FP-30X Digital Piano",
    category: "Piano",
    price: 15900000,
    stock: 5,
    status: "active",
    image: "/roland-digital-piano.jpg",
  },
  {
    id: "4",
    name: "Pearl Export Series Drum Kit",
    category: "Drum",
    price: 22000000,
    stock: 0,
    status: "out_of_stock",
    image: "/pearl-drum-kit.jpg",
  },
]

export default function AdminProductsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [images, setImages] = useState<any[]>([])
  const [specs, setSpecs] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [tagMappings, setTagMappings] = useState<any[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [brandFilter, setBrandFilter] = useState<string>("all")
  const [tagFilter, setTagFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date_desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [imagesOpen, setImagesOpen] = useState(false)
  const [specsOpen, setSpecsOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [managingProduct, setManagingProduct] = useState<any | null>(null)
  const [previewProduct, setPreviewProduct] = useState<any | null>(null)
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false)
  const [disableTarget, setDisableTarget] = useState<any | null>(null)
  const [forceDeleteConfirmOpen, setForceDeleteConfirmOpen] = useState(false)
  const [forceDeleteTarget, setForceDeleteTarget] = useState<any | null>(null)
  const [newImage, setNewImage] = useState<any>({ imageUrl: "", altText: "", sortOrder: "", isMain: false })
  const [newSpec, setNewSpec] = useState<any>({ specName: "", specValue: "" })
  const [newSpecs, setNewSpecs] = useState<Array<{ specName: string; specValue: string }>>([
    { specName: "", specValue: "" },
  ])
  const [selectedTagId, setSelectedTagId] = useState<string>("")
  const [newTagName, setNewTagName] = useState<string>("")
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [matchAllTags, setMatchAllTags] = useState<boolean>(false)
  const [createForm, setCreateForm] = useState<any>({
    productName: "",
    slug: "",
    sku: "",
    parentCategoryId: "",
    categoryId: "",
    brandId: "",
    unitPrice: "",
    discountPrice: "",
    quantity: "",
    status: "1",
    isFeatured: false,
    metaDescription: "",
    description: "",
  })
  const [editForm, setEditForm] = useState<any>({
    productName: "",
    slug: "",
    sku: "",
    parentCategoryId: "",
    categoryId: "",
    brandId: "",
    unitPrice: "",
    discountPrice: "",
    quantity: "",
    status: "",
    isFeatured: false,
    metaDescription: "",
    description: "",
  })

  const [draggingImageId, setDraggingImageId] = useState<number | null>(null)
  const [isDropActive, setIsDropActive] = useState<boolean>(false)
  const [uploadingImages, setUploadingImages] = useState<boolean>(false)

  function resolveImg(url: string | null | undefined) {
    const u = String(url || "").trim()
    if (!u) return ""
    if (u.startsWith("http://") || u.startsWith("https://")) return u
    return apiBase + u
  }

  const imagesOfManaging = useMemo(() => {
    if (!managingProduct) return []
    return images
      .filter((i) => Number(i?.productId) === Number(managingProduct?.id))
      .sort((a, b) => Number(a?.sortOrder ?? 9999) - Number(b?.sortOrder ?? 9999))
  }, [images, managingProduct])

  const [imageOrder, setImageOrder] = useState<number[]>([])

  useEffect(() => {
    const initial = imagesOfManaging.map((i) => Number(i?.imageId))
    setImageOrder(initial)
  }, [imagesOpen, managingProduct, imagesOfManaging])

  async function uploadProductImages(files: File[] | FileList) {
    if (!managingProduct) return
    const pid = Number(managingProduct.id)
    const arr = Array.from(files as FileList).filter((f) => f && f.size > 0)
    if (arr.length === 0) return
    setUploadingImages(true)
    try {
      const fd = new FormData()
      for (const f of arr) fd.append("files", f)
      const created = await api(`/api/ProductImages/upload/${pid}`, { method: "POST", body: fd })
      setImages((prev) => [...created, ...prev])
      const newerOrder = [...imageOrder, ...created.map((c: any) => Number(c?.imageId))]
      setImageOrder(newerOrder)
      toast({ title: "Đã tải lên ảnh", description: `${arr.length} file` })
    } catch (err: any) {
      toast({ title: "Upload thất bại", description: err?.message || "Vui lòng thử lại" })
    } finally {
      setUploadingImages(false)
    }
  }

  async function commitImageReorder(order: number[]) {
    if (!managingProduct || order.length === 0) return
    const pid = Number(managingProduct.id)
    const payload: any = { imageIds: order, mainImageId: order[0] }
    const updated = await api(`/api/ProductImages/reorder/${pid}`, { method: "POST", body: JSON.stringify(payload) })
    setImages((prev) => {
      const byId = new Map<number, any>(updated.map((u: any) => [Number(u.imageId), u]))
      return prev.map((i) => byId.get(Number(i.imageId)) || i)
    })
    toast({ title: "Đã sắp xếp ảnh" })
  }

  function onDragStartImage(id: number) {
    setDraggingImageId(id)
  }

  function onDropOnImage(targetId: number) {
    return (e: React.DragEvent) => {
      e.preventDefault()
      const fromId = draggingImageId
      setDraggingImageId(null)
      if (!fromId) return
      setImageOrder((prev) => {
        const idxFrom = prev.indexOf(fromId)
        const idxTo = prev.indexOf(targetId)
        if (idxFrom < 0 || idxTo < 0) return prev
        const next = [...prev]
        next.splice(idxFrom, 1)
        next.splice(idxTo, 0, fromId)
        commitImageReorder(next)
        return next
      })
    }
  }

  function slugify(s: string) {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  useEffect(() => {
    ;(async () => {
      try {
        const [prod, cats, brs, imgs, sp, tg, ptm] = await Promise.all([
          api("/api/Products"),
          api("/api/Categories"),
          api("/api/Brands"),
          api("/api/ProductImages"),
          api("/api/ProductSpecifications"),
          api("/api/Tags"),
          api("/api/ProductTagMappings"),
        ])
        setProducts(Array.isArray(prod) ? prod : [])
        setCategories(Array.isArray(cats) ? cats : [])
        setBrands(Array.isArray(brs) ? brs : [])
        setImages(Array.isArray(imgs) ? imgs : [])
        setSpecs(Array.isArray(sp) ? sp : [])
        setTags(Array.isArray(tg) ? tg : [])
        setTagMappings(Array.isArray(ptm) ? ptm : [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const catMap = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of categories) {
      if (typeof c?.categoryId === "number") m.set(c.categoryId, String(c?.categoryName || ""))
    }
    return m
  }, [categories])
 
  const normCats = useMemo(() => {
    return Array.isArray(categories)
      ? categories.map((c: any) => {
          const id = Number(c?.categoryId ?? c?.CategoryId ?? 0)
          const name = String(c?.categoryName ?? c?.CategoryName ?? "")
          const rawParent = c?.parentCategoryId ?? c?.ParentCategoryId
          const parentId =
            typeof rawParent === "number"
              ? Number(rawParent)
              : rawParent == null
                ? null
                : String(rawParent).trim() === ""
                  ? null
                  : Number(rawParent)
          return { id, name, parentId: parentId as number | null }
        })
      : []
  }, [categories])
 
  const childrenByParent = useMemo(() => {
    const m: Record<number, Array<{ id: number; name: string }>> = {}
    for (const c of normCats) {
      const pid = c.parentId
      if (pid == null || pid === 0) continue
      const arr = m[pid] || []
      arr.push({ id: c.id, name: c.name })
      m[pid] = arr
    }
    return m
  }, [normCats])
 
  const rootCats = useMemo(() => {
    return normCats.filter((c) => c.parentId == null || c.parentId === 0)
  }, [normCats])

  const brandMap = useMemo(() => {
    const m = new Map<number, string>()
    for (const b of brands) {
      if (typeof b?.brandId === "number") m.set(b.brandId, String(b?.brandName || ""))
    }
    return m
  }, [brands])

  const productTagsMap = useMemo(() => {
    const byId = new Map<number, string>()
    for (const t of tags) {
      const id = Number(t?.tagId ?? 0)
      const name = String(t?.tagName || "")
      if (id) byId.set(id, name)
    }
    const m = new Map<number, { tagId: number; tagName: string }[]>()
    for (const map of tagMappings) {
      const pid = Number(map?.productId ?? 0)
      const tid = Number(map?.tagId ?? 0)
      if (!pid || !tid) continue
      const name = byId.get(tid) || `#${tid}`
      if (!m.has(pid)) m.set(pid, [])
      m.get(pid)!.push({ tagId: tid, tagName: name })
    }
    return m
  }, [tags, tagMappings])

  const specsByProduct = useMemo(() => {
    const m = new Map<number, any[]>()
    for (const s of specs) {
      const pid = Number(s?.productId ?? 0)
      if (!pid) continue
      if (!m.has(pid)) m.set(pid, [])
      m.get(pid)!.push(s)
    }
    return m
  }, [specs])

  const mainImageMap = useMemo(() => {
    const m = new Map<number, string>()
    const byProduct = new Map<number, any[]>()
    for (const img of images) {
      const pid = Number(img?.productId ?? 0)
      if (!byProduct.has(pid)) byProduct.set(pid, [])
      byProduct.get(pid)!.push(img)
    }
    for (const [pid, arr] of byProduct) {
      const main = arr.find((x) => Boolean(x?.isMain)) || arr.sort((a, b) => Number(a?.sortOrder ?? 9999) - Number(b?.sortOrder ?? 9999))[0]
      if (main && typeof main?.imageUrl === "string") m.set(pid, main.imageUrl)
    }
    return m
  }, [images])

  const normalized = useMemo(() => {
    return products.map((p) => ({
      id: Number(p?.productId ?? 0),
      name: String(p?.productName || ""),
      slug: String(p?.slug || ""),
      sku: String(p?.sku || ""),
      categoryId: typeof p?.categoryId === "number" ? Number(p.categoryId) : null,
      categoryName: typeof p?.categoryId === "number" ? catMap.get(Number(p.categoryId)) || "Không rõ" : "Không rõ",
      brandId: typeof p?.brandId === "number" ? Number(p.brandId) : null,
      brandName: typeof p?.brandId === "number" ? brandMap.get(Number(p.brandId)) || "Không rõ" : "Không rõ",
      price: Number(p?.discountPrice ?? p?.unitPrice ?? 0),
      stock: Number(p?.quantity ?? 0),
      status: Number(p?.status ?? 0),
      image: mainImageMap.get(Number(p?.productId ?? 0)) || null,
      createdAt: p?.createdAt ? String(p.createdAt) : "",
    }))
  }, [products, catMap, brandMap, mainImageMap])

  const filtered = useMemo(() => {
    const list = normalized.length
      ? normalized
      : mockProducts.map((m) => ({
          id: Number(m.id),
          name: String(m.name || ""),
          slug: "",
          sku: "",
          categoryId: null,
          categoryName: String(m.category || ""),
          brandId: null,
          brandName: "",
          price: Number(m.price),
          stock: Number(m.stock),
          status: m.status === "active" ? 1 : 0,
          image: m.image ? String(m.image) : null,
          createdAt: "",
        }))
    const q = String(searchQuery || "").trim().toLowerCase()
    let out = list.filter((p) => {
      if (!q) return true
      const base = String(p.name || "").toLowerCase().includes(q) || String(p.categoryName || "").toLowerCase().includes(q) || String(p.brandName || "").toLowerCase().includes(q)
      const skuMatch = String(p.sku || "").toLowerCase().includes(q)
      const slugMatch = String(p.slug || "").toLowerCase().includes(q)
      const tagMatch = (productTagsMap.get(Number(p.id)) || []).some((t) => String(t.tagName || "").toLowerCase().includes(q))
      const specMatch = (specsByProduct.get(Number(p.id)) || []).some((s) => String(s?.specName || "").toLowerCase().includes(q) || String(s?.specValue || "").toLowerCase().includes(q))
      return base || skuMatch || slugMatch || tagMatch || specMatch
    })
    if (categoryFilter !== "all") {
      const cid = Number(categoryFilter)
      out = out.filter((p) => p.categoryId === cid)
    }
    if (brandFilter !== "all") {
      const bid = Number(brandFilter)
      out = out.filter((p) => p.brandId === bid)
    }
    if (selectedTagIds.length > 0) {
      const ids = selectedTagIds
      out = out.filter((p) => {
        const pt = productTagsMap.get(Number(p.id)) || []
        const set = new Set(pt.map((t) => Number(t.tagId)))
        if (matchAllTags) {
          for (const id of ids) if (!set.has(Number(id))) return false
          return true
        }
        for (const id of ids) if (set.has(Number(id))) return true
        return false
      })
    } else if (tagFilter !== "all") {
      const tid = Number(tagFilter)
      out = out.filter((p) => (productTagsMap.get(Number(p.id)) || []).some((t) => Number(t.tagId) === tid))
    }
    out = [...out]
    if (sortBy === "name") out.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === "price_asc") out.sort((a, b) => a.price - b.price)
    else if (sortBy === "price_desc") out.sort((a, b) => b.price - a.price)
    else if (sortBy === "stock_desc") out.sort((a, b) => b.stock - a.stock)
    else if (sortBy === "stock_asc") out.sort((a, b) => a.stock - b.stock)
    else if (sortBy === "date_desc") out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return out
  }, [normalized, searchQuery, categoryFilter, brandFilter, sortBy, tagFilter, selectedTagIds, matchAllTags, productTagsMap, specsByProduct])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const pageData = filtered.slice(start, start + pageSize)

  function openEdit(p: any) {
    setEditing(p)
    const orig = products.find((x) => Number(x?.productId ?? 0) === Number(p?.id ?? 0)) || null
    const cid = Number(orig?.categoryId ?? p?.categoryId ?? 0)
    const catObj = categories.find((c: any) => Number(c?.categoryId ?? c?.CategoryId ?? 0) === cid)
    const parentRaw = catObj ? (catObj.parentCategoryId ?? catObj.ParentCategoryId) : null
    const parentId = typeof parentRaw === "number" ? parentRaw : null
    setEditForm({
      productName: p?.name || "",
      slug: String(orig?.slug || p?.slug || ""),
      sku: String(orig?.sku || p?.sku || ""),
      parentCategoryId: parentId ? String(parentId) : "",
      categoryId: orig?.categoryId ? String(orig.categoryId) : (p?.categoryId ? String(p.categoryId) : ""),
      brandId: orig?.brandId ? String(orig.brandId) : (p?.brandId ? String(p.brandId) : ""),
      unitPrice: orig?.unitPrice != null ? String(orig.unitPrice) : (p?.price != null ? String(p.price) : ""),
      discountPrice: orig?.discountPrice != null ? String(orig.discountPrice) : "",
      quantity: orig?.quantity != null ? String(orig.quantity) : (p?.stock != null ? String(p.stock) : ""),
      status: orig?.status != null ? String(orig.status) : String(p?.status ?? ""),
      isFeatured: Boolean(orig?.isFeatured ?? false),
      metaDescription: String(orig?.metaDescription || ""),
      description: String(orig?.description || ""),
    })
    setEditOpen(true)
  }

  function openImages(p: any) {
    setManagingProduct(p)
    setNewImage({ imageUrl: "", altText: "", sortOrder: "", isMain: false })
    setImagesOpen(true)
  }

  function openSpecs(p: any) {
    setManagingProduct(p)
    setNewSpec({ specName: "", specValue: "" })
    setNewSpecs([{ specName: "", specValue: "" }])
    setSpecsOpen(true)
  }

  function openTags(p: any) {
    setManagingProduct(p)
    setSelectedTagId("")
    setNewTagName("")
    setTagsOpen(true)
  }

  function openPreview(p: any) {
    setPreviewProduct(p)
    setPreviewOpen(true)
  }

  function openDisableConfirm(p: any) {
    setDisableTarget(p)
    setDisableConfirmOpen(true)
  }

  function openForceDeleteConfirm(p: any) {
    setForceDeleteTarget(p)
    setForceDeleteConfirmOpen(true)
  }

  function toggleTagSelect(id: number) {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function clearTagSelect() {
    setSelectedTagIds([])
  }

  async function submitCreate() {
    const name = String(createForm.productName || "").trim()
    const unitPrice = Number(createForm.unitPrice || 0)
    const quantity = Number(createForm.quantity || 0)
    if (!name) {
      toast({ title: "Vui lòng nhập tên sản phẩm" })
      return
    }
    if (unitPrice < 0) {
      toast({ title: "Giá không hợp lệ" })
      return
    }
    if (quantity < 0) {
      toast({ title: "Tồn kho không hợp lệ" })
      return
    }
    const dto: any = {
      productName: name,
      slug: (createForm.slug ? String(createForm.slug).trim() : slugify(name)) || undefined,
      sku: createForm.sku ? String(createForm.sku).trim() : undefined,
      categoryId: createForm.categoryId ? Number(createForm.categoryId) : undefined,
      brandId: createForm.brandId ? Number(createForm.brandId) : undefined,
      unitPrice,
      discountPrice: createForm.discountPrice ? Number(createForm.discountPrice) : undefined,
      quantity,
      status: createForm.status ? Number(createForm.status) : 1,
      isFeatured: Boolean(createForm.isFeatured),
      metaDescription: createForm.metaDescription || undefined,
      description: createForm.description || undefined,
    }
    try {
      const res = await api("/api/Products", { method: "POST", body: JSON.stringify(dto) })
      setProducts((prev) => [res, ...prev])
      setCreateOpen(false)
      setCreateForm({
        productName: "",
        slug: "",
        sku: "",
        parentCategoryId: "",
        categoryId: "",
        brandId: "",
        unitPrice: "",
        discountPrice: "",
        quantity: "",
        status: "1",
        isFeatured: false,
        metaDescription: "",
        description: "",
      })
      toast({ title: "Đã tạo sản phẩm", description: res?.productName })
    } catch (err: any) {
      toast({ title: "Không thể tạo sản phẩm", description: err?.message || "Vui lòng kiểm tra dữ liệu" })
    }
  }

  async function submitEdit() {
    if (!editing) return
    const id = Number(editing.id)
    const name = String(editForm.productName || "").trim()
    const unitPrice = editForm.unitPrice ? Number(editForm.unitPrice) : undefined
    const discountPrice = (typeof editForm.discountPrice !== "undefined" && editForm.discountPrice !== null && String(editForm.discountPrice).trim() !== "")
      ? Number(editForm.discountPrice)
      : null
    const quantity = editForm.quantity ? Number(editForm.quantity) : undefined
    if (!name) {
      toast({ title: "Vui lòng nhập tên sản phẩm" })
      return
    }
    if (typeof unitPrice === 'number' && unitPrice < 0) {
      toast({ title: "Giá không hợp lệ" })
      return
    }
    if (typeof quantity === 'number' && quantity < 0) {
      toast({ title: "Tồn kho không hợp lệ" })
      return
    }
    const dto: any = {
      productName: name || undefined,
      slug: (editForm.slug || slugify(name)) || undefined,
      sku: editForm.sku || undefined,
      categoryId: editForm.categoryId ? Number(editForm.categoryId) : undefined,
      brandId: editForm.brandId ? Number(editForm.brandId) : undefined,
      unitPrice,
      discountPrice,
      quantity,
      status: editForm.status ? Number(editForm.status) : undefined,
      isFeatured: typeof editForm.isFeatured === "boolean" ? editForm.isFeatured : undefined,
      metaDescription: editForm.metaDescription || undefined,
      description: editForm.description || undefined,
    }
    try {
      await api(`/api/Products/${id}`, { method: "PUT", body: JSON.stringify(dto) })
      setProducts((prev) => prev.map((p) => (Number(p?.productId) === id ? { ...p, ...dto } : p)))
      setEditOpen(false)
      setEditing(null)
      toast({ title: "Đã cập nhật sản phẩm" })
    } catch (err: any) {
      toast({ title: "Không thể cập nhật", description: err?.message || "Vui lòng kiểm tra dữ liệu" })
    }
  }

  async function deleteProduct(id: number) {
    const ok = typeof window !== "undefined" ? window.confirm("Xóa sản phẩm này?") : true
    if (!ok) return
    try {
      const resp = await api(`/api/Products/${id}`, { method: "DELETE" })
      if (resp && typeof resp === "object" && "message" in resp) {
        setProducts((prev) => prev.map((p) => (Number(p?.productId) === id ? { ...p, status: 0 } : p)))
        toast({ title: String((resp as any).message) })
      } else {
        setProducts((prev) => prev.filter((p) => Number(p?.productId) !== id))
        toast({ title: "Đã xóa sản phẩm" })
      }
    } catch (err: any) {
      toast({ title: "Không thể xóa sản phẩm", description: err?.message || "Vui lòng kiểm tra liên kết dữ liệu" })
    }
  }

  async function disableProduct(id: number) {
    try {
      await toggleProductStatus(id, 0)
    } catch (err: any) {
      toast({ title: "Không thể vô hiệu hóa", description: err?.message || "Vui lòng thử lại" })
    }
  }

  async function deleteProductForce(id: number) {
    try {
      await api(`/api/Products/${id}?force=true`, { method: "DELETE" })
      setProducts((prev) => prev.filter((p) => Number(p?.productId) !== id))
      toast({ title: "Đã xóa vĩnh viễn" })
    } catch (err: any) {
      toast({ title: "Xóa vĩnh viễn thất bại", description: err?.message || "Vui lòng kiểm tra" })
    }
  }

  async function addImage() {
    if (!managingProduct) return
    const pid = Number(managingProduct.id)
    const dto: any = {
      productId: pid,
      imageUrl: newImage.imageUrl,
      altText: newImage.altText || undefined,
      isMain: Boolean(newImage.isMain),
      sortOrder: newImage.sortOrder ? Number(newImage.sortOrder) : undefined,
    }
    const created = await api("/api/ProductImages", { method: "POST", body: JSON.stringify(dto) })
    setImages((prev) => [created, ...prev])
    setImageOrder((prev) => [...prev, Number(created?.imageId)])
    setNewImage({ imageUrl: "", altText: "", sortOrder: "", isMain: false })
    toast({ title: "Đã thêm ảnh" })
  }

  async function setMainImage(imageId: number) {
    if (!managingProduct) return
    const pid = Number(managingProduct.id)
    const list = images.filter((i) => Number(i?.productId) === pid)
    for (const i of list) {
      const id = Number(i?.imageId)
      const makeMain = id === imageId
      await api(`/api/ProductImages/${id}`, { method: "PUT", body: JSON.stringify({ isMain: makeMain }) })
    }
    setImages((prev) => prev.map((i) => (Number(i?.productId) === pid ? { ...i, isMain: Number(i?.imageId) === imageId } : i)))
    toast({ title: "Đã chọn ảnh chính" })
  }

  async function deleteImage(imageId: number) {
    await api(`/api/ProductImages/${imageId}`, { method: "DELETE" })
    setImages((prev) => prev.filter((i) => Number(i?.imageId) !== imageId))
    setImageOrder((prev) => prev.filter((id) => id !== imageId))
    toast({ title: "Đã xóa ảnh" })
  }

  async function addSpec() {
    if (!managingProduct) return
    const pid = Number(managingProduct.id)
    const dto: any = { productId: pid, specName: newSpec.specName, specValue: newSpec.specValue }
    const created = await api("/api/ProductSpecifications", { method: "POST", body: JSON.stringify(dto) })
    setSpecs((prev) => [created, ...prev])
    setNewSpec({ specName: "", specValue: "" })
    toast({ title: "Đã thêm thông số" })
  }

  async function addSpecsBulk() {
    if (!managingProduct) return
    const pid = Number(managingProduct.id)
    const items = newSpecs
      .map((x) => ({ specName: String(x.specName || "").trim(), specValue: String(x.specValue || "").trim() }))
      .filter((x) => x.specName && x.specValue)
    if (items.length === 0) return
    const createdList: any[] = []
    for (const it of items) {
      const dto = { productId: pid, specName: it.specName, specValue: it.specValue }
      const created = await api("/api/ProductSpecifications", { method: "POST", body: JSON.stringify(dto) })
      createdList.push(created)
    }
    setSpecs((prev) => [...createdList, ...prev])
    setNewSpecs([{ specName: "", specValue: "" }])
    toast({ title: "Đã thêm thông số", description: `${items.length} mục` })
  }

  async function addTagMapping() {
    if (!managingProduct || !selectedTagId) return
    const pid = Number(managingProduct.id)
    const tid = Number(selectedTagId)
    const exists = tagMappings.some((m) => Number(m?.productId) === pid && Number(m?.tagId) === tid)
    if (exists) {
      toast({ title: "Tag đã tồn tại" })
      return
    }
    const created = await api("/api/ProductTagMappings", { method: "POST", body: JSON.stringify({ productId: pid, tagId: tid }) })
    setTagMappings((prev) => [created, ...prev])
    setSelectedTagId("")
    toast({ title: "Đã gán tag" })
  }

  async function removeTagMapping(tagId: number) {
    if (!managingProduct) return
    const pid = Number(managingProduct.id)
    const mapping = tagMappings.find((m) => Number(m?.productId) === pid && Number(m?.tagId) === tagId)
    if (!mapping) return
    const id = Number(mapping?.productTagId)
    await api(`/api/ProductTagMappings/${id}`, { method: "DELETE" })
    setTagMappings((prev) => prev.filter((m) => Number(m?.productTagId) !== id))
    toast({ title: "Đã xóa tag" })
  }

  async function createTagAndAdd() {
    const name = newTagName.trim()
    if (!name) return
    const created = await api("/api/Tags", { method: "POST", body: JSON.stringify({ tagName: name }) })
    setTags((prev) => [created, ...prev])
    setNewTagName("")
    setSelectedTagId(String(created?.tagId))
    await addTagMapping()
  }

  async function pasteSpecsFromClipboard() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return
    const text = await navigator.clipboard.readText()
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const rows = lines.map((l) => {
      const m = l.split(":")
      const name = (m[0] || "").trim()
      const value = (m.slice(1).join(":") || "").trim()
      return { specName: name, specValue: value }
    }).filter((x) => x.specName)
    if (rows.length === 0) return
    setNewSpecs((prev) => [...prev, ...rows])
    toast({ title: "Đã dán từ clipboard", description: `${rows.length} dòng` })
  }

  async function pasteTagsFromClipboard() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return
    const text = await navigator.clipboard.readText()
    const items = Array.from(new Set(text.split(/[\r\n,;]+/).map((x) => x.trim()).filter(Boolean)))
    if (!managingProduct || items.length === 0) return
    const pid = Number(managingProduct.id)
    const toLower = (s: string) => s.toLowerCase()
    const existingMap = new Map<string, number>()
    for (const t of tags) {
      const name = String(t?.tagName || "")
      const id = Number(t?.tagId ?? 0)
      if (name && id) existingMap.set(toLower(name), id)
    }
    const newMappings: any[] = []
    for (const name of items) {
      let tid = existingMap.get(toLower(name)) || 0
      if (!tid) {
        const createdTag = await api("/api/Tags", { method: "POST", body: JSON.stringify({ tagName: name }) })
        tid = Number(createdTag?.tagId ?? 0)
        if (tid) {
          existingMap.set(toLower(String(createdTag?.tagName || name)), tid)
          setTags((prev) => [createdTag, ...prev])
        }
      }
      if (!tid) continue
      const exists = tagMappings.some((m) => Number(m?.productId) === pid && Number(m?.tagId) === tid)
      if (!exists) {
        const createdMap = await api("/api/ProductTagMappings", { method: "POST", body: JSON.stringify({ productId: pid, tagId: tid }) })
        newMappings.push(createdMap)
      }
    }
    if (newMappings.length) setTagMappings((prev) => [...newMappings, ...prev])
    toast({ title: "Đã dán tag", description: `${items.length} mục` })
  }

  async function toggleProductStatus(productId: number, status: number) {
    await api(`/api/Products/${productId}`, { method: "PUT", body: JSON.stringify({ status }) })
    setProducts((prev) => prev.map((p) => (Number(p?.productId) === productId ? { ...p, status } : p)))
    toast({ title: status === 1 ? "Đã bật hoạt động" : "Đã tắt hoạt động" })
  }

  async function updateSpec(spec: any, patch: any) {
    const id = Number(spec?.specId)
    await api(`/api/ProductSpecifications/${id}`, { method: "PUT", body: JSON.stringify(patch) })
    setSpecs((prev) => prev.map((s) => (Number(s?.specId) === id ? { ...s, ...patch } : s)))
    toast({ title: "Đã cập nhật thông số" })
  }

  async function deleteSpec(specId: number) {
    await api(`/api/ProductSpecifications/${specId}`, { method: "DELETE" })
    setSpecs((prev) => prev.filter((s) => Number(s?.specId) !== specId))
    toast({ title: "Đã xóa thông số" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Quản lý sản phẩm</h2>
          <p className="text-muted-foreground">Thêm, sửa và xóa sản phẩm</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.categoryId} value={String(c.categoryId)}>{c.categoryName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Thương hiệu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.brandId} value={String(b.brandId)}>{b.brandName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Mới nhất</SelectItem>
                <SelectItem value="name">Tên A-Z</SelectItem>
                <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                <SelectItem value="stock_desc">Tồn kho nhiều</SelectItem>
                <SelectItem value="stock_asc">Tồn kho ít</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={(v) => { setTagFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tag</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t.tagId} value={String(t.tagId)}>{t.tagName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Lọc nhiều tag{selectedTagIds.length ? ` (${selectedTagIds.length})` : ""}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {tags.map((t) => (
                  <DropdownMenuCheckboxItem
                    key={t.tagId}
                    checked={selectedTagIds.includes(Number(t.tagId))}
                    onCheckedChange={() => { toggleTagSelect(Number(t.tagId)); setPage(1) }}
                  >
                    {t.tagName}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={matchAllTags} onCheckedChange={(v) => setMatchAllTags(Boolean(v))}>
                  Yêu cầu khớp tất cả
                </DropdownMenuCheckboxItem>
                <DropdownMenuItem onClick={() => { clearTagSelect(); setPage(1) }}>
                  Xóa lựa chọn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Trang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / trang</SelectItem>
                <SelectItem value="20">20 / trang</SelectItem>
                <SelectItem value="50">50 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead className="hidden lg:table-cell">Thương hiệu</TableHead>
                <TableHead className="hidden xl:table-cell">Tag</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-6 text-center text-muted-foreground">Đang tải...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-6 text-center text-muted-foreground">Không có sản phẩm</TableCell>
                </TableRow>
              ) : (
                pageData.map((product) => (
                  <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image ? resolveImg(product.image) : "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover bg-secondary"
                      />
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{product.categoryName}</TableCell>
                  <TableCell className="hidden lg:table-cell">{product.brandName}</TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(productTagsMap.get(Number(product.id)) || []).slice(0, 6).map((t) => (
                        <Badge key={`${product.id}-${t.tagId}`} variant="secondary" onClick={() => { setTagFilter(String(t.tagId)); setPage(1) }} className="cursor-pointer">{t.tagName}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{Number(product.price).toLocaleString("vi-VN")}đ</TableCell>
                  <TableCell>
                    <Badge variant={product.stock > 0 ? "default" : "destructive"}>{product.stock}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.stock > 0 ? (product.status === 1 ? "default" : "secondary") : "secondary"}>
                        {product.stock === 0 ? "Hết hàng" : product.status === 1 ? "Hoạt động" : "Không hoạt động"}
                      </Badge>
                      <Switch checked={product.status === 1} onCheckedChange={(v) => toggleProductStatus(Number(product.id), v ? 1 : 0)} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openPreview(product)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openImages(product)}>
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openSpecs(product)}>
                        <ListIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openTags(product)}>
                        <TagIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDisableConfirm(product)}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openForceDeleteConfirm(product)}
                        className="text-destructive border-destructive"
                      >
                        Xóa vĩnh viễn
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Tổng {filtered.length} sản phẩm • Trang {currentPage}/{totalPages}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</Button>
          <Button variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Sau</Button>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Thêm sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-4 p-1">
              <div className="grid gap-2">
                <Label>Tên sản phẩm</Label>
                <Input value={createForm.productName} onChange={(e) => setCreateForm({ ...createForm, productName: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Slug</Label>
                  <Input value={createForm.slug} onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>SKU</Label>
                  <Input value={createForm.sku} onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Danh mục cha</Label>
                  <Select
                    value={createForm.parentCategoryId}
                    onValueChange={(v) => setCreateForm({ ...createForm, parentCategoryId: v, categoryId: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục cha" />
                    </SelectTrigger>
                    <SelectContent>
                      {rootCats.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Danh mục</Label>
                  <Select value={createForm.categoryId} onValueChange={(v) => setCreateForm({ ...createForm, categoryId: v })}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={createForm.parentCategoryId ? "Chọn danh mục con" : "Chọn danh mục"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(createForm.parentCategoryId
                        ? (childrenByParent[Number(createForm.parentCategoryId)] || [])
                        : normCats
                      ).map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Thương hiệu</Label>
                  <Select value={createForm.brandId} onValueChange={(v) => setCreateForm({ ...createForm, brandId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thương hiệu" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.brandId} value={String(b.brandId)}>{b.brandName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Giá</Label>
                  <Input type="number" value={createForm.unitPrice} onChange={(e) => setCreateForm({ ...createForm, unitPrice: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Giảm giá</Label>
                  <Input type="number" value={createForm.discountPrice} onChange={(e) => setCreateForm({ ...createForm, discountPrice: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Tồn kho</Label>
                  <Input type="number" value={createForm.quantity} onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Trạng thái</Label>
                  <Select value={createForm.status} onValueChange={(v) => setCreateForm({ ...createForm, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Hoạt động</SelectItem>
                      <SelectItem value="0">Không hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center justify-between">Nổi bật <Switch checked={createForm.isFeatured} onCheckedChange={(v) => setCreateForm({ ...createForm, isFeatured: v })} /></Label>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Mô tả ngắn</Label>
                <Textarea className="min-h-32 max-h-[40vh] overflow-y-auto" value={createForm.metaDescription} onChange={(e) => setCreateForm({ ...createForm, metaDescription: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Mô tả chi tiết</Label>
                <Textarea className="min-h-40 max-h-[50vh] overflow-y-auto" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="bg-card/80 backdrop-blur border-t mt-4 p-3">
            <Button onClick={submitCreate}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Sửa sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-4 p-1">
              <div className="grid gap-2">
                <Label>Tên sản phẩm</Label>
                <Input value={editForm.productName} onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Slug</Label>
                  <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>SKU</Label>
                  <Input value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Danh mục cha</Label>
                  <Select
                    value={editForm.parentCategoryId}
                    onValueChange={(v) => setEditForm({ ...editForm, parentCategoryId: v, categoryId: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục cha" />
                    </SelectTrigger>
                    <SelectContent>
                      {rootCats.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Danh mục</Label>
                  <Select value={editForm.categoryId} onValueChange={(v) => setEditForm({ ...editForm, categoryId: v })}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={editForm.parentCategoryId ? "Chọn danh mục con" : "Chọn danh mục"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(editForm.parentCategoryId
                        ? (childrenByParent[Number(editForm.parentCategoryId)] || [])
                        : normCats
                      ).map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Thương hiệu</Label>
                  <Select value={editForm.brandId} onValueChange={(v) => setEditForm({ ...editForm, brandId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thương hiệu" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.brandId} value={String(b.brandId)}>{b.brandName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Giá</Label>
                  <Input type="number" value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Giảm giá</Label>
                  <Input type="number" value={editForm.discountPrice} onChange={(e) => setEditForm({ ...editForm, discountPrice: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Tồn kho</Label>
                  <Input type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Trạng thái</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Hoạt động</SelectItem>
                      <SelectItem value="0">Không hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center justify-between">Nổi bật <Switch checked={editForm.isFeatured} onCheckedChange={(v) => setEditForm({ ...editForm, isFeatured: v })} /></Label>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Mô tả ngắn</Label>
                <Textarea className="min-h-32 max-h-[40vh] overflow-y-auto" value={editForm.metaDescription} onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Mô tả chi tiết</Label>
                <Textarea className="min-h-40 max-h-[50vh] overflow-y-auto" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="bg-card/80 backdrop-blur border-t mt-4 p-3">
            <Button onClick={submitEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imagesOpen} onOpenChange={setImagesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ảnh sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className={cn("border-2 border-dashed rounded p-6 text-center", isDropActive ? "bg-secondary" : "")}
              onDragOver={(e) => { e.preventDefault(); setIsDropActive(true) }}
              onDragLeave={() => setIsDropActive(false)}
              onDrop={(e) => { e.preventDefault(); setIsDropActive(false); const fs = Array.from(e.dataTransfer?.files || []); if (fs.length) uploadProductImages(fs as any) }}
            >
              <div className="text-sm mb-3">Kéo & thả ảnh vào đây hoặc chọn file</div>
              <div className="inline-flex items-center gap-2">
                <input type="file" multiple disabled={uploadingImages} onChange={(e) => { if (e.target.files) uploadProductImages(e.target.files) }} />
                {uploadingImages && <span className="text-xs text-muted-foreground">Đang tải lên...</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-2">Ảnh đầu tiên được chọn làm ảnh chính</div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(() => {
                  const byId = new Map<number, any>(imagesOfManaging.map((i) => [Number(i.imageId), i]))
                  return imageOrder.map((id) => byId.get(id)).filter(Boolean).map((img: any) => (
                    <div
                      key={img.imageId}
                      className="border rounded overflow-hidden cursor-move"
                      draggable
                      onDragStart={() => onDragStartImage(Number(img.imageId))}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={onDropOnImage(Number(img.imageId))}
                    >
                      <div className="relative">
                        <img src={resolveImg(img.imageUrl)} alt={img.altText || ""} className="w-full aspect-square object-cover bg-secondary" />
                        {img.isMain && <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-primary text-primary-foreground">Ảnh chính</div>}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={(e) => { e.stopPropagation(); deleteImage(Number(img.imageId)) }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-2">
                        <Button variant={img.isMain ? "default" : "outline"} size="sm" onClick={() => setMainImage(Number(img.imageId))}>Chọn làm chính</Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteImage(Number(img.imageId))}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Image URL</Label>
                <Input value={newImage.imageUrl} onChange={(e) => setNewImage({ ...newImage, imageUrl: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Alt</Label>
                <Input value={newImage.altText} onChange={(e) => setNewImage({ ...newImage, altText: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Sort</Label>
                <Input type="number" value={newImage.sortOrder} onChange={(e) => setNewImage({ ...newImage, sortOrder: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center justify-between">Ảnh chính <Switch checked={newImage.isMain} onCheckedChange={(v) => setNewImage({ ...newImage, isMain: v })} /></Label>
              </div>
              <div className="grid gap-2">
                <Label>&nbsp;</Label>
                <Button onClick={addImage}>Thêm ảnh</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={specsOpen} onOpenChange={setSpecsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thông số kỹ thuật</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {specs
                .filter((s) => Number(s?.productId) === Number(managingProduct?.id))
                .map((s) => (
                  <div key={s.specId} className="flex items-center gap-2">
                    <Input className="flex-1" value={s.specName || ""} onChange={(e) => updateSpec(s, { specName: e.target.value })} />
                    <Input className="flex-1" value={s.specValue || ""} onChange={(e) => updateSpec(s, { specValue: e.target.value })} />
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSpec(Number(s.specId))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              {newSpecs.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    placeholder="Tên thông số"
                    value={row.specName}
                    onChange={(e) => {
                      const v = e.target.value
                      setNewSpecs((prev) => prev.map((r, i) => (i === idx ? { ...r, specName: v } : r)))
                    }}
                  />
                  <Input
                    className="flex-1"
                    placeholder="Giá trị"
                    value={row.specValue}
                    onChange={(e) => {
                      const v = e.target.value
                      setNewSpecs((prev) => prev.map((r, i) => (i === idx ? { ...r, specValue: v } : r)))
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setNewSpecs((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setNewSpecs((prev) => [...prev, { specName: "", specValue: "" }])}>Thêm dòng</Button>
                <Button onClick={addSpecsBulk}>Lưu tất cả</Button>
                <Button variant="ghost" onClick={() => setNewSpecs([{ specName: "", specValue: "" }])}>Xóa hết</Button>
                <Button variant="outline" onClick={pasteSpecsFromClipboard}><Clipboard className="h-4 w-4 mr-2" />Dán từ clipboard</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={tagsOpen} onOpenChange={setTagsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tagMappings
                .filter((m) => Number(m?.productId) === Number(managingProduct?.id))
                .map((m) => {
                  const tag = tags.find((t) => Number(t?.tagId) === Number(m?.tagId))
                  const name = tag?.tagName || `#${m.tagId}`
                  return (
                    <div key={m.productTagId} className="flex items-center gap-2 border rounded px-2 py-1">
                      <span>{name}</span>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeTagMapping(Number(m.tagId))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )
                })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Chọn tag</Label>
                <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((t) => (
                      <SelectItem key={t.tagId} value={String(t.tagId)}>{t.tagName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="mt-2" onClick={addTagMapping}>Gán</Button>
              </div>
              <div className="grid gap-2">
                <Label>Tạo tag mới</Label>
                <Input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
                <Button className="mt-2" onClick={createTagAndAdd}>Tạo và gán</Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={pasteTagsFromClipboard}><Clipboard className="h-4 w-4 mr-2" />Dán danh sách tag</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewProduct?.name || "Xem sản phẩm"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{previewProduct?.categoryName} • {previewProduct?.brandName}</div>
              <div className="font-medium">{Number(previewProduct?.price || 0).toLocaleString('vi-VN')}đ</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.filter((i) => Number(i?.productId) === Number(previewProduct?.id)).map((img) => (
                <img key={img.imageId} src={resolveImg(img.imageUrl)} alt={img.altText || ''} className="w-full h-24 rounded object-cover bg-secondary" />
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Thông số</div>
              {specs.filter((s) => Number(s?.productId) === Number(previewProduct?.id)).map((s) => (
                <div key={s.specId} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.specName}</span>
                  <span>{s.specValue}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Tag</div>
              <div className="flex flex-wrap gap-2">
                {(productTagsMap.get(Number(previewProduct?.id)) || []).map((t) => (
                  <Badge key={`${previewProduct?.id}-${t.tagId}`} variant="secondary">{t.tagName}</Badge>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={disableConfirmOpen} onOpenChange={setDisableConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vô hiệu hóa sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm">{disableTarget?.name}</div>
            <div className="text-sm text-muted-foreground">Sản phẩm sẽ không hiển thị và không bán. Lịch sử liên kết vẫn giữ nguyên.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDisableConfirmOpen(false); setDisableTarget(null) }}>Hủy</Button>
            <Button onClick={async () => { if (!disableTarget) return; await disableProduct(Number(disableTarget.id)); setDisableConfirmOpen(false); setDisableTarget(null) }}>Vô hiệu hóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={forceDeleteConfirmOpen} onOpenChange={setForceDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa vĩnh viễn sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm">{forceDeleteTarget?.name}</div>
            <div className="text-sm text-muted-foreground">Hành động không thể hoàn tác. Dữ liệu liên quan sẽ bị xóa.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setForceDeleteConfirmOpen(false); setForceDeleteTarget(null) }}>Hủy</Button>
            <Button className="text-destructive" variant="outline" onClick={async () => { if (!forceDeleteTarget) return; await deleteProductForce(Number(forceDeleteTarget.id)); setForceDeleteConfirmOpen(false); setForceDeleteTarget(null) }}>Xóa vĩnh viễn</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
    </div>
  )
}
