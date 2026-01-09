import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye, Calendar, MapPin, Image, Upload, X, Ticket, Tag, Home } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SkeletonTable } from '@/components/ui/skeleton'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { eventService } from '@/services/eventService'
import { uploadService } from '@/services/uploadService'
import { useRoomStore } from '@/stores/roomStore'
import { formatDate } from '@/lib/utils'

const categories = ['Music', 'Tech', 'Food', 'Business', 'Sports', 'Art', 'Education']

interface TicketTypeForm {
    name: string
    price: number
    quantity_total: number
    description: string
}

export default function AdminEventsPage() {
    const { rooms, fetchRooms } = useRoomStore()

    useEffect(() => {
        fetchRooms()
    }, [fetchRooms])

    const [search, setSearch] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'info' | 'tickets' | 'banner' | 'rooms'>('info')

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        start_time: '',
        end_time: '',
        banner_image: '',
        status: 'draft',
        room_ids: [] as string[],
    })

    // Ticket Types state
    const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([
        { name: 'Standard', price: 200000, quantity_total: 100, description: '' }
    ])

    // Banner state
    const [bannerOptions, setBannerOptions] = useState({
        create_banner: false,
        banner_is_homepage: false,
        banner_priority: 10
    })

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin-events', { search }],
        queryFn: () => eventService.getEvents({ limit: 50, search: search || undefined }),
    })

    const events = data?.data || []

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            category: '',
            location: '',
            start_time: '',
            end_time: '',
            banner_image: '',
            status: 'draft',
            room_ids: [],
        })
        setTicketTypes([{ name: 'Standard', price: 200000, quantity_total: 100, description: '' }])
        setBannerOptions({ create_banner: false, banner_is_homepage: false, banner_priority: 10 })
        setActiveTab('info')
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const res = await uploadService.uploadImage(file)
            setFormData(prev => ({ ...prev, banner_image: res.imagePath }))
            toast.success('Upload ảnh thành công')
        } catch (error) {
            toast.error('Lỗi upload ảnh')
            console.error(error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleAdd = async () => {
        if (!formData.title) {
            toast.error('Vui lòng nhập tên sự kiện')
            setActiveTab('info')
            return
        }

        setIsSaving(true)
        try {
            const payload = {
                ...formData,
                ticket_types: ticketTypes.filter(tt => tt.name && tt.price > 0),
                ...bannerOptions
            }
            await eventService.createEvent(payload as any)
            toast.success('Đã tạo sự kiện thành công!')
            setIsAddModalOpen(false)
            resetForm()
            refetch()
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Lỗi khi tạo sự kiện')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleEdit = async () => {
        if (!selectedEvent) return
        setIsSaving(true)
        try {
            await eventService.updateEvent(selectedEvent.id, formData)
            toast.success('Đã cập nhật sự kiện thành công!')
            setIsEditModalOpen(false)
            setSelectedEvent(null)
            resetForm()
            refetch()
        } catch (error) {
            toast.error('Lỗi khi cập nhật sự kiện')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedEvent) return
        try {
            await eventService.deleteEvent(selectedEvent.id)
            toast.success('Đã xóa sự kiện thành công!')
            setIsDeleteModalOpen(false)
            setSelectedEvent(null)
            refetch()
        } catch (error) {
            toast.error('Lỗi khi xóa sự kiện')
            console.error(error)
        }
    }

    const openEditModal = (event: any) => {
        setSelectedEvent(event)
        setFormData({
            title: event.title || '',
            description: event.description || '',
            category: event.category || '',
            location: event.location || '',
            start_time: event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : '',
            end_time: event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : '',
            banner_image: event.banner_image || '',
            status: event.status || 'draft',
            room_ids: event.rooms ? event.rooms.map((r: any) => r.id) : [],
        })
        setActiveTab('info')
        setIsEditModalOpen(true)
    }

    const openDeleteModal = (event: any) => {
        setSelectedEvent(event)
        setIsDeleteModalOpen(true)
    }

    const toggleRoomSelection = (roomId: string) => {
        setFormData(prev => {
            const currentRooms = prev.room_ids || []
            if (currentRooms.includes(roomId)) {
                return { ...prev, room_ids: currentRooms.filter(id => id !== roomId) }
            } else {
                return { ...prev, room_ids: [...currentRooms, roomId] }
            }
        })
    }

    const getImageUrl = (path: string) => {
        if (!path) return ''
        if (path.startsWith('http') || path.startsWith('https')) return path
        // Fallback for old local images (though they might be 404 now)
        return path.startsWith('/') ? path : `/${path}`
    }

    // Ticket type handlers
    const addTicketType = () => {
        setTicketTypes(prev => [...prev, { name: '', price: 0, quantity_total: 50, description: '' }])
    }

    const removeTicketType = (index: number) => {
        setTicketTypes(prev => prev.filter((_, i) => i !== index))
    }

    const updateTicketType = (index: number, field: keyof TicketTypeForm, value: any) => {
        setTicketTypes(prev => prev.map((tt, i) => i === index ? { ...tt, [field]: value } : tt))
    }

    // Tab content
    const tabs = [
        { id: 'info', label: 'Thông tin', icon: Calendar },
        { id: 'tickets', label: 'Loại vé', icon: Ticket },
        { id: 'banner', label: 'Banner', icon: Image },
        { id: 'rooms', label: 'Phòng', icon: MapPin },
    ] as const

    const renderTabContent = () => {
        switch (activeTab) {
            case 'info':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tên sự kiện *</label>
                            <Input
                                placeholder="Nhập tên sự kiện"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mô tả</label>
                            <textarea
                                placeholder="Mô tả chi tiết về sự kiện..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm min-h-[80px] resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Danh mục</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Trạng thái</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                                >
                                    <option value="draft">Nháp</option>
                                    <option value="published">Xuất bản</option>
                                    <option value="cancelled">Đã hủy</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Địa điểm</label>
                            <Input
                                placeholder="Nhập địa điểm tổ chức"
                                value={formData.location}
                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bắt đầu</label>
                                <Input
                                    type="datetime-local"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kết thúc</label>
                                <Input
                                    type="datetime-local"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ảnh banner</label>
                            {formData.banner_image ? (
                                <div className="relative">
                                    <img
                                        src={getImageUrl(formData.banner_image)}
                                        alt="Preview"
                                        className="w-full h-32 object-cover rounded-lg border border-border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, banner_image: '' }))}
                                        className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors relative">
                                    {isUploading ? (
                                        <div className="text-sm animate-pulse">Đang tải lên...</div>
                                    ) : (
                                        <>
                                            <Upload className="size-6 mb-1 opacity-50" />
                                            <p className="text-sm">Click để tải ảnh</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleUpload}
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )

            case 'tickets':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium flex items-center gap-2">
                                <Ticket className="size-4" />
                                Loại vé ({ticketTypes.length})
                            </h3>
                            <Button size="sm" variant="outline" onClick={addTicketType}>
                                <Plus className="size-4 mr-1" />
                                Thêm loại vé
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {ticketTypes.map((tt, index) => (
                                <div key={index} className="p-4 border border-border rounded-lg bg-muted/30 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Loại vé #{index + 1}</span>
                                        {ticketTypes.length > 1 && (
                                            <button
                                                onClick={() => removeTicketType(index)}
                                                className="text-destructive hover:text-destructive/80"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs text-muted-foreground">Tên loại *</label>
                                            <Input
                                                placeholder="VIP, Standard..."
                                                value={tt.name}
                                                onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Giá (VND) *</label>
                                            <Input
                                                type="number"
                                                placeholder="500000"
                                                value={tt.price}
                                                onChange={(e) => updateTicketType(index, 'price', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Số lượng *</label>
                                            <Input
                                                type="number"
                                                placeholder="100"
                                                value={tt.quantity_total}
                                                onChange={(e) => updateTicketType(index, 'quantity_total', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Loại vé sẽ được tự động tạo khi lưu sự kiện. Có thể chỉnh sửa sau trong trang quản lý vé.
                        </p>
                    </div>
                )

            case 'banner':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium flex items-center gap-2">
                                <Image className="size-4" />
                                Quảng cáo Banner
                            </h3>
                        </div>

                        <div className="p-4 border border-border rounded-lg space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={bannerOptions.create_banner}
                                    onChange={(e) => setBannerOptions(prev => ({ ...prev, create_banner: e.target.checked }))}
                                    className="w-5 h-5 rounded border-border"
                                />
                                <div>
                                    <p className="font-medium">Tạo banner quảng cáo</p>
                                    <p className="text-sm text-muted-foreground">Tự động tạo banner từ ảnh sự kiện</p>
                                </div>
                            </label>

                            {bannerOptions.create_banner && (
                                <div className="pl-8 space-y-4 border-l-2 border-primary/20">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={bannerOptions.banner_is_homepage}
                                            onChange={(e) => setBannerOptions(prev => ({ ...prev, banner_is_homepage: e.target.checked }))}
                                            className="w-5 h-5 rounded border-border"
                                        />
                                        <div>
                                            <p className="font-medium flex items-center gap-2">
                                                <Home className="size-4 text-primary" />
                                                Đưa lên trang chủ
                                            </p>
                                            <p className="text-sm text-muted-foreground">Hiển thị trong Hero slider trang chủ</p>
                                        </div>
                                    </label>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Độ ưu tiên</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={bannerOptions.banner_priority}
                                            onChange={(e) => setBannerOptions(prev => ({ ...prev, banner_priority: Number(e.target.value) }))}
                                        />
                                        <p className="text-xs text-muted-foreground">Số cao = hiển thị trước</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!formData.banner_image && bannerOptions.create_banner && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <p className="text-sm text-amber-600">
                                    ⚠️ Cần upload ảnh banner ở tab "Thông tin" để tạo banner
                                </p>
                            </div>
                        )}
                    </div>
                )

            case 'rooms':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium flex items-center gap-2">
                                <MapPin className="size-4" />
                                Chọn phòng tổ chức
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {rooms.map((room) => (
                                <div
                                    key={room.id}
                                    onClick={() => toggleRoomSelection(room.id)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${(formData.room_ids || []).includes(room.id)
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'hover:bg-muted border-border'
                                        }`}
                                >
                                    <p className="font-medium">{room.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {room.rows * room.seatsPerRow} ghế
                                    </p>
                                </div>
                            ))}
                            {rooms.length === 0 && (
                                <p className="col-span-2 text-sm text-muted-foreground text-center py-4">
                                    Chưa có phòng nào. Vui lòng tạo phòng trong mục "Quản lý phòng".
                                </p>
                            )}
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý sự kiện</h1>
                    <p className="text-muted-foreground mt-1">Tạo và quản lý các sự kiện</p>
                </div>
                <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
                    <Plus className="size-4 mr-2" />
                    Thêm sự kiện
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm sự kiện..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6">
                            <SkeletonTable rows={5} />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="text-left p-4 font-medium text-sm">Sự kiện</th>
                                        <th className="text-left p-4 font-medium text-sm">Danh mục</th>
                                        <th className="text-left p-4 font-medium text-sm">Ngày</th>
                                        <th className="text-left p-4 font-medium text-sm">Trạng thái</th>
                                        <th className="text-right p-4 font-medium text-sm">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((event: any, index: number) => (
                                        <motion.tr
                                            key={event.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="border-b border-border last:border-0 hover:bg-muted/50"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getImageUrl(event.banner_image) || 'https://via.placeholder.com/60x40'}
                                                        alt={event.title}
                                                        className="w-16 h-10 rounded-lg object-cover bg-muted"
                                                    />
                                                    <div>
                                                        <p className="font-medium line-clamp-1">{event.title}</p>
                                                        <p className="text-sm text-muted-foreground">{event.location}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="secondary">{event.category || 'N/A'}</Badge>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {event.start_time ? formatDate(event.start_time) : 'N/A'}
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant={
                                                        event.status === 'published'
                                                            ? 'success'
                                                            : event.status === 'draft'
                                                                ? 'secondary'
                                                                : 'destructive'
                                                    }
                                                >
                                                    {event.status === 'published'
                                                        ? 'Đã xuất bản'
                                                        : event.status === 'draft'
                                                            ? 'Nháp'
                                                            : event.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => window.open(`/events/${event.id}`, '_blank')}
                                                    >
                                                        <Eye className="size-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => openEditModal(event)}>
                                                        <Edit className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => openDeleteModal(event)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>

                            {events.length === 0 && (
                                <div className="py-12 text-center text-muted-foreground">
                                    Không tìm thấy sự kiện nào
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Modal - Tabbed */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); resetForm() }}
                title="Thêm sự kiện mới"
                description="Tạo sự kiện với loại vé và banner"
                size="lg"
            >
                {/* Tabs */}
                <div className="flex gap-1 mb-4 border-b border-border">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 -mb-px ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <tab.icon className="size-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="max-h-[50vh] overflow-y-auto pr-2">
                    {renderTabContent()}
                </div>

                <ModalFooter>
                    <Button variant="outline" onClick={() => { setIsAddModalOpen(false); resetForm() }}>
                        Hủy
                    </Button>
                    <Button onClick={handleAdd} disabled={isSaving || !formData.title}>
                        {isSaving ? 'Đang lưu...' : 'Tạo sự kiện'}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedEvent(null); resetForm() }}
                title="Chỉnh sửa sự kiện"
                description={`Cập nhật thông tin sự kiện "${selectedEvent?.title}"`}
                size="lg"
            >
                {/* Tabs - only info and rooms for edit */}
                <div className="flex gap-1 mb-4 border-b border-border">
                    {tabs.filter(t => ['info', 'rooms'].includes(t.id)).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 -mb-px ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <tab.icon className="size-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="max-h-[50vh] overflow-y-auto pr-2">
                    {renderTabContent()}
                </div>

                <ModalFooter>
                    <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setSelectedEvent(null); resetForm() }}>
                        Hủy
                    </Button>
                    <Button onClick={handleEdit} disabled={isSaving}>
                        {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setSelectedEvent(null) }}
                title="Xác nhận xóa"
                size="sm"
            >
                <p className="text-muted-foreground">
                    Bạn có chắc chắn muốn xóa sự kiện "{selectedEvent?.title}"? Hành động này không thể hoàn tác.
                </p>
                <ModalFooter>
                    <Button variant="outline" onClick={() => { setIsDeleteModalOpen(false); setSelectedEvent(null) }}>
                        Hủy
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        Xóa
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
