import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Calendar, MapPin, Ticket, User, X, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useTicketStore, type SoldTicket } from '@/stores/ticketStore'

export default function AdminOrdersPage() {
    const { tickets, updateTicketStatus } = useTicketStore()
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<SoldTicket | null>(null)

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState(() => {
        // Initialize from URL query param
        const params = new URLSearchParams(window.location.search)
        return params.get('search') || ''
    })
    const [filters, setFilters] = useState({
        event: '',
        date: '',
        location: '',
        status: '',
    })

    // Temp filters for modal
    const [tempFilters, setTempFilters] = useState(filters)

    // Get unique values for filter options
    const uniqueEvents = [...new Set(tickets.map((t) => t.event_title))]
    const uniqueLocations = [...new Set(tickets.map((t) => t.event_location))]

    // Filter tickets
    const filteredTickets = tickets.filter((ticket) => {
        // Text search (code, buyer name, email, event)
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = searchQuery === '' ||
            ticket.ticket_code.toLowerCase().includes(searchLower) ||
            ticket.buyer_name.toLowerCase().includes(searchLower) ||
            ticket.buyer_email.toLowerCase().includes(searchLower) ||
            ticket.event_title.toLowerCase().includes(searchLower)

        // Dropdown filters
        const matchesEvent = filters.event === '' || ticket.event_title === filters.event
        const matchesDate = filters.date === '' || ticket.event_date === filters.date
        const matchesLocation = filters.location === '' || ticket.event_location === filters.location
        const matchesStatus = filters.status === '' || ticket.status === filters.status

        return matchesSearch && matchesEvent && matchesDate && matchesLocation && matchesStatus
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
        const emptyFilters = { event: '', date: '', location: '', status: '' }
        setFilters(emptyFilters)
        setTempFilters(emptyFilters)
        setIsFilterModalOpen(false)
    }

    const openDetailModal = (ticket: SoldTicket) => {
        setSelectedTicket(ticket)
        setIsDetailModalOpen(true)
    }

    const handleUpdateStatus = (status: 'valid' | 'used' | 'cancelled') => {
        if (!selectedTicket) return
        updateTicketStatus(selectedTicket.id, status)
        setSelectedTicket({ ...selectedTicket, status })
        toast.success(`Đã cập nhật trạng thái vé thành "${status === 'valid' ? 'Còn hiệu lực' : status === 'used' ? 'Đã sử dụng' : 'Đã hủy'}"`)
    }

    const getQRCodeUrl = (code: string) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(code)}`
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
                <Button variant="outline" onClick={openFilterModal} className="relative">
                    <Filter className="size-4 mr-2" />
                    Bộ lọc
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-2 -right-2 size-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
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
                    {filters.date && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            <Calendar className="size-3" />
                            {new Date(filters.date).toLocaleDateString('vi-VN')}
                            <button onClick={() => setFilters({ ...filters, date: '' })} className="ml-1 p-0.5 hover:bg-muted rounded">
                                <X className="size-3" />
                            </button>
                        </Badge>
                    )}
                    {filters.location && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            <MapPin className="size-3" />
                            {filters.location.substring(0, 20)}...
                            <button onClick={() => setFilters({ ...filters, location: '' })} className="ml-1 p-0.5 hover:bg-muted rounded">
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
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="size-4" />
                            Ngày tổ chức
                        </label>
                        <Input
                            type="date"
                            value={tempFilters.date}
                            onChange={(e) => setTempFilters({ ...tempFilters, date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="size-4" />
                            Địa điểm
                        </label>
                        <select
                            value={tempFilters.location}
                            onChange={(e) => setTempFilters({ ...tempFilters, location: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        >
                            <option value="">Tất cả địa điểm</option>
                            {uniqueLocations.map((loc) => (
                                <option key={loc} value={loc}>{loc}</option>
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
                            {/* QR Code */}
                            <div className="bg-white p-4 rounded-xl shrink-0">
                                <img
                                    src={getQRCodeUrl(selectedTicket.ticket_code)}
                                    alt="QR Code"
                                    className="w-32 h-32"
                                />
                            </div>
                            {/* Info */}
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
                                {selectedTicket.status !== 'valid' && (
                                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('valid')}>
                                        Khôi phục
                                    </Button>
                                )}
                                {selectedTicket.status === 'valid' && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('used')}>
                                            Đánh dấu đã dùng
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus('cancelled')}>
                                            Hủy vé
                                        </Button>
                                    </>
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
        </div>
    )
}
