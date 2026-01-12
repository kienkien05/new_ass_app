import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Filter, Ticket, User, X, Eye, CheckSquare, Square, Mail, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { formatDate, formatCurrency } from '@/lib/utils'
import api from '@/services/api'
import { ticketService } from '@/services/ticketService'
import CreateManualTicketModal from '@/components/admin/CreateManualTicketModal'

// Match actual API response format (flat structure)
interface AdminTicket {
    id: string
    ticket_code: string
    qr_code?: string
    status: 'valid' | 'used' | 'cancelled'
    price: number
    purchase_date: string
    event_id: string
    event_title: string
    event_date: string
    event_location: string
    buyer_id: string
    buyer_name: string
    buyer_email: string
    seat?: {
        id: string
        room: string
        row: string
        number: number
    }
}

export default function AdminOrdersPage() {
    const queryClient = useQueryClient()
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [isResendModalOpen, setIsResendModalOpen] = useState(false)
    const [isCreateManualModalOpen, setIsCreateManualModalOpen] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null)
    const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([])
    const [isResending, setIsResending] = useState(false)

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState(() => {
        const params = new URLSearchParams(window.location.search)
        return params.get('search') || ''
    })
    const [filters, setFilters] = useState({
        event: '',
        status: '',
    })
    const [tempFilters, setTempFilters] = useState(filters)

    // Fetch tickets from API
    const { data, isLoading } = useQuery<{ success: boolean; data: AdminTicket[] }>({
        queryKey: ['adminTickets'],
        queryFn: async () => {
            const response = await api.get('/orders/tickets')
            return response.data
        }
    })

    const tickets = data?.data || []

    // Update ticket status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
            if (status === 'used') {
                const ticket = tickets.find(t => t.id === ticketId)
                if (ticket) {
                    await api.post('/tickets/validate-qr', { ticket_code: ticket.ticket_code })
                }
            }
            return { ticketId, status }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminTickets'] })
            toast.success('Đã cập nhật trạng thái vé')
        },
        onError: () => {
            toast.error('Không thể cập nhật trạng thái')
        }
    })

    // Get unique values for filter options
    const uniqueEvents = [...new Set(tickets.map((t) => t.event_title))]

    // Filter tickets
    const filteredTickets = tickets.filter((ticket) => {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = searchQuery === '' ||
            ticket.ticket_code.toLowerCase().includes(searchLower) ||
            ticket.buyer_name.toLowerCase().includes(searchLower) ||
            ticket.buyer_email.toLowerCase().includes(searchLower) ||
            ticket.event_title.toLowerCase().includes(searchLower)

        const matchesEvent = filters.event === '' || ticket.event_title === filters.event
        const matchesStatus = filters.status === '' || ticket.status === filters.status

        return matchesSearch && matchesEvent && matchesStatus
    })

    const stats = {
        total: tickets.length,
        valid: tickets.filter((t) => t.status === 'valid').length,
        used: tickets.filter((t) => t.status === 'used').length,
        cancelled: tickets.filter((t) => t.status === 'cancelled').length,
        revenue: tickets.filter((t) => t.status !== 'cancelled').reduce((sum, t) => sum + t.price, 0),
    }

    const activeFilterCount = Object.values(filters).filter((v) => v !== '').length

    const openFilterModal = () => {
        setTempFilters(filters)
        setIsFilterModalOpen(true)
    }

    const applyFilters = () => {
        setFilters(tempFilters)
        setIsFilterModalOpen(false)
    }

    const clearFilters = () => {
        const emptyFilters = { event: '', status: '' }
        setFilters(emptyFilters)
        setTempFilters(emptyFilters)
        setIsFilterModalOpen(false)
    }

    const openDetailModal = (ticket: AdminTicket) => {
        setSelectedTicket(ticket)
        setIsDetailModalOpen(true)
    }

    const handleUpdateStatus = (status: 'valid' | 'used' | 'cancelled') => {
        if (!selectedTicket) return
        updateStatusMutation.mutate({ ticketId: selectedTicket.id, status })
        setSelectedTicket({ ...selectedTicket, status })
    }

    const getQRCodeUrl = (ticket: AdminTicket) => {
        if (ticket.qr_code) return ticket.qr_code
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticket.ticket_code)}`
    }

    const toggleTicketSelection = (ticketId: string) => {
        setSelectedTicketIds(prev =>
            prev.includes(ticketId)
                ? prev.filter(id => id !== ticketId)
                : [...prev, ticketId]
        )
    }

    const toggleAllTickets = () => {
        if (selectedTicketIds.length === filteredTickets.length) {
            setSelectedTicketIds([])
        } else {
            setSelectedTicketIds(filteredTickets.map(t => t.id))
        }
    }

    const handleResendEmails = async () => {
        setIsResending(true)
        try {
            const result = await ticketService.resendTicketEmails(selectedTicketIds)
            toast.success(result.message || 'Đã gửi email thành công')
            setSelectedTicketIds([])
            setIsResendModalOpen(false)
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể gửi email')
        } finally {
            setIsResending(false)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-96 rounded-lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Quản lý vé đã bán</h1>
                <p className="text-muted-foreground mt-1">Tìm kiếm và quản lý vé đã bán trong hệ thống</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Tổng vé bán</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-emerald-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.valid}</p>
                                <p className="text-xs text-muted-foreground">Còn hiệu lực</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.used}</p>
                                <p className="text-xs text-muted-foreground">Đã sử dụng</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-destructive" />
                            <div>
                                <p className="text-2xl font-bold">{stats.cancelled}</p>
                                <p className="text-xs text-muted-foreground">Đã hủy</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-amber-600" />
                            <div>
                                <p className="text-lg font-bold">{formatCurrency(stats.revenue)}</p>
                                <p className="text-xs text-muted-foreground">Doanh thu</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3">
                <Button
                    onClick={() => setIsCreateManualModalOpen(true)}
                    variant="default"
                >
                    <Plus className="size-4 mr-2" />
                    Tạo vé thủ công
                </Button>
                <Button variant="outline" onClick={openFilterModal} className="relative">
                    <Filter className="size-4 mr-2" />
                    Bộ lọc
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-2 -right-2 size-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
                {selectedTicketIds.length > 0 && (
                    <Button
                        onClick={() => setIsResendModalOpen(true)}
                        variant="default"
                    >
                        <Mail className="size-4 mr-2" />
                        Gửi lại vé ({selectedTicketIds.length})
                    </Button>
                )}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo mã vé, tên, email, sự kiện..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2">
                    {filters.event && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            Sự kiện: {filters.event}
                            <button onClick={() => setFilters({ ...filters, event: '' })} className="ml-1 p-0.5 hover:bg-muted rounded">
                                <X className="size-3" />
                            </button>
                        </Badge>
                    )}
                    {filters.status && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            Trạng thái: {filters.status === 'valid' ? 'Còn hiệu lực' : filters.status === 'used' ? 'Đã sử dụng' : 'Đã hủy'}
                            <button onClick={() => setFilters({ ...filters, status: '' })} className="ml-1 p-0.5 hover:bg-muted rounded">
                                <X className="size-3" />
                            </button>
                        </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                        Xóa tất cả
                    </Button>
                </div>
            )}

            {/* Results */}
            <p className="text-sm text-muted-foreground">
                Tìm thấy {filteredTickets.length} vé
            </p>

            {/* Tickets Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left p-4 w-12">
                                        <button onClick={toggleAllTickets} className="hover:opacity-70">
                                            {selectedTicketIds.length === filteredTickets.length && filteredTickets.length > 0 ? (
                                                <CheckSquare className="size-5" />
                                            ) : (
                                                <Square className="size-5" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="text-left p-4 font-medium text-sm">Mã vé</th>
                                    <th className="text-left p-4 font-medium text-sm">Sự kiện</th>
                                    <th className="text-left p-4 font-medium text-sm">Người mua</th>
                                    <th className="text-left p-4 font-medium text-sm">Chỗ ngồi</th>
                                    <th className="text-left p-4 font-medium text-sm">Giá</th>
                                    <th className="text-left p-4 font-medium text-sm">Trạng thái</th>
                                    <th className="text-right p-4 font-medium text-sm">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.map((ticket, index) => (
                                    <motion.tr
                                        key={ticket.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="border-b border-border last:border-0 hover:bg-muted/50"
                                    >
                                        <td className="p-4 w-12">
                                            <button
                                                onClick={() => toggleTicketSelection(ticket.id)}
                                                className="hover:opacity-70"
                                            >
                                                {selectedTicketIds.includes(ticket.id) ? (
                                                    <CheckSquare className="size-5 text-primary" />
                                                ) : (
                                                    <Square className="size-5" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono text-sm">{ticket.ticket_code}</span>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium line-clamp-1">{ticket.event_title}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(ticket.event_date)}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="size-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{ticket.buyer_name}</p>
                                                    <p className="text-xs text-muted-foreground">{ticket.buyer_email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {ticket.seat ? (
                                                <span className="text-sm">{ticket.seat.row}{ticket.seat.number}</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-medium">{formatCurrency(ticket.price)}</td>
                                        <td className="p-4">
                                            <Badge
                                                variant={
                                                    ticket.status === 'valid' ? 'success' :
                                                        ticket.status === 'used' ? 'secondary' : 'destructive'
                                                }
                                            >
                                                {ticket.status === 'valid' ? 'Còn hiệu lực' :
                                                    ticket.status === 'used' ? 'Đã sử dụng' : 'Đã hủy'}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <Button variant="ghost" size="icon" onClick={() => openDetailModal(ticket)}>
                                                <Eye className="size-4" />
                                            </Button>
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
                </CardContent>
            </Card>

            {/* Filter Modal */}
            <Modal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title="Bộ lọc nâng cao"
                description="Lọc vé theo nhiều tiêu chí"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Sự kiện</label>
                        <select
                            value={tempFilters.event}
                            onChange={(e) => setTempFilters({ ...tempFilters, event: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        >
                            <option value="">Tất cả sự kiện</option>
                            {uniqueEvents.map((event) => (
                                <option key={event} value={event}>{event}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Trạng thái</label>
                        <select
                            value={tempFilters.status}
                            onChange={(e) => setTempFilters({ ...tempFilters, status: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="valid">Còn hiệu lực</option>
                            <option value="used">Đã sử dụng</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="ghost" onClick={clearFilters}>
                        Xóa bộ lọc
                    </Button>
                    <Button variant="outline" onClick={() => setIsFilterModalOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={applyFilters}>
                        Áp dụng
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Chi tiết vé"
                size="lg"
            >
                {selectedTicket && (
                    <div className="space-y-6">
                        <div className="flex gap-6">
                            <div className="bg-white p-4 rounded-xl shrink-0">
                                <img
                                    src={getQRCodeUrl(selectedTicket)}
                                    alt="QR Code"
                                    className="w-32 h-32"
                                />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Mã vé</p>
                                    <p className="font-mono font-bold text-lg">{selectedTicket.ticket_code}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Sự kiện</p>
                                    <p className="font-medium">{selectedTicket.event_title}</p>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Ngày</p>
                                        <p className="text-sm">{formatDate(selectedTicket.event_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Địa điểm</p>
                                        <p className="text-sm">{selectedTicket.event_location}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div>
                                <p className="text-xs text-muted-foreground">Người mua</p>
                                <p className="font-medium">{selectedTicket.buyer_name}</p>
                                <p className="text-sm text-muted-foreground">{selectedTicket.buyer_email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Chỗ ngồi & Giá</p>
                                {selectedTicket.seat ? (
                                    <p className="font-medium">{selectedTicket.seat.room} - {selectedTicket.seat.row}{selectedTicket.seat.number}</p>
                                ) : (
                                    <p className="text-muted-foreground">Chưa chọn chỗ</p>
                                )}
                                <p className="text-primary font-bold">{formatCurrency(selectedTicket.price)}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <p className="text-sm font-medium">Trạng thái hiện tại</p>
                                <Badge
                                    variant={
                                        selectedTicket.status === 'valid' ? 'success' :
                                            selectedTicket.status === 'used' ? 'secondary' : 'destructive'
                                    }
                                    className="mt-1"
                                >
                                    {selectedTicket.status === 'valid' ? 'Còn hiệu lực' :
                                        selectedTicket.status === 'used' ? 'Đã sử dụng' : 'Đã hủy'}
                                </Badge>
                            </div>
                            <div className="flex gap-2">
                                {selectedTicket.status === 'valid' && (
                                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('used')}>
                                        Đánh dấu đã dùng
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                        Đóng
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Resend Email Modal */}
            <Modal
                isOpen={isResendModalOpen}
                onClose={() => setIsResendModalOpen(false)}
                title="Gửi lại vé"
                description={`Gửi lại email xác nhận cho ${selectedTicketIds.length} vé đã chọn`}
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Email sẽ được gửi đến địa chỉ email của người mua vé. Vui lòng kiểm tra kỹ trước khi gửi.
                    </p>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Danh sách vé:</p>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                            {filteredTickets
                                .filter(t => selectedTicketIds.includes(t.id))
                                .map(ticket => (
                                    <div key={ticket.id} className="flex justify-between text-sm">
                                        <span className="font-mono">{ticket.ticket_code}</span>
                                        <span className="text-muted-foreground">{ticket.buyer_email}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsResendModalOpen(false)} disabled={isResending}>
                        Hủy
                    </Button>
                    <Button onClick={handleResendEmails} disabled={isResending}>
                        <Mail className="size-4 mr-2" />
                        {isResending ? 'Đang gửi...' : 'Gửi email'}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Create Manual Ticket Modal */}
            <CreateManualTicketModal
                isOpen={isCreateManualModalOpen}
                onClose={() => setIsCreateManualModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['adminTickets'] })
                    toast.success('Đã tạo vé thành công!')
                }}
            />
        </div>
    )
}
