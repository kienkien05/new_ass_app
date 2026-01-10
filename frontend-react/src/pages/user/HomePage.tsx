import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, MapPin, Calendar, ArrowRight } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SkeletonEventCard } from '@/components/ui/skeleton'
import { eventService } from '@/services/eventService'
import { bannerService, type Banner } from '@/services/bannerService'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Event } from '@/types'

// Helper to get image URL
const getImageUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http') || path.startsWith('https')) return path
    return `${(import.meta as any).env.VITE_API_URL || ''}${path.startsWith('/') ? path : `/${path}`}`
}

// Banner item type - can be static or event-based
interface BannerItem {
    type: 'static' | 'event'
    image: string
    title: string
    subtitle?: string
    link: string
    event?: Event
}

// Banner Carousel Component
function BannerCarousel({ events, adminBanners }: { events: Event[], adminBanners: Banner[] }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)

    // Create banner items
    const bannerItems: BannerItem[] = []

    // 1. Add Admin Banners first
    if (adminBanners && adminBanners.length > 0) {
        adminBanners.forEach(b => {
            bannerItems.push({
                type: 'static',
                image: getImageUrl(b.image_url),
                title: b.title,
                subtitle: '', // Admin banners currently don't have subtitle
                link: b.link_url || '#',
            })
        })
    }

    // 2. Add Event Banners (limit total to maybe 5 or just append all passed events)
    // Using slice to limit potential visual clutter if too many
    // 2. Event Banners are no longer automatically added. 
    // Admins must explicitly create a banner for an event if they want it shown in the carousel.


    // Auto-slide every 5 seconds
    useEffect(() => {
        if (bannerItems.length <= 1) return
        const timer = setInterval(() => {
            setDirection(1)
            setCurrentIndex((prev) => (prev + 1) % bannerItems.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [bannerItems.length])

    const goToPrevious = () => {
        setDirection(-1)
        setCurrentIndex((prev) => (prev - 1 + bannerItems.length) % bannerItems.length)
    }

    const goToNext = () => {
        setDirection(1)
        setCurrentIndex((prev) => (prev + 1) % bannerItems.length)
    }

    const goToSlide = (index: number) => {
        setDirection(index > currentIndex ? 1 : -1)
        setCurrentIndex(index)
    }

    if (bannerItems.length === 0) return null

    const currentBanner = bannerItems[currentIndex]

    const variants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (dir: number) => ({
            x: dir < 0 ? 1000 : -1000,
            opacity: 0
        })
    }

    return (
        <div className="relative w-full aspect-[21/9] md:aspect-[21/8] rounded-2xl overflow-hidden shadow-xl group mb-10">
            {/* Background Image with Overlay */}
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <Link to={currentBanner.link}>
                        <img
                            src={currentBanner.image}
                            alt={currentBanner.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/banner.png'
                            }}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {/* Content - Bottom Left */}
                        <div className="absolute inset-0 flex flex-col items-start justify-end px-6 md:px-12 pb-16 md:pb-20 text-white">
                            <div className="max-w-xl">
                                {currentBanner.event?.is_hot && (
                                    <Badge variant="destructive" className="mb-3">
                                        🔥 Hot Event
                                    </Badge>
                                )}
                                <h2 className="text-2xl md:text-4xl font-bold mb-2 line-clamp-2">
                                    {currentBanner.title}
                                </h2>
                                {currentBanner.subtitle && (
                                    <p className="text-sm md:text-base text-white/80 mb-4 line-clamp-2">
                                        {currentBanner.subtitle}
                                    </p>
                                )}
                                {currentBanner.event?.start_time && (
                                    <div className="flex items-center gap-2 text-sm md:text-base text-white/80 mb-4">
                                        <Calendar className="size-4" />
                                        <span>{formatDate(currentBanner.event.start_time)}</span>
                                    </div>
                                )}
                                <Button className="bg-white text-black hover:bg-white/90">
                                    {currentBanner.type === 'static' ? 'Khám phá ngay' : 'Xem chi tiết'}
                                    <ArrowRight className="ml-2 size-4" />
                                </Button>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {bannerItems.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronLeft className="size-6" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ChevronRight className="size-6" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {bannerItems.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {bannerItems.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2 rounded-full transition-all ${index === currentIndex
                                ? 'w-8 bg-white'
                                : 'w-2 bg-white/50 hover:bg-white/80'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// Event Card Component
function EventCard({ event, index }: { event: Event; index: number }) {
    const minPrice = event.ticket_types?.reduce(
        (min, tt) => (tt.price < min ? tt.price : min),
        Infinity
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-72 snap-start"
        >
            <Link to={`/events/${event.id}`} className="block group">
                <div className="rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg">
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden">
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
                                    <Calendar className="size-4" />
                                    <span>{formatDate(event.start_time, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                            )}
                            {event.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-4" />
                                    <span className="truncate">{event.location}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <p className="text-xs text-muted-foreground">Từ</p>
                                <p className="font-bold text-primary">
                                    {minPrice !== undefined && minPrice !== Infinity ? formatCurrency(minPrice) : 'Miễn phí'}
                                </p>
                            </div>
                            <Button size="sm" variant="secondary" className="group-hover:bg-primary group-hover:text-white transition-colors">
                                Xem chi tiết
                            </Button>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}

export default function HomePage() {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    const { data: featuredEvents, isLoading } = useQuery({
        queryKey: ['events', 'featured'],
        queryFn: eventService.getFeaturedEvents,
    })

    const { data: adminBanners } = useQuery({
        queryKey: ['banners', 'home'],
        queryFn: async () => {
            return await bannerService.getPublicBanners()
        }
    })

    // Get events for banner carousel (hot events or first 5)
    // Only use events if we really want to mix them, currently logic is mixing both.
    const bannerEvents = featuredEvents?.filter((e: Event) => e.is_hot).slice(0, 5) ||
        featuredEvents?.slice(0, 5) || []

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            })
        }
    }

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
        }
    }

    return (
        <div className="min-h-screen">
            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                {/* Banner Carousel */}
                <BannerCarousel
                    events={bannerEvents}
                    adminBanners={adminBanners || []}
                />

                {/* About Us Section */}
                <section className="mt-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            Về Chúng Tôi
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            EViENT - Nền tảng đặt vé sự kiện hàng đầu Việt Nam
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20"
                        >
                            <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                                <Calendar className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Đa Dạng Sự Kiện</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Từ concert âm nhạc, hội thảo công nghệ đến các sự kiện ẩm thực -
                                chúng tôi mang đến những trải nghiệm đa dạng và phong phú nhất.
                            </p>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-8 border border-green-500/20"
                        >
                            <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Thanh Toán An Toàn</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Hệ thống thanh toán được bảo mật tối đa, hỗ trợ nhiều phương thức
                                thanh toán tiện lợi cho người dùng Việt Nam.
                            </p>
                        </motion.div>

                        {/* Card 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl p-8 border border-purple-500/20"
                        >
                            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                                <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Vé Điện Tử Tiện Lợi</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Nhận vé điện tử với mã QR ngay lập tức. Check-in nhanh chóng
                                tại sự kiện chỉ bằng một lần quét.
                            </p>
                        </motion.div>
                    </div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="flex justify-center mt-12"
                    >
                        <Link to="/events">
                            <Button size="lg" className="gap-2">
                                Khám phá sự kiện
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                    </motion.div>
                </section>
            </div>
        </div>
    )
}
