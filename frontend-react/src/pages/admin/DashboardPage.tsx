import { motion } from 'framer-motion'
import { Users, Calendar, Ticket, DollarSign, TrendingUp, ArrowUpRight, Armchair } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUserStore } from '@/stores/userStore'
import { useEventStore } from '@/stores/eventStore'
import { useTicketStore } from '@/stores/ticketStore'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
    const { users } = useUserStore()
    const { events } = useEventStore()
    const { tickets } = useTicketStore()

    // Calculate real stats from stores
    const revenue = tickets
        .filter((t) => t.status !== 'cancelled')
        .reduce((sum, t) => sum + t.price, 0)

    const stats = [
        {
            title: 'Tổng doanh thu',
            value: formatCurrency(revenue),
            change: '+12.5%',
            trend: 'up',
            icon: DollarSign,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-500/10',
        },
        {
            title: 'Người dùng',
            value: users.length.toString(),
            change: '+8.2%',
            trend: 'up',
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Sự kiện',
            value: events.length.toString(),
            change: '+23.1%',
            trend: 'up',
            icon: Calendar,
            color: 'text-purple-600',
            bgColor: 'bg-purple-500/10',
        },
        {
            title: 'Vé đã bán',
            value: tickets.length.toString(),
            change: '+15%',
            trend: 'up',
            icon: Ticket,
            color: 'text-orange-600',
            bgColor: 'bg-orange-500/10',
        },
    ]

    // Recent orders from ticketStore
    const recentOrders = tickets.slice(0, 5).map((ticket) => ({
        id: ticket.id,
        user: ticket.buyer_name,
        event: ticket.event_title,
        amount: ticket.price,
        status: ticket.status === 'valid' ? 'paid' : ticket.status === 'used' ? 'paid' : 'cancelled',
        seat: ticket.seat,
    }))

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Tổng quan hoạt động hệ thống</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                        <div className="flex items-center gap-1 mt-2">
                                            <ArrowUpRight className="size-4 text-emerald-600" />
                                            <span className="text-sm font-medium text-emerald-600">
                                                {stat.change}
                                            </span>
                                            <span className="text-sm text-muted-foreground">vs tháng trước</span>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                        <stat.icon className={`size-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts & Recent Orders */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Revenue Chart Placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="size-5" />
                            Doanh thu theo tháng
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center bg-muted/50 rounded-xl">
                            <p className="text-muted-foreground">Biểu đồ doanh thu</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card>
                    <CardHeader>
                        <CardTitle>Vé bán gần đây</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentOrders.length > 0 ? (
                                recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{order.user}</p>
                                            <p className="text-sm text-muted-foreground truncate">{order.event}</p>
                                            {order.seat && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Armchair className="size-3 text-primary" />
                                                    <span className="text-xs text-primary">
                                                        {order.seat.row}{order.seat.number}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-medium">
                                                {formatCurrency(order.amount)}
                                            </p>
                                            <Badge
                                                variant={order.status === 'paid' ? 'success' : 'destructive'}
                                                className="mt-1"
                                            >
                                                {order.status === 'paid' ? 'Đã thanh toán' : 'Đã hủy'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-muted-foreground">
                                    <Ticket className="size-8 mx-auto mb-2 opacity-50" />
                                    <p>Chưa có vé nào được bán</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
