import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, ArrowLeft, Armchair, Ticket, CheckCircle, Loader2, Plus, Minus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatCurrency } from '@/lib/utils'
import { eventService } from '@/services/eventService'
import { useTicketStore } from '@/stores/ticketStore'
import { useRoomStore } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'

interface SeatDisplay {
    id: string
    row: string
    number: number
    status: 'available' | 'selected' | 'sold' | 'disabled'
}

interface TicketTypeSelection {
    id: string
    name: string
    price: number
    quantity: number
    max_quantity: number
}

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { tickets, addTicket } = useTicketStore()
    const { getRoomForEvent, getAllRooms, fetchRooms } = useRoomStore()
    const { user, isAuthenticated } = useAuthStore()

    // State
    const [selectedSeats, setSelectedSeats] = useState<SeatDisplay[]>([])
    const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({})
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [isPurchasing, setIsPurchasing] = useState(false)
    const [remainingLimit, setRemainingLimit] = useState<number | null>(null)

    // Fetch rooms
    useEffect(() => {
        fetchRooms()
    }, [fetchRooms])

    // Fetch event details
    const { data: event, isLoading, error } = useQuery({
        queryKey: ['event', id],
        queryFn: () => eventService.getEventById(id!),
        enabled: !!id,
    })

    // Fetch remaining limit
    useEffect(() => {
        if (isAuthenticated && id) {
            api.get(`/orders/remaining/${id}`)
                .then(res => setRemainingLimit(res.data.data.remaining_allowed))
                .catch(console.error)
        }
    }, [isAuthenticated, id])

    // Derived state
    const rooms = getAllRooms()
    const room = getRoomForEvent(id || '') || (rooms.length > 0 ? rooms[0] : undefined)

    // Calculate total quantity selected
    const totalQuantity = useMemo(() =>
        Object.values(ticketQuantities).reduce((a, b) => a + b, 0),
        [ticketQuantities]
    )

    // Calculate total price
    const totalPrice = useMemo(() => {
        if (!event?.ticket_types) return 0
        return event.ticket_types.reduce((total, type) => {
            return total + (type.price * (ticketQuantities[type.id] || 0))
        }, 0)
    }, [event, ticketQuantities])

    // Get sold seats for this event from tickets store (mock data derived)
    // In real app, this should come from API. For now we use local store + basic logic
    const soldSeatIds = useMemo(() => {
        return tickets
            .filter((t) => t.event_id === id && t.seat && t.status !== 'cancelled')
            .map((t) => `${t.seat!.row}${t.seat!.number}`)
    }, [tickets, id])

    // Build seats display
    const seats: SeatDisplay[] = useMemo(() => {
        return room && Array.isArray(room.seats)
            ? room.seats.map((seat) => {
                const seatKey = `${seat.row}${seat.number}`
                const isSold = soldSeatIds.includes(seatKey)
                const isSelected = selectedSeats.some(s => s.id === seat.id)
                const isDisabled = !seat.isActive

                return {
                    id: seat.id,
                    row: seat.row,
                    number: seat.number,
                    status: isSold ? 'sold' : isDisabled ? 'disabled' : isSelected ? 'selected' : 'available',
                }
            })
            : []
    }, [room, soldSeatIds, selectedSeats])

    // Group seats by row
    const seatsByRow = useMemo(() => {
        const rows: Record<string, SeatDisplay[]> = {}
        seats.forEach((seat) => {
            if (!rows[seat.row]) rows[seat.row] = []
            rows[seat.row].push(seat)
        })
        return rows
    }, [seats])

    // Handlers
    const handleQuantityChange = (typeId: string, delta: number) => {
        const currentQty = ticketQuantities[typeId] || 0
        const newQty = Math.max(0, currentQty + delta)

        // Calculate potential total
        const otherQty = totalQuantity - currentQty
        const newTotal = otherQty + newQty

        // Check user limit
        // Retrieve max from event or default 10
        const maxPerUser = event?.max_tickets_per_user || 10
        const currentLimit = remainingLimit !== null ? remainingLimit : maxPerUser

        if (newTotal > currentLimit) {
            toast.warning(`Bạn chỉ có thể mua thêm ${currentLimit} vé`)
            return
        }

        // Check stock limit for this type
        const type = event?.ticket_types?.find(t => t.id === typeId)
        if (type) {
            const remainingStock = type.quantity_total - type.quantity_sold
            if (newQty > remainingStock) {
                toast.warning(`Chỉ còn lại ${remainingStock} vé loại này`)
                return
            }
        }

        setTicketQuantities(prev => ({ ...prev, [typeId]: newQty }))
    }

    const handleSeatClick = (seat: SeatDisplay) => {
        if (seat.status === 'sold' || seat.status === 'disabled') return

        const isSelected = selectedSeats.some(s => s.id === seat.id)

        if (isSelected) {
            setSelectedSeats(prev => prev.filter(s => s.id !== seat.id))
        } else {
            // Check if we need more seats based on ticket quantity
            if (selectedSeats.length >= totalQuantity) {
                if (totalQuantity === 0) {
                    toast.info('Vui lòng chọn số lượng vé trước')
                } else {
                    toast.warning('Bạn đã chọn đủ số ghế theo số lượng vé')
                }
                return
            }
            setSelectedSeats(prev => [...prev, { ...seat, status: 'selected' }])
        }
    }

    const handlePurchase = () => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để mua vé!')
            navigate('/login')
            return
        }

        if (totalQuantity === 0) {
            toast.error('Vui lòng chọn ít nhất 1 vé')
            return
        }

        if (room && selectedSeats.length !== totalQuantity) {
            toast.error(`Vui lòng chọn đủ ${totalQuantity} ghế (đã chọn ${selectedSeats.length})`)
            return
        }

        setIsConfirmModalOpen(true)
    }

    const confirmPurchase = async () => {
        if (!event || !user) return

        setIsPurchasing(true)
        try {
            // Prepare ticket items
            const ticket_items = Object.entries(ticketQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([typeId, qty]) => ({
                    ticket_type_id: typeId,
                    quantity: qty
                }))

            // Prepare seat IDs
            const seat_ids = selectedSeats.map(s => s.id)

            // API Call
            const response = await api.post('/orders', {
                ticket_items,
                seat_ids
            })

            if (response.data.success) {
                // Update local store (simulated sync)
                const newTickets = response.data.data.tickets
                newTickets.forEach((t: any) => {
                    addTicket({
                        id: t.id,
                        ticket_code: t.ticket_code,
                        qr_code: t.qr_code,
                        event_id: event.id,
                        event_title: event.title,
                        event_date: event.start_time || '',
                        event_location: event.location || '',
                        price: t.price_at_purchase,
                        buyer_id: user.id,
                        buyer_name: user.full_name,
                        buyer_email: user.email,
                        purchase_date: new Date().toISOString(),
                        status: 'valid',
                        seat: room && seat_ids.length > 0 ? {
                            id: seat_ids[0], // simplified mapping for store
                            room: room.name,
                            row: 'X', // would need real mapping
                            number: 0
                        } : undefined
                    })
                })

                toast.success('Mua vé thành công!')
                navigate('/wallet')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi mua vé')
        } finally {
            setIsPurchasing(false)
            setIsConfirmModalOpen(false)
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="aspect-video rounded-2xl" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-24" />
                    </div>
                    <div>
                        <Skeleton className="h-64 rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold mb-4">Không tìm thấy sự kiện</h1>
                <Link to="/events"><Button>Quay lại danh sách</Button></Link>
            </div>
        )
    }

    const availableSeats = seats.filter((s) => s.status === 'available').length
    const totalSeats = room?.seats.length || 0

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
            <Link to="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="size-4" />
                Quay lại danh sách
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Event Info & Seats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Banner & Info */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="aspect-video rounded-2xl overflow-hidden bg-muted mb-6">
                            <img
                                src={event.banner_image || '/images/banner.png'}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-3xl font-bold">{event.title}</h1>
                            {event.is_hot && <Badge variant="destructive">HOT</Badge>}
                        </div>
                        <div className="flex gap-4 text-muted-foreground mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="size-4" />
                                <span>{formatDate(event.start_time || '')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="size-4" />
                                <span>{event.location}</span>
                            </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                    </motion.div>

                    {/* Seat Map */}
                    {room && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Armchair className="size-5" />
                                            <span>Sơ đồ ghế: {room.name}</span>
                                        </div>
                                        <Badge variant="outline">
                                            {selectedSeats.length}/{totalQuantity} ghế đã chọn
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {/* Legend */}
                                    <div className="flex gap-4 justify-center text-sm flex-wrap mb-8">
                                        <div className="flex items-center gap-2">
                                            <div className="size-6 bg-muted rounded border-2 border-border" /> <span>Trống</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="size-6 bg-primary rounded" /> <span>Đang chọn</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="size-6 bg-muted-foreground/30 rounded" /> <span>Đã bán</span>
                                        </div>
                                    </div>

                                    {/* Screen */}
                                    <div className="w-full py-2 bg-gradient-to-b from-primary/10 to-transparent text-center text-xs text-muted-foreground uppercase tracking-widest mb-8">
                                        Màn hình
                                    </div>

                                    {/* Seats */}
                                    <div className="overflow-x-auto">
                                        <div className="min-w-max mx-auto px-4">
                                            {Object.entries(seatsByRow).map(([row, rowSeats]) => (
                                                <div key={row} className="flex items-center gap-2 mb-2 justify-center">
                                                    <span className="w-6 text-center text-sm font-medium text-muted-foreground">{row}</span>
                                                    <div className="flex gap-1">
                                                        {rowSeats.map((seat) => {
                                                            const isSelected = selectedSeats.some(s => s.id === seat.id)
                                                            const isSold = seat.status === 'sold'
                                                            const isDisabled = seat.status === 'disabled'
                                                            return (
                                                                <button
                                                                    key={seat.id}
                                                                    onClick={() => handleSeatClick(seat)}
                                                                    disabled={isSold || isDisabled}
                                                                    className={`size-8 rounded-t-lg transition-all text-xs font-medium flex items-center justify-center
                                                                        ${isDisabled ? 'bg-red-500/10 text-red-500 cursor-not-allowed' :
                                                                            isSold ? 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed' :
                                                                                isSelected ? 'bg-primary text-primary-foreground transform -translate-y-1' :
                                                                                    'bg-muted hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary'
                                                                        }`}
                                                                >
                                                                    {seat.number}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Ticket Selection */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-4">
                        <Card className="border-2 border-primary/10 shadow-lg">
                            <CardHeader>
                                <CardTitle>Chọn loại vé</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Ticket Types List */}
                                {event.ticket_types?.map((type) => (
                                    <div key={type.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                                        <div>
                                            <p className="font-medium">{type.name}</p>
                                            <p className="text-primary font-bold">{formatCurrency(type.price)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Còn: {type.quantity_total - type.quantity_sold}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-8"
                                                onClick={() => handleQuantityChange(type.id, -1)}
                                                disabled={!ticketQuantities[type.id]}
                                            >
                                                <Minus className="size-3" />
                                            </Button>
                                            <span className="w-4 text-center font-medium">
                                                {ticketQuantities[type.id] || 0}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-8"
                                                onClick={() => handleQuantityChange(type.id, 1)}
                                                disabled={
                                                    (type.quantity_total - type.quantity_sold) <= (ticketQuantities[type.id] || 0) ||
                                                    (remainingLimit !== null && totalQuantity >= remainingLimit)
                                                }
                                            >
                                                <Plus className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-4 border-t space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Số lượng vé</span>
                                        <span className="font-medium">{totalQuantity}</span>
                                    </div>
                                    {room && (
                                        <div className="flex justify-between text-sm">
                                            <span>Ghế đã chọn</span>
                                            <span className={`font-medium ${selectedSeats.length === totalQuantity ? 'text-green-600' : 'text-orange-500'}`}>
                                                {selectedSeats.length}/{totalQuantity}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold pt-2">
                                        <span>Tổng cộng</span>
                                        <span className="text-primary">{formatCurrency(totalPrice)}</span>
                                    </div>
                                </div>

                                {remainingLimit !== null && (
                                    <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded text-sm">
                                        <AlertCircle className="size-4" />
                                        <span>Bạn còn có thể mua: <strong>{remainingLimit - totalQuantity}</strong> vé</span>
                                    </div>
                                )}

                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handlePurchase}
                                    disabled={totalQuantity === 0 || (!!room && selectedSeats.length !== totalQuantity)}
                                >
                                    <Ticket className="size-4 mr-2" />
                                    Mua vé ngay
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Xác nhận đơn hàng"
                description="Vui lòng kiểm tra lại thông tin vé"
            >
                <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Sự kiện:</span>
                            <span className="font-medium text-right">{event.title}</span>
                        </div>
                        <div className="pt-2 border-t">
                            <p className="text-sm font-medium mb-2">Chi tiết vé:</p>
                            {Object.entries(ticketQuantities)
                                .filter(([_, qty]) => qty > 0)
                                .map(([typeId, qty]) => {
                                    const type = event.ticket_types?.find(t => t.id === typeId)
                                    return (
                                        <div key={typeId} className="flex justify-between text-sm py-1">
                                            <span>{type?.name} (x{qty})</span>
                                            <span>{formatCurrency((type?.price || 0) * qty)}</span>
                                        </div>
                                    )
                                })}
                        </div>
                        {selectedSeats.length > 0 && (
                            <div className="pt-2 border-t">
                                <p className="text-sm font-medium mb-2">Chỗ ngồi:</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSeats.map(s => (
                                        <Badge key={s.id} variant="secondary">
                                            {s.row}{s.number}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="pt-2 border-t flex justify-between font-bold text-lg">
                            <span>Thành tiền:</span>
                            <span className="text-primary">{formatCurrency(totalPrice)}</span>
                        </div>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Hủy</Button>
                    <Button onClick={confirmPurchase} disabled={isPurchasing}>
                        {isPurchasing ? <Loader2 className="animate-spin mr-2" /> : null}
                        Thanh toán
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
