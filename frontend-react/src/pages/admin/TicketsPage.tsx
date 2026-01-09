import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Ticket, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { SkeletonTable } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { ticketService, type TicketType } from '@/services/ticketService'
import { eventService } from '@/services/eventService'

export default function AdminTicketsPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        event_id: '',
        name: 'Standard',
        price: '',
        quantity_total: '',
        description: ''
    })

    // Fetch Ticket Types
    const { data: ticketTypes = [], isLoading } = useQuery({
        queryKey: ['admin-ticket-types'],
        queryFn: () => ticketService.getTicketTypes(),
    })

    // Fetch Events (for dropdown)
    const { data: eventsResponse } = useQuery({
        queryKey: ['admin-events-list'],
        queryFn: () => eventService.getEvents({ limit: 100 }), // Get all events ideally
    })
    const events = eventsResponse?.data || []

    const filteredTickets = ticketTypes.filter((ticket: TicketType) =>
        ticket.event_title?.toLowerCase().includes(search.toLowerCase()) ||
        ticket.name.toLowerCase().includes(search.toLowerCase())
    )

    // Calculate stats
    const stats = {
        total: ticketTypes.length,
        active: ticketTypes.filter((t: TicketType) => t.status === 'active').length,
        soldOut: ticketTypes.filter((t: TicketType) => t.quantity_sold >= t.quantity_total).length,
        totalSold: ticketTypes.reduce((sum: number, t: TicketType) => sum + t.quantity_sold, 0),
        totalRevenue: ticketTypes.reduce((sum: number, t: TicketType) => sum + t.quantity_sold * t.price, 0),
    }

    const resetForm = () => {
        setFormData({ event_id: '', name: 'Standard', price: '', quantity_total: '', description: '' })
    }

    // Handlers
    const handleAdd = async () => {
        if (!formData.event_id || !formData.price || !formData.quantity_total) {
            toast.error('Vui lòng điền đầy đủ thông tin!')
            return
        }

        setIsSaving(true)
        try {
            await ticketService.createTicketType({
                event_id: formData.event_id,
                name: formData.name,
                price: Number(formData.price),
                quantity_total: Number(formData.quantity_total),
                description: formData.description
            })
            toast.success('Thêm vé thành công!')
            queryClient.invalidateQueries({ queryKey: ['admin-ticket-types'] })
            setIsAddModalOpen(false)
            resetForm()
        } catch (error) {
            toast.error('Lỗi khi thêm vé')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleEdit = async () => {
        if (!selectedTicket) return

        setIsSaving(true)
        try {
            await ticketService.updateTicketType(selectedTicket.id, {
                name: formData.name,
                price: Number(formData.price),
                quantity_total: Number(formData.quantity_total),
                description: formData.description
            })
            toast.success('Cập nhật vé thành công!')
            queryClient.invalidateQueries({ queryKey: ['admin-ticket-types'] })
            setIsEditModalOpen(false)
            setSelectedTicket(null)
            resetForm()
        } catch (error) {
            toast.error('Lỗi khi cập nhật vé')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedTicket) return

        setIsSaving(true)
        try {
            await ticketService.deleteTicketType(selectedTicket.id)
            toast.success('Xóa vé thành công!')
            queryClient.invalidateQueries({ queryKey: ['admin-ticket-types'] })
            setIsDeleteModalOpen(false)
            setSelectedTicket(null)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Lỗi khi xóa vé')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const toggleStatus = async (ticket: TicketType) => {
        try {
            const newStatus = ticket.status === 'active' ? 'hidden' : 'active'
            await ticketService.updateTicketType(ticket.id, { status: newStatus })
            toast.success(newStatus === 'active' ? 'Đã hiện vé' : 'Đã ẩn vé')
            queryClient.invalidateQueries({ queryKey: ['admin-ticket-types'] })
        } catch (error) {
            toast.error('Lỗi khi thay đổi trạng thái')
        }
    }

    const openEditModal = (ticket: TicketType) => {
        setSelectedTicket(ticket)
        setFormData({
            event_id: ticket.event_id,
            name: ticket.name,
            price: ticket.price.toString(),
            quantity_total: ticket.quantity_total.toString(),
            description: ticket.description || ''
        })
        setIsEditModalOpen(true)
    }

    const openDeleteModal = (ticket: TicketType) => {
        setSelectedTicket(ticket)
        setIsDeleteModalOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Vé Sự kiện</h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý các loại vé cho từng sự kiện
                    </p>
                </div>
                <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
                    <Plus className="size-4 mr-2" />
                    Thêm vé sự kiện
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Loại vé</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-emerald-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-xs text-muted-foreground">Đang bán</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-amber-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.soldOut}</p>
                                <p className="text-xs text-muted-foreground">Hết vé</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.totalSold}</p>
                                <p className="text-xs text-muted-foreground">Vé đã bán</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-emerald-600" />
                            <div>
                                <p className="text-lg font-bold">{formatCurrency(stats.totalRevenue)}</p>
                                <p className="text-xs text-muted-foreground">Doanh thu dự kiến</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                    placeholder="Tìm theo tên sự kiện hoặc loại vé..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Tickets Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6"><SkeletonTable rows={5} /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="text-left p-4 font-medium text-sm">Sự kiện / Loại vé</th>
                                        <th className="text-left p-4 font-medium text-sm">Giá vé</th>
                                        <th className="text-left p-4 font-medium text-sm">Số lượng</th>
                                        <th className="text-left p-4 font-medium text-sm">Đã bán</th>
                                        <th className="text-left p-4 font-medium text-sm">Trạng thái</th>
                                        <th className="text-right p-4 font-medium text-sm">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTickets.map((ticket: TicketType, index: number) => (
                                        <motion.tr
                                            key={ticket.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="border-b border-border last:border-0 hover:bg-muted/50"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Calendar className="size-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium line-clamp-1">{ticket.event_title || 'Unknown Event'}</p>
                                                        <p className="text-xs text-muted-foreground">{ticket.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-primary">
                                                {formatCurrency(ticket.price)}
                                            </td>
                                            <td className="p-4">{ticket.quantity_total}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span>{ticket.quantity_sold}</span>
                                                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full"
                                                            style={{
                                                                width: `${(ticket.quantity_sold / ticket.quantity_total) * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant={
                                                        ticket.status === 'active'
                                                            ? 'success'
                                                            : ticket.status === 'sold_out'
                                                                ? 'secondary'
                                                                : 'destructive'
                                                    }
                                                >
                                                    {ticket.status === 'active'
                                                        ? 'Đang bán'
                                                        : ticket.status === 'sold_out'
                                                            ? 'Hết vé'
                                                            : 'Đã ẩn'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => toggleStatus(ticket)}
                                                        disabled={ticket.status === 'sold_out'}
                                                    >
                                                        {ticket.status === 'active' ? (
                                                            <EyeOff className="size-4" />
                                                        ) : (
                                                            <Eye className="size-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditModal(ticket)}
                                                    >
                                                        <Edit className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => openDeleteModal(ticket)}
                                                        disabled={ticket.quantity_sold > 0}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredTickets.length === 0 && (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Ticket className="size-12 mx-auto mb-4 opacity-50" />
                                    <p>Không tìm thấy vé nào</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); resetForm() }}
                title="Thêm vé cho sự kiện"
                description="Tạo loại vé mới cho sự kiện đã có"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Chọn sự kiện *</label>
                        <select
                            value={formData.event_id}
                            onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        >
                            <option value="">-- Chọn sự kiện --</option>
                            {events.map((event: any) => (
                                <option key={event.id} value={event.id}>
                                    {event.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên loại vé *</label>
                        <Input
                            placeholder="VD: VIP, Standard, Early Bird..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Giá vé (VNĐ) *</label>
                        <Input
                            type="number"
                            placeholder="VD: 500000"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Số lượng vé *</label>
                        <Input
                            type="number"
                            placeholder="VD: 100"
                            value={formData.quantity_total}
                            onChange={(e) => setFormData({ ...formData, quantity_total: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mô tả (tùy chọn)</label>
                        <Input
                            placeholder="Mô tả quyền lợi..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {formData.price && formData.quantity_total && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Doanh thu tối đa</p>
                            <p className="text-xl font-bold text-primary">
                                {formatCurrency(parseInt(formData.price) * parseInt(formData.quantity_total))}
                            </p>
                        </div>
                    )}
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => { setIsAddModalOpen(false); resetForm() }}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={!formData.event_id || !formData.price || !formData.quantity_total || isSaving}
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Thêm vé
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); resetForm() }}
                title="Chỉnh sửa vé"
                description={selectedTicket?.event_title}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên loại vé</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Giá vé (VNĐ)</label>
                        <Input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Số lượng vé</label>
                        <Input
                            type="number"
                            value={formData.quantity_total}
                            onChange={(e) => setFormData({ ...formData, quantity_total: e.target.value })}
                            min={selectedTicket?.quantity_sold || 0}
                        />
                        {selectedTicket && selectedTicket.quantity_sold > 0 && (
                            <p className="text-xs text-amber-600">
                                Đã bán {selectedTicket.quantity_sold} vé, không thể giảm dưới số này
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mô tả</label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => { setIsEditModalOpen(false); resetForm() }}>
                        Hủy
                    </Button>
                    <Button onClick={handleEdit} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                    Bạn có chắc chắn muốn xóa loại vé "{selectedTicket?.name}" của sự kiện "{selectedTicket?.event_title}"?
                </p>
                {selectedTicket && selectedTicket.quantity_sold > 0 && (
                    <p className="text-destructive text-sm mt-2">
                        ⚠️ Không thể xóa vì đã có {selectedTicket.quantity_sold} người mua
                    </p>
                )}
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                        Hủy
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={(selectedTicket ? selectedTicket.quantity_sold > 0 : false) || isSaving}
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Xóa
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
