import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    Calendar,
    Users,
    Ticket,
    Image,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Armchair,
    QrCode,
    BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const sidebarLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/events', icon: Calendar, label: 'Sự kiện' },
    { to: '/admin/users', icon: Users, label: 'Người dùng' },
    { to: '/admin/tickets', icon: Ticket, label: 'Loại vé' },
    { to: '/admin/orders', icon: Ticket, label: 'Vé đã bán' },
    { to: '/admin/rooms', icon: Armchair, label: 'Phòng chiếu' },
    { to: '/admin/banners', icon: Image, label: 'Banner' },
    { to: '/admin/scanner', icon: QrCode, label: 'Quét QR' },
    { to: '/admin/reports', icon: BarChart3, label: 'Báo cáo' },
    { to: '/admin/settings', icon: Settings, label: 'Cài đặt' },
]

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-border">
                        <Link to="/admin" className="flex items-center gap-2">
                            <img src="/images/logo.png" alt="EViENT" className="size-8 rounded-lg" />
                            <span className="font-bold">EViENT Admin</span>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="size-5" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {sidebarLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                    )
                                }
                            >
                                <link.icon className="size-5" />
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                    {user?.full_name?.charAt(0) || 'A'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.full_name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link to="/" className="flex-1">
                                <Button variant="outline" size="sm" className="w-full">
                                    <ChevronRight className="size-4 mr-1" />
                                    Xem trang
                                </Button>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={handleLogout}>
                                <LogOut className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Top Bar */}
                <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center justify-between h-full px-4 lg:px-8">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="size-5" />
                        </Button>
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground hidden md:block">
                                Xin chào, <span className="font-medium text-foreground">{user?.full_name}</span>
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
