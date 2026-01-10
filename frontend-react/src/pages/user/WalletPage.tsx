import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, MapPin, QrCode, AlertCircle, Copy, CheckCircle, Ticket as TicketIcon, Armchair } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'

interface UserTicket {
    id: string
    ticket_code: string
    qr_code?: string
    status: 'valid' | 'used' | 'cancelled'
    price_at_purchase: number
    created_at: string
    event: {
        id: string
        title: string
        start_time: string
        location: string
    }
    ticket_type: {
        id: string
        name: string
    }
    seat?: {
        room: string
        row: string
        number: number
    }
}

export default function WalletPage() {
    const [isQRModalOpen, setIsQRModalOpen] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null)
    const [copied, setCopied] = useState(false)

    // Get current user for cache key
    const { user } = useAuthStore()

    // Fetch tickets from API - include user ID in queryKey for per-user caching
    const { data, isLoading } = useQuery<{ success: boolean; data: UserTicket[] }>({
        queryKey: ['myTickets', user?.id],
        queryFn: async () => {
            const response = await api.get('/users/tickets')
            return response.data
        },
        enabled: !!user?.id
    })

    const userTickets = data?.data || []

    const openQRModal = (ticket: UserTicket) => {
        setSelectedTicket(ticket)
        setIsQRModalOpen(true)
    }

    const copyTicketCode = () => {
        if (selectedTicket) {
            navigator.clipboard.writeText(selectedTicket.ticket_code)
            setCopied(true)
            toast.success('Đã sao chép mã vé!')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const getQRCodeUrl = (ticket: UserTicket) => {
        if (ticket.qr_code) return ticket.qr_code
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.ticket_code)}`
    }

    // Group tickets by status
    const validTickets = userTickets.filter((t) => t.status === 'valid')
    const usedTickets = userTickets.filter((t) => t.status === 'used')

    const stats = {
        total: userTickets.length,
        valid: validTickets.length,
        used: usedTickets.length,
    }

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Skeleton className="h-10 w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Vé của tôi</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý vé các sự kiện bạn đã đăng ký tham gia
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardContent className="pt-4 text-center">
                        <TicketIcon className="size-6 mx-auto text-primary mb-2" />
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Tổng vé</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 text-center">
                        <TicketIcon className="size-6 mx-auto text-emerald-600 mb-2" />
                        <p className="text-2xl font-bold">{stats.valid}</p>
                        <p className="text-xs text-muted-foreground">Còn hiệu lực</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 text-center">
                        <TicketIcon className="size-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-2xl font-bold">{stats.used}</p>
                        <p className="text-xs text-muted-foreground">Đã sử dụng</p>
                    </CardContent>
                </Card>
            </div>

            {/* Valid Tickets */}
            {validTickets.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        Sự kiện sắp tới
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {validTickets.map((ticket, index) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg line-clamp-2 mb-2">
                                                        {ticket.event.title}
                                                    </h3>
                                                    <div className="space-y-1 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="size-4" />
                                                            <span>{formatDate(ticket.event.start_time)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="size-4" />
                                                            <span className="line-clamp-1">{ticket.event.location}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant="success">Còn hiệu lực</Badge>
                                            </div>

                                            {ticket.seat && (
                                                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg mb-3">
                                                    <Armchair className="size-5 text-primary" />
                                                    <div>
                                                        <p className="text-sm font-medium">Chỗ ngồi của bạn</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {ticket.seat.room} • Hàng {ticket.seat.row} • Ghế {ticket.seat.number}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Mã vé</p>
                                                    <p className="font-mono font-bold">{ticket.ticket_code}</p>
                                                </div>
                                                <Button size="sm" onClick={() => openQRModal(ticket)}>
                                                    <QrCode className="size-4 mr-2" />
                                                    Xem QR
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Used Tickets */}
            {usedTickets.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-muted-foreground" />
                        Sự kiện đã tham gia
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {usedTickets.map((ticket, index) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="opacity-70">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-medium line-clamp-1 mb-1">
                                                    {ticket.event.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatDate(ticket.event.start_time)}
                                                </p>
                                            </div>
                                            <Badge variant="secondary">Đã sử dụng</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {userTickets.length === 0 && (
                <div className="text-center py-16">
                    <AlertCircle className="size-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Chưa có vé nào</h2>
                    <p className="text-muted-foreground mb-6">
                        Bạn chưa mua vé sự kiện nào. Hãy khám phá các sự kiện hấp dẫn!
                    </p>
                    <Link to="/events">
                        <Button>Khám phá sự kiện</Button>
                    </Link>
                </div>
            )}

            {/* QR Code Modal */}
            <Modal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                title="Mã vé điện tử"
                description={selectedTicket?.event.title}
            >
                {selectedTicket && (
                    <div className="text-center space-y-6">
                        <div className="bg-white p-6 rounded-2xl inline-block mx-auto">
                            <img
                                src={getQRCodeUrl(selectedTicket)}
                                alt="QR Code"
                                className="w-48 h-48 mx-auto"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Mã vé</p>
                                <p className="font-mono font-bold text-lg tracking-wider">
                                    {selectedTicket.ticket_code}
                                </p>
                            </div>

                            {selectedTicket.seat && (
                                <div className="p-4 bg-primary/10 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Chỗ ngồi</p>
                                    <p className="font-bold">
                                        {selectedTicket.seat.room} • Hàng {selectedTicket.seat.row} • Ghế {selectedTicket.seat.number}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-muted-foreground">Giá vé</p>
                                    <p className="font-medium text-primary">{formatCurrency(selectedTicket.price_at_purchase)}</p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-muted-foreground">Ngày mua</p>
                                    <p className="font-medium">{formatDate(selectedTicket.created_at)}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="size-4" />
                                <span>{formatDate(selectedTicket.event.start_time)}</span>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Xuất trình mã QR này tại cổng vào để được kiểm tra
                        </p>
                    </div>
                )}
                <ModalFooter>
                    <Button variant="outline" onClick={copyTicketCode}>
                        {copied ? (
                            <>
                                <CheckCircle className="size-4 mr-2" />
                                Đã sao chép
                            </>
                        ) : (
                            <>
                                <Copy className="size-4 mr-2" />
                                Sao chép mã
                            </>
                        )}
                    </Button>
                    <Button onClick={() => setIsQRModalOpen(false)}>
                        Đóng
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
