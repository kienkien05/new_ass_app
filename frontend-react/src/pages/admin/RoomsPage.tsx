import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, SquarePen, Trash2, Armchair, Ticket, Grid3X3, Power, PowerOff, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { useRoomStore, type Room, type Seat } from '@/stores/roomStore'
import { useTicketStore, SoldTicket } from '@/stores/ticketStore'
import { eventService } from '@/services/eventService'
import type { Event } from '@/types'

export default function AdminRoomsPage() {
    const navigate = useNavigate()
    const { rooms, addRoom, updateRoom, deleteRoom, toggleRoomActive, updateRoomSeatsBatch, fetchRooms } = useRoomStore()
    const { tickets } = useTicketStore()

    const [events, setEvents] = useState<Event[]>([])
    const [selectedEventId, setSelectedEventId] = useState('')

    useEffect(() => {
        fetchRooms()
        const fetchEvents = async () => {
            try {
                const res = await eventService.getEvents({ limit: 100 })
                setEvents(res.data)
            } catch (err) {
                console.error("Failed to fetch events", err)
            }
        }
        fetchEvents()
    }, [fetchRooms])

    const [search, setSearch] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [pendingSeats, setPendingSeats] = useState<{ id: string; isActive: boolean }[]>([])
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        rows: 8,
        seatsPerRow: 10,
    })

    const filteredRooms = rooms.filter((room) =>
        room.name.toLowerCase().includes(search.toLowerCase())
    )

    const stats = {
        total: rooms.length,
        active: rooms.filter((r) => r.isActive).length,
        totalSeats: rooms.reduce((sum, r) => sum + r.seats.length, 0),
    }

    const resetForm = () => {
        setFormData({ name: '', rows: 8, seatsPerRow: 10 })
        setPendingSeats([])
        setSelectedEventId('')
    }

    const handleAdd = () => {
        if (!formData.name) {
            toast.error('Vui lòng nhập tên phòng!')
            return
        }
        addRoom({
            name: formData.name,
            rows: formData.rows,
            seatsPerRow: formData.seatsPerRow,
        })
        setIsAddModalOpen(false)
        resetForm()
        toast.success('Thêm phòng thành công!')
    }

    // Handle save all changes (room info + seat status)
    const handleSaveRoom = async () => {
        if (!selectedRoom) return

        setIsSaving(true)
        try {
            // Update room name if changed
            if (formData.name !== selectedRoom.name) {
                await updateRoom(selectedRoom.id, { name: formData.name })
            }

            // Update seats if any pending changes
            if (pendingSeats.length > 0) {
                await updateRoomSeatsBatch(selectedRoom.id, pendingSeats)
            }

            setIsEditModalOpen(false)
            setSelectedRoom(null)
            resetForm()
            toast.success('Lưu phòng thành công!')
        } catch (error) {
            toast.error('Có lỗi xảy ra khi lưu phòng!')
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = () => {
        if (!selectedRoom) return
        deleteRoom(selectedRoom.id)
        setIsDeleteModalOpen(false)
        setSelectedRoom(null)
        toast.success('Xóa phòng thành công!')
    }

    const openEditModal = (room: Room) => {
        setSelectedRoom(room)
        setFormData({
            name: room.name,
            rows: room.rows,
            seatsPerRow: room.seatsPerRow,
        })
        setPendingSeats([])
        setSelectedEventId('')
        setIsEditModalOpen(true)
    }

    const openDeleteModal = (room: Room) => {
        setSelectedRoom(room)
        setIsDeleteModalOpen(true)
    }

    const handleSeatToggle = useCallback((seatId: string, currentStatus: boolean) => {
        setPendingSeats(prev => {
            const existing = prev.find(p => p.id === seatId)
            if (existing) {
                return prev.map(p => p.id === seatId ? { ...p, isActive: !p.isActive } : p)
            } else {
                return [...prev, { id: seatId, isActive: !currentStatus }]
            }
        })
    }, [])

    const handleSoldSeatClick = (ticket: SoldTicket) => {
        navigate(`/admin/orders?search=${ticket.ticket_code}`)
    }

    // Get current room data (reactive to store changes)
    const currentRoom = selectedRoom ? rooms.find((r) => r.id === selectedRoom.id) : null

    // Group seats by row
    const getSeatsByRow = (seats: Seat[]): Record<string, Seat[]> => {
        const byRow: Record<string, Seat[]> = {}
        seats.forEach((seat) => {
            if (!byRow[seat.row]) byRow[seat.row] = []
            byRow[seat.row].push(seat)
        })
        // Sort each row by seat number
        Object.keys(byRow).forEach(row => {
            byRow[row].sort((a, b) => a.number - b.number)
        })
        return byRow
    }

    // Check if form has changes
    const hasChanges = selectedRoom && (
        formData.name !== selectedRoom.name ||
        pendingSeats.length > 0
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý phòng chiếu</h1>
                    <p className="text-muted-foreground mt-1">Quản lý phòng và sơ đồ ghế ngồi</p>
                </div>
                <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
                    <Plus className="size-4 mr-2" />
                    Thêm phòng
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Grid3X3 className="size-5 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Tổng phòng</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Grid3X3 className="size-5 text-emerald-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Armchair className="size-5 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.totalSeats}</p>
                                <p className="text-xs text-muted-foreground">Tổng ghế</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm phòng..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room, index) => {
                    const activeSeats = room.seats.filter((s) => s.isActive).length
                    const inactiveSeats = room.seats.length - activeSeats

                    return (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className={!room.isActive ? 'opacity-60' : ''}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg">{room.name}</CardTitle>
                                        <Badge variant={room.isActive ? 'success' : 'secondary'}>
                                            {room.isActive ? 'Hoạt động' : 'Tắt'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="p-2 bg-muted rounded">
                                            <p className="text-muted-foreground">Kích thước</p>
                                            <p className="font-medium">{room.rows} hàng × {room.seatsPerRow} ghế</p>
                                        </div>
                                        <div className="p-2 bg-muted rounded">
                                            <p className="text-muted-foreground">Tổng ghế</p>
                                            <p className="font-medium">{room.seats.length} ghế</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 text-xs">
                                        <span className="flex items-center gap-1">
                                            <div className="size-3 bg-emerald-500 rounded" />
                                            Mở: {activeSeats}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <div className="size-3 bg-red-500 rounded" />
                                            Đóng: {inactiveSeats}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 justify-end mt-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={room.isActive ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-muted-foreground hover:bg-muted"}
                                            onClick={() => toggleRoomActive(room.id)}
                                            title={room.isActive ? "Tắt phòng" : "Bật phòng"}
                                        >
                                            {room.isActive ? <Power className="size-4" /> : <PowerOff className="size-4" />}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:bg-accent hover:text-accent-foreground"
                                            onClick={() => openEditModal(room)}
                                            title="Sửa phòng"
                                        >
                                            <SquarePen className="size-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => openDeleteModal(room)}
                                            title="Xóa phòng"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            {filteredRooms.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                    <Grid3X3 className="size-12 mx-auto mb-4 opacity-50" />
                    <p>Không tìm thấy phòng nào</p>
                </div>
            )}

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); resetForm() }}
                title="Thêm phòng mới"
                description="Tạo phòng chiếu mới với sơ đồ ghế"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên phòng *</label>
                        <Input
                            placeholder="VD: Phòng chiếu 1"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Số hàng</label>
                            <Input
                                type="number"
                                min={1}
                                max={26}
                                value={formData.rows}
                                onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ghế mỗi hàng</label>
                            <Input
                                type="number"
                                min={1}
                                max={30}
                                value={formData.seatsPerRow}
                                onChange={(e) => setFormData({ ...formData, seatsPerRow: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Tổng: {formData.rows * formData.seatsPerRow} ghế
                    </p>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => { setIsAddModalOpen(false); resetForm() }}>
                        Hủy
                    </Button>
                    <Button onClick={handleAdd}>
                        Thêm phòng
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Unified Edit Modal - 2 Column Layout */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); resetForm(); setSelectedRoom(null) }}
                title={`Chỉnh sửa phòng - ${selectedRoom?.name || ''}`}
                description="Cập nhật thông tin phòng và sơ đồ ghế"
                size="full"
            >
                {currentRoom && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[500px]">
                        {/* Left Column - Form (2 cols) */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <SquarePen className="size-5" />
                                    Thông tin phòng
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tên phòng</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Nhập tên phòng"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Số hàng</label>
                                        <Input
                                            type="number"
                                            value={formData.rows}
                                            disabled
                                            className="bg-muted cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Ghế mỗi hàng</label>
                                        <Input
                                            type="number"
                                            value={formData.seatsPerRow}
                                            disabled
                                            className="bg-muted cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                                    ⚠️ Không thể thay đổi kích thước phòng sau khi tạo
                                </p>

                                <div className="pt-2 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Tổng: <span className="font-semibold text-foreground">{currentRoom.seats.length} ghế</span>
                                    </p>
                                </div>
                            </div>

                            {/* Event Filter for sold seats */}
                            <div className="space-y-2 p-4 bg-muted/50 rounded-xl">
                                <label className="text-sm font-medium">Xem trạng thái đặt vé</label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={selectedEventId}
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                >
                                    <option value="">-- Chọn sự kiện --</option>
                                    {events.map(event => (
                                        <option key={event.id} value={event.id}>{event.title}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Legend */}
                            <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                                <h4 className="text-sm font-medium mb-3">Chú thích</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="size-5 bg-emerald-500 rounded" />
                                        <span>Mở (có thể bán)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-5 bg-red-500 rounded" />
                                        <span>Đóng (không bán)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-5 bg-amber-500 rounded ring-2 ring-amber-500 ring-offset-1" />
                                        <span>Đang thay đổi</span>
                                    </div>
                                    {selectedEventId && (
                                        <div className="flex items-center gap-2">
                                            <div className="size-5 bg-blue-600 rounded flex items-center justify-center">
                                                <Ticket className="size-3 text-white" />
                                            </div>
                                            <span>Đã bán</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="p-4 bg-muted/50 rounded-xl">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Ghế mở:</span>
                                        <span className="ml-2 font-semibold text-emerald-600">
                                            {currentRoom.seats.filter(s => {
                                                const p = pendingSeats.find(x => x.id === s.id)
                                                return p ? p.isActive : s.isActive
                                            }).length}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Ghế đóng:</span>
                                        <span className="ml-2 font-semibold text-red-500">
                                            {currentRoom.seats.filter(s => {
                                                const p = pendingSeats.find(x => x.id === s.id)
                                                return p ? !p.isActive : !s.isActive
                                            }).length}
                                        </span>
                                    </div>
                                    {pendingSeats.length > 0 && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Thay đổi chờ lưu:</span>
                                            <span className="ml-2 font-semibold text-amber-600 animate-pulse">
                                                {pendingSeats.length} ghế
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Seat Map (3 cols) */}
                        <div className="lg:col-span-3 flex flex-col">
                            <div className="flex-1 p-4 bg-muted/30 rounded-xl border overflow-auto">
                                {/* Screen */}
                                <div className="w-full py-3 mb-4 bg-gradient-to-b from-primary/20 to-transparent rounded-t-3xl text-center text-sm text-muted-foreground">
                                    Màn hình / Sân khấu
                                </div>

                                {/* Seat Grid */}
                                <div className="overflow-x-auto pb-4">
                                    <div className="min-w-max mx-auto">
                                        {Object.entries(getSeatsByRow(currentRoom.seats)).map(([row, rowSeats]) => (
                                            <div key={row} className="flex items-center gap-2 mb-2 justify-center">
                                                <span className="w-6 text-center text-sm font-medium text-muted-foreground">{row}</span>
                                                <div className="flex gap-1">
                                                    {rowSeats.map((seat) => {
                                                        const pending = pendingSeats.find(p => p.id === seat.id)
                                                        const isActive = pending ? pending.isActive : seat.isActive
                                                        const isModified = !!pending

                                                        const soldTicket = selectedEventId ? tickets.find(t =>
                                                            t.event_id === selectedEventId &&
                                                            t.status !== 'cancelled' &&
                                                            (t.seat?.id === seat.id || (t.seat?.room === currentRoom.name && t.seat?.row === seat.row && t.seat?.number === seat.number))
                                                        ) : null

                                                        const isSold = !!soldTicket

                                                        return (
                                                            <button
                                                                key={seat.id}
                                                                onClick={() => {
                                                                    if (isSold && selectedEventId) {
                                                                        handleSoldSeatClick(soldTicket!)
                                                                        return
                                                                    }
                                                                    handleSeatToggle(seat.id, isActive)
                                                                }}
                                                                className={`size-8 rounded flex items-center justify-center text-xs font-medium transition-all relative ${isModified ? 'ring-2 ring-amber-500 ring-offset-1' : ''
                                                                    } ${isSold
                                                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                                        : isActive
                                                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                            : 'bg-red-500 text-white hover:bg-red-600'
                                                                    }`}
                                                                title={isSold ? `Đã bán: ${soldTicket?.ticket_code} (${soldTicket?.buyer_name})` : `Ghế ${seat.row}${seat.number}`}
                                                            >
                                                                {isSold ? <Ticket className="size-4" /> : seat.number}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                <span className="w-6 text-center text-sm font-medium text-muted-foreground">{row}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <ModalFooter>
                    <div className="flex w-full justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => setPendingSeats([])}
                            disabled={pendingSeats.length === 0}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            Khôi phục ghế
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditModalOpen(false)
                                    setSelectedRoom(null)
                                    resetForm()
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleSaveRoom}
                                disabled={!hasChanges || isSaving}
                            >
                                <Save className="size-4 mr-2" />
                                {isSaving ? 'Đang lưu...' : 'Lưu phòng'}
                            </Button>
                        </div>
                    </div>
                </ModalFooter>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Xác nhận xóa"
                size="sm"
            >
                <p className="text-muted-foreground">
                    Bạn có chắc chắn muốn xóa phòng "{selectedRoom?.name}"? Hành động này không thể hoàn tác.
                </p>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
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
