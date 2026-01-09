import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Filter, MapPin, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { eventService } from '@/services/eventService'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Event } from '@/types'

export default function EventsPage() {
    const [search, setSearch] = useState('')
    const [selectedLocation, setSelectedLocation] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [page, setPage] = useState(1)

    // Temp filter values for modal
    const [tempLocation, setTempLocation] = useState('')
    const [tempDate, setTempDate] = useState('')

    const { data, isLoading } = useQuery({
        queryKey: ['events', { page, search }],
        queryFn: () =>
            eventService.getEvents({
                page,
                limit: 12,
                search: search || undefined,
            }),
    })

    const events = data?.data || []
    const pagination = data?.pagination

    // Filter events client-side based on location and date
    const filteredEvents = events.filter((event: Event) => {
        // Location filter
        if (selectedLocation && event.location) {
            if (!event.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
                return false
            }
        }

        // Date filter
        if (selectedDate && event.start_time) {
            const eventDate = new Date(event.start_time).toISOString().split('T')[0]
            if (eventDate !== selectedDate) {
                return false
            }
        }

        return true
    })

    const openFilterModal = () => {
        setTempLocation(selectedLocation)
        setTempDate(selectedDate)
        setIsFilterModalOpen(true)
    }

    const applyFilters = () => {
        setSelectedLocation(tempLocation)
        setSelectedDate(tempDate)
        setIsFilterModalOpen(false)
        setPage(1)
    }

    const clearFilters = () => {
        setSelectedLocation('')
        setSelectedDate('')
        setTempLocation('')
        setTempDate('')
        setIsFilterModalOpen(false)
        setPage(1)
    }

    const hasActiveFilters = selectedLocation !== '' || selectedDate !== ''
    const activeFilterCount = (selectedLocation ? 1 : 0) + (selectedDate ? 1 : 0)

    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Khám phá sự kiện</h1>
                <p className="text-muted-foreground mt-2">
                    Tìm kiếm và tham gia các sự kiện phù hợp với bạn
                </p>
            </div>

            {/* Search and Filter Row */}
            <div className="flex gap-3 mb-6">
                {/* Filter Button */}
                <Button
                    variant="outline"
                    onClick={openFilterModal}
                    className="relative"
                >
                    <Filter className="size-4 mr-2" />
                    Bộ lọc
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-2 -right-2 size-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>

                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm sự kiện..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="pl-10"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {selectedDate && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            <Calendar className="size-3" />
                            {new Date(selectedDate).toLocaleDateString('vi-VN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                            <button
                                onClick={() => {
                                    setSelectedDate('')
                                    setPage(1)
                                }}
                                className="ml-1 p-0.5 hover:bg-muted rounded"
                            >
                                <X className="size-3" />
                            </button>
                        </Badge>
                    )}
                    {selectedLocation && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            <MapPin className="size-3" />
                            {selectedLocation}
                            <button
                                onClick={() => {
                                    setSelectedLocation('')
                                    setPage(1)
                                }}
                                className="ml-1 p-0.5 hover:bg-muted rounded"
                            >
                                <X className="size-3" />
                            </button>
                        </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                        Xóa tất cả
                    </Button>
                </div>
            )}

            {/* Results Info */}
            <p className="text-sm text-muted-foreground mb-6">
                Hiển thị {filteredEvents.length} sự kiện
                {pagination && ` trong tổng số ${pagination.total}`}
            </p>

            {/* Event Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                ) : filteredEvents.length > 0 ? (
                    filteredEvents.map((event: Event, index: number) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link to={`/events/${event.id}`} className="block group">
                                <div className="rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                                    {/* Image */}
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={event.banner_image || 'https://via.placeholder.com/400x200'}
                                            alt={event.title}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        {event.is_hot && (
                                            <Badge className="absolute top-3 left-3" variant="destructive">
                                                🔥 Hot
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 space-y-3">
                                        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                            {event.title}
                                        </h3>

                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            {event.start_time && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="size-4 flex-shrink-0" />
                                                    <span>{formatDate(event.start_time)}</span>
                                                </div>
                                            )}
                                            {event.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="size-4 flex-shrink-0" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-border">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Từ</p>
                                                <p className="font-bold text-primary">
                                                    {event.ticket_types && event.ticket_types.length > 0
                                                        ? formatCurrency(Math.min(...event.ticket_types.map((t) => t.price)))
                                                        : 'Miễn phí'}
                                                </p>
                                            </div>
                                            <Button size="sm">Mua vé</Button>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-16 text-center">
                        <Filter className="size-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Không tìm thấy sự kiện</h3>
                        <p className="text-muted-foreground mb-4">
                            Thử thay đổi từ khóa hoặc bộ lọc để tìm sự kiện phù hợp
                        </p>
                        <Button variant="outline" onClick={clearFilters}>
                            Xóa bộ lọc
                        </Button>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        Trang trước
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            const pageNum = i + 1
                            return (
                                <Button
                                    key={pageNum}
                                    variant={page === pageNum ? 'default' : 'ghost'}
                                    size="icon"
                                    onClick={() => setPage(pageNum)}
                                >
                                    {pageNum}
                                </Button>
                            )
                        })}
                    </div>
                    <Button
                        variant="outline"
                        disabled={page === pagination.pages}
                        onClick={() => setPage(page + 1)}
                    >
                        Trang sau
                    </Button>
                </div>
            )}

            {/* Filter Modal */}
            <Modal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                title="Bộ lọc sự kiện"
                description="Chọn ngày và địa điểm để lọc sự kiện"
            >
                <div className="space-y-6">
                    {/* Date Picker */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="size-4" />
                            Chọn ngày
                        </label>
                        <Input
                            type="date"
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Chọn ngày diễn ra sự kiện bạn muốn tham gia
                        </p>
                    </div>

                    {/* Location Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="size-4" />
                            Địa điểm
                        </label>
                        <Input
                            type="text"
                            placeholder="Nhập địa điểm (VD: Hà Nội, Sài Gòn...)"
                            value={tempLocation}
                            onChange={(e) => setTempLocation(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Nhập tên thành phố hoặc địa điểm bạn muốn tìm
                        </p>
                    </div>
                </div>

                <ModalFooter>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setTempLocation('')
                            setTempDate('')
                        }}
                    >
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
        </div>
    )
}
