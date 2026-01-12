import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Ticket, Calendar, MapPin, User, QrCode, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ticketService } from '@/services/ticketService'

interface UserTicket {
    id: string
    ticket_code: string
    qr_code?: string
    status: 'valid' | 'used' | 'cancelled'
    used_at?: string
    price_at_purchase: number
    created_at: string
    event: {
        id: string
        title: string
        start_time: string
        location: string
        banner_image?: string
    }
    ticket_type: {
        id: string
        name: string
    }
    seat?: {
        id: string
        room: string
        row: string
        number: number
    }
}

export default function MyTicketsPage() {
    const { data: tickets = [], isLoading } = useQuery<UserTicket[]>({
        queryKey: ['myTickets'],
        queryFn: ticketService.getMyTickets
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'valid':
                return <Badge variant="success">Còn hiệu lực</Badge>
            case 'used':
                return <Badge variant="secondary">Đã sử dụng</Badge>
            case 'cancelled':
                return <Badge variant="destructive">Đã hủy</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    if (isLoading) {
        return (
            <div className="container max-w-6xl mx-auto py-8 space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-64 rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="container max-w-6xl mx-auto py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ví vé của tôi</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý và xem tất cả vé đã mua
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">{tickets.length}</p>
                                <p className="text-xs text-muted-foreground">Tổng vé</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-emerald-600" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {tickets.filter(t => t.status === 'valid').length}
                                </p>
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
                                <p className="text-2xl font-bold">
                                    {tickets.filter(t => t.status === 'used').length}
                                </p>
                                <p className="text-xs text-muted-foreground">Đã dùng</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Ticket className="size-5 text-amber-600" />
                            <div>
                                <p className="text-lg font-bold">
                                    {formatCurrency(tickets.reduce((sum, t) => sum + (t.status !== 'cancelled' ? t.price_at_purchase : 0), 0))}
                                </p>
                                <p className="text-xs text-muted-foreground">Tổng chi tiêu</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tickets Grid */}
            {tickets.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Ticket className="size-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-lg font-medium">Chưa có vé nào</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Vé bạn mua sẽ hiển thị ở đây
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {tickets.map((ticket, index) => (
                        <motion.div
                            key={ticket.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                                <CardContent className="p-0">
                                    {/* Event Banner */}
                                    {ticket.event.banner_image && (
                                        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={ticket.event.banner_image}
                                                alt={ticket.event.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    {!ticket.event.banner_image && (
                                        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                            <Ticket className="size-12 text-primary opacity-30" />
                                        </div>
                                    )}

                                    <div className="p-6 space-y-4">
                                        {/* Event Info */}
                                        <div>
                                            <h3 className="font-bold text-lg line-clamp-1">
                                                {ticket.event.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                                <Calendar className="size-4" />
                                                <span>{formatDate(ticket.event.start_time)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <MapPin className="size-4" />
                                                <span className="line-clamp-1">{ticket.event.location}</span>
                                            </div>
                                        </div>

                                        {/* Ticket Details */}
                                        <div className="pt-4 border-t space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Mã vé:</span>
                                                <span className="font-mono font-medium">{ticket.ticket_code}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Loại vé:</span>
                                                <span className="font-medium">{ticket.ticket_type.name}</span>
                                            </div>
                                            {ticket.seat && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Chỗ ngồi:</span>
                                                    <span className="font-medium">
                                                        {ticket.seat.room} - {ticket.seat.row}{ticket.seat.number}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Giá:</span>
                                                <span className="font-bold text-primary">
                                                    {formatCurrency(ticket.price_at_purchase)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Trạng thái:</span>
                                                {getStatusBadge(ticket.status)}
                                            </div>
                                        </div>

                                        {/* QR Code */}
                                        {ticket.qr_code && ticket.status === 'valid' && (
                                            <div className="pt-4 border-t">
                                                <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                                                    <img
                                                        src={ticket.qr_code}
                                                        alt="QR Code"
                                                        className="w-32 h-32"
                                                    />
                                                </div>
                                                <p className="text-xs text-center text-muted-foreground mt-2">
                                                    Hiển thị mã này khi check-in
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
