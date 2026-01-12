import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/events', label: 'Sự kiện' },
]

import { ModeToggle } from '@/components/ui/mode-toggle'

export default function UserLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { isAuthenticated, user, logout } = useAuthStore()
    const navigate = useNavigate()



    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <img src="/images/logo.png" alt="EViENT" className="size-9 rounded-xl shadow-lg" />
                            <span className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                                EViENT
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) =>
                                        cn(
                                            'text-sm font-medium transition-colors hover:text-primary',
                                            isActive ? 'text-foreground' : 'text-muted-foreground'
                                        )
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <ModeToggle />

                            {isAuthenticated ? (
                                <div className="hidden md:flex items-center gap-2">
                                    <Link to="/wallet">
                                        <Button variant="ghost" size="sm">
                                            <Ticket className="size-4 mr-1" />
                                            Vé của tôi
                                        </Button>
                                    </Link>
                                    <Link to="/profile">
                                        <Button variant="outline" size="sm">
                                            <User className="size-4 mr-1" />
                                            {user?.full_name?.split(' ').pop()}
                                        </Button>
                                    </Link>
                                    {user?.role === 'admin' && (
                                        <Link to="/admin">
                                            <Button variant="default" size="sm">
                                                Quản trị
                                            </Button>
                                        </Link>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                                        <LogOut className="size-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Link to="/login" className="hidden md:block">
                                    <Button>Đăng nhập</Button>
                                </Link>
                            )}

                            {/* Mobile menu button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t border-border"
                        >
                            <nav className="flex flex-col p-4 gap-2">
                                {navLinks.map((link) => (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={({ isActive }) =>
                                            cn(
                                                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                                isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent'
                                            )
                                        }
                                    >
                                        {link.label}
                                    </NavLink>
                                ))}
                                {isAuthenticated ? (
                                    <>
                                        <Link to="/wallet" onClick={() => setMobileMenuOpen(false)}>
                                            <div className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent">
                                                Vé của tôi
                                            </div>
                                        </Link>
                                        <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                                            <div className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent">
                                                Hồ sơ
                                            </div>
                                        </Link>
                                        {user?.role === 'admin' && (
                                            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                                                <div className="px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10">
                                                    🛡️ Quản trị
                                                </div>
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => {
                                                handleLogout()
                                                setMobileMenuOpen(false)
                                            }}
                                            className="px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 text-left"
                                        >
                                            Đăng xuất
                                        </button>
                                    </>
                                ) : (
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                                        <Button className="w-full mt-2">Đăng nhập</Button>
                                    </Link>
                                )}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <img src="/images/logo.png" alt="EViENT" className="size-8 rounded-lg" />
                                <span className="font-bold">EViENT</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Nền tảng quản lý sự kiện và bán vé hàng đầu Việt Nam.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Sản phẩm</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link to="/events" className="hover:text-foreground transition-colors">Sự kiện</Link></li>
                                <li><Link to="/" className="hover:text-foreground transition-colors">Tính năng</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Hỗ trợ</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-foreground transition-colors">Trung tâm trợ giúp</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Liên hệ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Pháp lý</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-foreground transition-colors">Điều khoản sử dụng</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Chính sách bảo mật</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                        © 2026 EViENT. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
}
