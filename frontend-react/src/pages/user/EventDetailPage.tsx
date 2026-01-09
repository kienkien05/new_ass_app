import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, MapPin, ArrowLeft, Armchair, Ticket, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatCurrency } from '@/lib/utils'
import { eventService } from '@/services/eventService'
import { useTicketStore } from '@/stores/ticketStore'
import { useRoomStore } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'

interface SeatDisplay {
    id: string
    row: string
    number: number
    status: 'available' | 'selected' | 'sold' | 'disabled'
}

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { tickets, addTicket } = useTicketStore()
    const { getRoomForEvent, getAllRooms, fetchRooms } = useRoomStore()

    // Fetch rooms when component mounts to ensure we have latest seat status
    useEffect(() => {
        fetchRooms()
    }, [fetchRooms])
    const { user, isAuthenticated } = useAuthStore()

    const [selectedSeat, setSelectedSeat] = useState<SeatDisplay | null>(null)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [isPurchasing, setIsPurchasing] = useState(false)

    // Fetch event from API
    const { data: event, isLoading, error } = useQuery({
        queryKey: ['event', id],
        queryFn: () => eventService.getEventById(id!),
        enabled: !!id,
    })

    // Get room for this event (try by ID first, then use first room as fallback for demo)
    const rooms = getAllRooms()
    const room = getRoomForEvent(id || '') || (rooms.length > 0 ? rooms[0] : undefined)

    // Get sold seats for this event from tickets
    const soldSeatIds = tickets
        .filter((t) => t.event_id === id && t.seat && t.status !== 'cancelled')
        .map((t) => `${t.seat!.row}${t.seat!.number}`)

    // Check if current user already has a ticket for this event
    const userHasTicket = isAuthenticated && tickets.some(
        (t) => t.event_id === id && t.buyer_id === user?.id && t.status !== 'cancelled'
    )

    // Build seats display from room data
    const seats: SeatDisplay[] = room
        ? room.seats.map((seat) => {
            const seatKey = `${seat.row}${seat.number}`
            const isSold = soldSeatIds.includes(seatKey)
            const isDisabled = !seat.isActive

            return {
                id: seat.id,
                row: seat.row,
                number: seat.number,
                status: isSold ? 'sold' : isDisabled ? 'disabled' : 'available',
            }
        })
        : []

    // Group seats by row
    const seatsByRow: Record<string, SeatDisplay[]> = {}
    seats.forEach((seat) => {
        if (!seatsByRow[seat.row]) seatsByRow[seat.row] = []
        seatsByRow[seat.row].push(seat)
    })

    const handleSeatClick = (seat: SeatDisplay) => {
        if (seat.status === 'sold' || seat.status === 'disabled') return
        if (userHasTicket) {
            toast.error('Bạn đã mua vé cho sự kiện này rồi!')
            return
        }

        if (selectedSeat?.id === seat.id) {
            setSelectedSeat(null)
        } else {
            setSelectedSeat({ ...seat, status: 'selected' })
        }
    }

    const handlePurchase = () => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để mua vé!')
            navigate('/login')
            return
        }
        if (!selectedSeat || !event) return
        setIsConfirmModalOpen(true)
    }

    const confirmPurchase = async () => {
        if (!selectedSeat || !event || !user || !room) return

        setIsPurchasing(true)
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const ticketCode = `EVT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

        addTicket({
            id: Date.now().toString(),
            ticket_code: ticketCode,
            event_id: event.id,
            event_title: event.title,
            event_date: event.start_time || '',
            event_location: event.location || '',
            price: event.ticket_types?.[0]?.price || 0,
            buyer_id: user.id,
            buyer_name: user.full_name,
            buyer_email: user.email,
            purchase_date: new Date().toISOString().split('T')[0],
            status: 'valid',
            seat: {
                id: selectedSeat.id,
                room: room.name,
                row: selectedSeat.row,
                number: selectedSeat.number,
            },
        })

        setIsPurchasing(false)
        setIsConfirmModalOpen(false)
        setSelectedSeat(null)

        toast.success('Mua vé thành công! Kiểm tra trong Vé của tôi.')
        navigate('/wallet')
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

    // Error or not found
    if (error || !event) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold mb-4">Không tìm thấy sự kiện</h1>
                <p className="text-muted-foreground mb-6">
                    Sự kiện này có thể đã bị xóa hoặc không tồn tại.
                </p>
                <Link to="/events">
                    <Button>Quay lại danh sách</Button>
                </Link>
            </div>
        )
    }

    const eventPrice = event.ticket_types?.[0]?.price || 0
    const availableSeats = seats.filter((s) => s.status === 'available').length
    const totalSeats = room?.seats.length || 0

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Back Button */}
            <Link to="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="size-4" />
                Quay lại danh sách
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Event Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="aspect-video rounded-2xl overflow-hidden bg-muted"
                    >
                        <img
                            src={event.banner_image || '/images/banner.png'}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                    </motion.div>

                    {/* Title & Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <h1 className="text-3xl font-bold">{event.title}</h1>
                            {event.is_hot && <Badge variant="destructive">HOT</Badge>}
                        </div>

                        <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                            <div className="flex items-center gap-2">
                                <Calendar className="size-5" />
                                <span>{formatDate(event.start_time || '')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="size-5" />
                                <span>{event.location}</span>
                            </div>
                        </div>

                        <p className="text-muted-foreground leading-relaxed">
                            {event.description}
                        </p>
                    </motion.div>

                    {/* Seat Selection */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Armchair className="size-5" />
                                    Chọn chỗ ngồi {room && `- ${room.name}`}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Click vào ghế để chọn vị trí của bạn • Còn {availableSeats}/{totalSeats} ghế trống
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {room ? (
                                    <>
                                        {/* Legend */}
                                        <div className="flex gap-4 justify-center text-sm flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 bg-muted rounded border-2 border-border" />
                                                <span>Trống</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 bg-primary rounded" />
                                                <span>Đang chọn</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 bg-muted-foreground/30 rounded" />
                                                <span>Đã bán</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 bg-red-500/30 rounded border-2 border-red-500/50" />
                                                <span>Không mở bán</span>
                                            </div>
                                        </div>

                                        {/* Screen */}
                                        <div className="w-full py-3 bg-gradient-to-b from-primary/20 to-transparent rounded-t-3xl text-center text-sm text-muted-foreground">
                                            Màn hình / Sân khấu
                                        </div>

                                        {/* Seat Grid */}
                                        <div className="overflow-x-auto pb-4">
                                            <div className="min-w-max mx-auto">
                                                {Object.entries(seatsByRow).map(([row, rowSeats]) => (
                                                    <div key={row} className="flex items-center gap-2 mb-2 justify-center">
                                                        <span className="w-6 text-center text-sm font-medium text-muted-foreground">{row}</span>
                                                        <div className="flex gap-1">
                                                            {rowSeats.map((seat) => {
                                                                const isSelected = selectedSeat?.id === seat.id
                                                                const isSold = seat.status === 'sold'
                                                                const isDisabled = seat.status === 'disabled'

                                                                return (
                                                                    <button
                                                                        key={seat.id}
                                                                        onClick={() => handleSeatClick(seat)}
                                                                        disabled={isSold || isDisabled || userHasTicket}
                                                                        className={`size-8 rounded flex items-center justify-center text-xs font-medium transition-all ${isDisabled
                                                                            ? 'bg-red-500/30 border-2 border-red-500/50 text-red-500/70 cursor-not-allowed'
                                                                            : isSold
                                                                                ? 'bg-muted-foreground/30 text-muted-foreground cursor-not-allowed'
                                                                                : isSelected
                                                                                    ? 'bg-primary text-primary-foreground scale-110 shadow-lg'
                                                                                    : 'bg-muted border-2 border-border hover:border-primary hover:bg-primary/10'
                                                                            }`}
                                                                    >
                                                                        {seat.number}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                        <span className="w-6 text-center text-sm font-medium text-muted-foreground">{row}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Selected Seat Info */}
                                        {selectedSeat && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-4 bg-primary/10 rounded-lg text-center"
                                            >
                                                <p className="text-sm text-muted-foreground">Bạn đã chọn</p>
                                                <p className="text-lg font-bold text-primary">
                                                    {room.name} • Hàng {selectedSeat.row} • Ghế {selectedSeat.number}
                                                </p>
                                            </motion.div>
                                        )}
                                    </>
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Armchair className="size-12 mx-auto mb-4 opacity-50" />
                                        <p>Chưa có phòng chiếu cho sự kiện này</p>
                                    </div>
                                )}

                                {userHasTicket && (
                                    <div className="p-4 bg-emerald-500/10 rounded-lg text-center">
                                        <CheckCircle className="size-6 mx-auto text-emerald-600 mb-2" />
                                        <p className="font-medium text-emerald-600">Bạn đã có vé cho sự kiện này</p>
                                        <Link to="/wallet" className="text-sm text-primary hover:underline">
                                            Xem vé của bạn →
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Sidebar - Purchase */}
                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="sticky top-24"
                    >
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Giá vé</p>
                                    <p className="text-3xl font-bold text-primary">{formatCurrency(eventPrice)}</p>
                                </div>

                                {room && (
                                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                                        <p className="text-xs text-muted-foreground">Phòng chiếu</p>
                                        <p className="font-medium">{room.name}</p>
                                    </div>
                                )}

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tổng ghế</span>
                                        <span className="font-medium">{totalSeats}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Còn trống</span>
                                        <span className="font-medium text-emerald-600">{availableSeats}</span>
                                    </div>
                                </div>

                                {selectedSeat && (
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <p className="text-xs text-muted-foreground">Ghế đã chọn</p>
                                        <p className="font-bold text-primary">
                                            Hàng {selectedSeat.row} - Ghế {selectedSeat.number}
                                        </p>
                                    </div>
                                )}

                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handlePurchase}
                                    disabled={!selectedSeat || userHasTicket || !room}
                                >
                                    <Ticket className="size-5 mr-2" />
                                    {userHasTicket
                                        ? 'Đã mua vé'
                                        : !selectedSeat
                                            ? 'Chọn ghế để mua'
                                            : 'Mua vé ngay'}
                                </Button>

                                {!isAuthenticated && (
                                    <p className="text-xs text-center text-muted-foreground">
                                        Bạn cần <Link to="/login" className="text-primary hover:underline">đăng nhập</Link> để mua vé
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Confirm Purchase Modal */}
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Xác nhận mua vé"
                description={event.title}
            >
                <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Sự kiện</span>
                            <span className="font-medium text-right">{event.title}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Ngày</span>
                            <span>{formatDate(event.start_time || '')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Địa điểm</span>
                            <span className="text-right">{event.location}</span>
                        </div>
                        {room && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Phòng</span>
                                <span className="font-medium">{room.name}</span>
                            </div>
                        )}
                        {selectedSeat && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Chỗ ngồi</span>
                                <span className="font-bold text-primary">
                                    Hàng {selectedSeat.row} • Ghế {selectedSeat.number}
                                </span>
                            </div>
                        )}
                        <div className="pt-2 border-t flex justify-between">
                            <span className="font-medium">Tổng thanh toán</span>
                            <span className="text-xl font-bold text-primary">{formatCurrency(eventPrice)}</span>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Mỗi người dùng chỉ được mua 1 vé cho mỗi sự kiện
                    </p>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)} disabled={isPurchasing}>
                        Hủy
                    </Button>
                    <Button onClick={confirmPurchase} disabled={isPurchasing}>
                        {isPurchasing ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : 'Xác nhận mua'}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
