import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Image, Upload, Home, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { bannerService, type Banner } from '@/services/bannerService'
import { uploadService } from '@/services/uploadService'

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [isSaving, setIsSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const editFileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        title: '',
        image_url: '',
        link_url: '',
        is_active: true,
        is_homepage: false,
    })

    // Fetch banners on mount
    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        try {
            setIsLoading(true)
            const data = await bannerService.getBanners()
            setBanners(data)
        } catch (error) {
            console.error('Failed to fetch banners:', error)
            toast.error('Không thể tải danh sách banner')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredBanners = banners.filter((banner) =>
        banner.title.toLowerCase().includes(search.toLowerCase())
    )

    const homepageBanners = banners.filter((b) => b.is_homepage && b.is_active).length

    const resetForm = () => {
        setFormData({ title: '', image_url: '', link_url: '', is_active: true, is_homepage: false })
        setImagePreview('')
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước file tối đa là 5MB')
                return
            }
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file hình ảnh')
                return
            }

            // Create preview URL
            const previewUrl = URL.createObjectURL(file)
            setImagePreview(previewUrl)

            // Upload to server
            try {
                const result = await uploadService.uploadImage(file)
                setFormData({ ...formData, image_url: result.imagePath })
                toast.success('Tải ảnh lên thành công!')
            } catch (error) {
                toast.error('Lỗi khi tải ảnh lên server')
                console.error(error)
            }
        }
    }

    const handleAdd = async () => {
        if (!formData.title || !formData.image_url) {
            toast.error('Vui lòng điền đầy đủ thông tin!')
            return
        }

        setIsSaving(true)
        try {
            const newBanner = await bannerService.createBanner({
                title: formData.title,
                image_url: formData.image_url,
                link_url: formData.link_url,
                is_active: formData.is_active,
                is_homepage: formData.is_homepage,
            })
            setBanners([...banners, newBanner])
            setIsAddModalOpen(false)
            resetForm()
            toast.success('Thêm banner thành công!')
        } catch (error) {
            toast.error('Lỗi khi thêm banner')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleEdit = async () => {
        if (!selectedBanner) return

        setIsSaving(true)
        try {
            const updatedBanner = await bannerService.updateBanner(selectedBanner.id, {
                title: formData.title,
                image_url: formData.image_url || selectedBanner.image_url,
                link_url: formData.link_url,
                is_active: formData.is_active,
                is_homepage: formData.is_homepage,
            })
            setBanners(banners.map((b) => (b.id === selectedBanner.id ? updatedBanner : b)))
            setIsEditModalOpen(false)
            setSelectedBanner(null)
            resetForm()
            toast.success('Cập nhật banner thành công!')
        } catch (error) {
            toast.error('Lỗi khi cập nhật banner')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedBanner) return

        setIsSaving(true)
        try {
            await bannerService.deleteBanner(selectedBanner.id)
            setBanners(banners.filter((b) => b.id !== selectedBanner.id))
            setIsDeleteModalOpen(false)
            setSelectedBanner(null)
            toast.success('Xóa banner thành công!')
        } catch (error) {
            toast.error('Lỗi khi xóa banner')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const toggleActive = async (banner: Banner) => {
        try {
            const updatedBanner = await bannerService.toggleBanner(banner.id)
            setBanners(banners.map((b) => (b.id === banner.id ? { ...b, is_active: updatedBanner.is_active } : b)))
            toast.success(banner.is_active ? 'Đã ẩn banner' : 'Đã hiện banner')
        } catch (error) {
            toast.error('Lỗi khi thay đổi trạng thái')
            console.error(error)
        }
    }

    const toggleHomepage = async (banner: Banner) => {
        try {
            await bannerService.updateBanner(banner.id, { is_homepage: !banner.is_homepage })
            setBanners(banners.map((b) => (b.id === banner.id ? { ...b, is_homepage: !b.is_homepage } : b)))
            toast.success(banner.is_homepage ? 'Đã gỡ khỏi trang chủ' : 'Đã đưa lên trang chủ')
        } catch (error) {
            toast.error('Lỗi khi thay đổi trạng thái')
            console.error(error)
        }
    }

    const openEditModal = (banner: Banner) => {
        setSelectedBanner(banner)
        setFormData({
            title: banner.title,
            image_url: banner.image_url,
            link_url: banner.link_url,
            is_active: banner.is_active,
            is_homepage: banner.is_homepage,
        })
        setImagePreview(banner.image_url)
        setIsEditModalOpen(true)
    }

    const openDeleteModal = (banner: Banner) => {
        setSelectedBanner(banner)
        setIsDeleteModalOpen(true)
    }

    const getImageUrl = (path: string) => {
        if (!path) return ''
        if (path.startsWith('http') || path.startsWith('https')) return path
        // Fallback for old local images
        return `${(import.meta as any).env.VITE_API_URL || ''}${path.startsWith('/') ? path : `/${path}`}`
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Banner</h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý các banner quảng cáo • {homepageBanners} banner đang hiển thị trên trang chủ
                    </p>
                </div>
                <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
                    <Plus className="size-4 mr-2" />
                    Thêm banner
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm banner..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBanners.map((banner, index) => (
                    <motion.div
                        key={banner.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className={!banner.is_active ? 'opacity-60' : ''}>
                            <CardContent className="p-0">
                                {/* Banner Image */}
                                <div className="relative h-40 overflow-hidden rounded-t-lg">
                                    <img
                                        src={getImageUrl(banner.image_url)}
                                        alt={banner.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/banner.png'
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-3 left-3 right-3">
                                        <h3 className="font-bold text-white line-clamp-1">{banner.title}</h3>
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-1">
                                        {banner.is_homepage && (
                                            <Badge variant="default" className="bg-amber-500">
                                                <Home className="size-3 mr-1" />
                                                Trang chủ
                                            </Badge>
                                        )}
                                        <Badge variant={banner.is_active ? 'success' : 'secondary'}>
                                            {banner.is_active ? 'Đang hiện' : 'Đã ẩn'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Thứ tự: {banner.order}</span>
                                    </div>

                                    {/* Homepage Toggle Button */}
                                    <Button
                                        variant={banner.is_homepage ? "secondary" : "outline"}
                                        size="sm"
                                        className="w-full"
                                        onClick={() => toggleHomepage(banner)}
                                    >
                                        <Home className="size-4 mr-2" />
                                        {banner.is_homepage ? 'Gỡ khỏi Trang chủ' : 'Đưa lên Trang chủ'}
                                    </Button>

                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => toggleActive(banner)}>
                                            {banner.is_active ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => openEditModal(banner)}>
                                            <Edit className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => openDeleteModal(banner)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {filteredBanners.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                    <Image className="size-12 mx-auto mb-4 opacity-50" />
                    <p>Không tìm thấy banner nào</p>
                </div>
            )}

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); resetForm() }}
                title="Thêm banner mới"
                description="Tải lên banner quảng cáo cho hệ thống"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tiêu đề *</label>
                        <Input
                            placeholder="Nhập tiêu đề banner"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hình ảnh *</label>
                        <div
                            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                                    <button
                                        type="button"
                                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setImagePreview('')
                                            setFormData({ ...formData, image_url: '' })
                                        }}
                                    >
                                        <X className="size-4 text-white" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="size-10 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        Click để tải lên hoặc kéo thả file vào đây
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        PNG, JPG, WebP (Tối đa 5MB)
                                    </p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Hiển thị ngay</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_homepage}
                                onChange={(e) => setFormData({ ...formData, is_homepage: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Đưa lên Trang chủ</span>
                        </label>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => { setIsAddModalOpen(false); resetForm() }}>
                        Hủy
                    </Button>
                    <Button onClick={handleAdd} disabled={!formData.title || !formData.image_url || isSaving}>
                        {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                        Thêm banner
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); resetForm() }}
                title="Chỉnh sửa banner"
                description="Cập nhật thông tin banner"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tiêu đề *</label>
                        <Input
                            placeholder="Nhập tiêu đề banner"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* File Upload for Edit */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hình ảnh</label>
                        <div
                            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => editFileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                                    <p className="text-xs text-muted-foreground mt-2">Click để thay đổi ảnh</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="size-10 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        Click để tải lên ảnh mới
                                    </p>
                                </>
                            )}
                        </div>
                        <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e)}
                        />
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Hiển thị</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_homepage}
                                onChange={(e) => setFormData({ ...formData, is_homepage: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Đưa lên Trang chủ</span>
                        </label>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => { setIsEditModalOpen(false); resetForm() }}>
                        Hủy
                    </Button>
                    <Button onClick={handleEdit} disabled={isSaving}>
                        {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                        Lưu thay đổi
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Xác nhận xóa"
                size="sm"
            >
                <p className="text-muted-foreground">
                    Bạn có chắc chắn muốn xóa banner "{selectedBanner?.title}"? Hành động này không thể hoàn tác.
                </p>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                        Hủy
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                        {isSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                        Xóa
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
