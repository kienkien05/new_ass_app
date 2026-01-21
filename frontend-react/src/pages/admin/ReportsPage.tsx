import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart3, Download, TrendingUp, Ticket, DollarSign, Calendar, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/services/api'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'

interface RevenueData {
    summary: {
        total_revenue: number
        total_tickets: number
        total_orders: number
        period_start: string
        period_end: string
    }
    time_series: Array<{
        date: string
        revenue: number
        tickets: number
        orders: number
    }>
    by_event: Array<{
        id: string
        title: string
        tickets: number
        revenue: number
    }>
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F', '#FFBB28', '#FF8042']

export default function ReportsPage() {
    const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day')
    const [startDate, setStartDate] = useState(() => {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        return date.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

    const { data, isLoading, error } = useQuery<{ success: boolean; data: RevenueData }>({
        queryKey: ['revenue', startDate, endDate, groupBy],
        queryFn: async () => {
            const response = await api.get('/admin/reports/revenue', {
                params: { start_date: startDate, end_date: endDate, group_by: groupBy }
            })
            return response.data
        }
    })

    const revenueData = data?.data

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value)
    }

    const formatShortCurrency = (value: number) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}K`
        }
        return value.toString()
    }

    const handleExport = async () => {
        try {
            const response = await api.get('/admin/reports/revenue/export', {
                params: { start_date: startDate, end_date: endDate },
                responseType: 'blob'
            })

            // Download file
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `revenue_report_${startDate}_${endDate}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('Đã xuất file Excel thành công!')
        } catch (error) {
            toast.error('Không thể xuất file. Vui lòng thử lại.')
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-destructive">Có lỗi xảy ra khi tải dữ liệu</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Báo Cáo Doanh Thu</h1>
                    <p className="text-muted-foreground">Thống kê doanh thu theo thời gian và sự kiện</p>
                </div>
                <Button onClick={handleExport} className="gap-2">
                    <Download className="w-4 h-4" />
                    Xuất Excel
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Bộ lọc:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground">Từ:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-1.5 border border-input rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none dark:[color-scheme:dark]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground">Đến:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-1.5 border border-input rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none dark:[color-scheme:dark]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-muted-foreground">Nhóm theo:</label>
                            <select
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
                                className="px-3 py-1.5 border border-input rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none dark:[color-scheme:dark]"
                            >
                                <option value="day">Ngày</option>
                                <option value="week">Tuần</option>
                                <option value="month">Tháng</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(revenueData?.summary.total_revenue || 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-500/10 rounded-xl">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Tổng số vé</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {revenueData?.summary.total_tickets || 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <Ticket className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {revenueData?.summary.total_orders || 0}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-500/10 rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Line Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Doanh thu theo thời gian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenueData?.time_series && revenueData.time_series.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={revenueData.time_series}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        className="text-xs"
                                        tick={{ fill: 'currentColor' }}
                                    />
                                    <YAxis
                                        tickFormatter={formatShortCurrency}
                                        className="text-xs"
                                        tick={{ fill: 'currentColor' }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(Number(value) || 0), 'Doanh thu']}
                                        labelFormatter={(label) => `Ngày: ${label}`}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#8884d8"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                Không có dữ liệu trong khoảng thời gian này
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Doanh thu theo sự kiện
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenueData?.by_event && revenueData.by_event.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={revenueData.by_event}
                                        dataKey="revenue"
                                        nameKey="title"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) =>
                                            `${(name || '').substring(0, 15)}${(name || '').length > 15 ? '...' : ''} (${((percent || 0) * 100).toFixed(0)}%)`
                                        }
                                        labelLine={false}
                                    >
                                        {revenueData.by_event.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatCurrency(Number(value) || 0)}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                Không có dữ liệu
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Event Details Table */}
            {revenueData?.by_event && revenueData.by_event.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Chi tiết theo sự kiện</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium">Sự kiện</th>
                                        <th className="text-right py-3 px-4 font-medium">Số vé</th>
                                        <th className="text-right py-3 px-4 font-medium">Doanh thu</th>
                                        <th className="text-right py-3 px-4 font-medium">Tỷ lệ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {revenueData.by_event.map((event, index) => {
                                        const percentage = revenueData.summary.total_revenue > 0
                                            ? ((event.revenue / revenueData.summary.total_revenue) * 100).toFixed(1)
                                            : '0'
                                        return (
                                            <tr key={event.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                        />
                                                        {event.title}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right">{event.tickets}</td>
                                                <td className="py-3 px-4 text-right font-medium">
                                                    {formatCurrency(event.revenue)}
                                                </td>
                                                <td className="py-3 px-4 text-right text-muted-foreground">
                                                    {percentage}%
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
