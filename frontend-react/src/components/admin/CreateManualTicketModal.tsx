import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { ticketService } from '@/services/ticketService'
import api from '@/services/api'

interface CreateManualTicketModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

interface Event {
    id: string
    title: string
}

interface TicketType {
    id: string
    name: string
    price: number
    eventId: string
}

interface Seat {
    id: string
    row: string
    number: number
    isActive: boolean
    roomId: string
}

export default function CreateManualTicketModal({ isOpen, onClose, onSuccess }: CreateManualTicketModalProps) {
    const [email, setEmail] = useState('')
    const [selectedEventId, setSelectedEventId] = useState('')
    const [selectedTicketTypeId, setSelectedTicketTypeId] = useState('')
    const [selectedSeatId, setSelectedSeatId] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch events
    const { data: eventsData } = useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const response = await api.get('/events')
            return response.data.data
        },
        enabled: isOpen
    })

    // Fetch ticket types for selected event
    const { data: ticketTypes = [] } = useQuery<TicketType[]>({
        queryKey: ['ticketTypes', selectedEventId],
        queryFn: async () => {
            if (!selectedEventId) return []
            const response = await api.get(`/ticket-types?event_id=${selectedEventId}`)
            return response.data.data
        },
        enabled: !!selectedEventId
    })

    // Fetch rooms and seats for selected event
    const { data: seats = [] } = useQuery<Seat[]>({
        queryKey: ['eventSeats', selectedEventId],
        queryFn: async () => {
            if (!selectedEventId) return []
            // Get rooms for this event, then get their seats
            const roomsResponse = await api.get('/rooms')
            const rooms = roomsResponse.data.data

            // Get event to find its room
            const eventResponse = await api.get(`/events/${selectedEventId}`)
            const event = eventResponse.data.data

            // Find room(s) for this event
            const eventRooms = rooms.filter((r: any) =>
                r.events?.some((e: any) => e.id === selectedEventId)
            )

            if (eventRooms.length === 0) return []

            // Return seats from first room
            return eventRooms[0].seats || []
        },
        enabled: !!selectedEventId
    })

    const events = eventsData || []

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setEmail('')
            setSelectedEventId('')
            setSelectedTicketTypeId('')
            setSelectedSeatId('')
        }
    }, [isOpen])

    // Reset ticket type and seat when event changes
    useEffect(() => {
        setSelectedTicketTypeId('')
        setSelectedSeatId('')
    }, [selectedEventId])

    const handleSubmit = async () => {
        if (!email || !selectedEventId || !selectedTicketTypeId) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            toast.error('Email không hợp lệ')
            return
        }

        setIsSubmitting(true)
        try {
            const data: any = {
                email,
                eventId: selectedEventId,
                ticketTypeId: selectedTicketTypeId
            }

            if (selectedSeatId) {
                data.seatId = selectedSeatId
            }

            await ticketService.createManualTicket(data)
            toast.success('Đã tạo và gửi vé thành công!')
            onSuccess()
            onClose()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể tạo vé')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Tạo vé thủ công"
            description="Tạo vé cho khách hàng đã thanh toán offline"
            size="lg"
        >
            <div className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Email người nhận <span className="text-destructive">*</span>
                    </label>
                    <Input
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Email phải đã đăng ký tài khoản trong hệ thống
                    </p>
                </div>

                {/* Event Selector */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Sự kiện <span className="text-destructive">*</span>
                    </label>
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                    >
                        <option value="">-- Chọn sự kiện --</option>
                        {events.map((event: Event) => (
                            <option key={event.id} value={event.id}>
                                {event.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Ticket Type Selector */}
                {selectedEventId && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Loại vé <span className="text-destructive">*</span>
                        </label>
                        <select
                            value={selectedTicketTypeId}
                            onChange={(e) => setSelectedTicketTypeId(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        >
                            <option value="">-- Chọn loại vé --</option>
                            {ticketTypes.map((tt) => (
                                <option key={tt.id} value={tt.id}>
                                    {tt.name} - {Number(tt.price).toLocaleString('vi-VN')} VNĐ
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Seat Selector (optional) */}
                {selectedEventId && seats.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Chỗ ngồi (tùy chọn)</label>
                        <select
                            value={selectedSeatId}
                            onChange={(e) => setSelectedSeatId(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        >
                            <option value="">-- Không chọn ghế --</option>
                            {seats
                                .filter(s => s.isActive)
                                .map((seat) => (
                                    <option key={seat.id} value={seat.id}>
                                        Hàng {seat.row}, Ghế {seat.number}
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                )}
            </div>

            <ModalFooter>
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Đang tạo...' : 'Tạo vé '}
                </Button>
            </ModalFooter>
        </Modal>
    )
}
