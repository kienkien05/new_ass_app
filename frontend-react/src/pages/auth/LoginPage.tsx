import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Ticket, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import type { AuthResponse } from '@/types'

type AuthMode = 'login' | 'register'

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>('login')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const navigate = useNavigate()
    const { login } = useAuthStore()

    const validate = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.email) {
            newErrors.email = 'Email là bắt buộc'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ'
        }

        if (!formData.password) {
            newErrors.password = 'Mật khẩu là bắt buộc'
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
        }

        if (mode === 'register') {
            if (!formData.full_name) {
                newErrors.full_name = 'Họ tên là bắt buộc'
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setLoading(true)
        try {
            let response

            if (mode === 'login') {
                response = await authService.login({
                    email: formData.email,
                    password: formData.password,
                })
            } else {
                response = await authService.register({
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                })
            }

            // Check if OTP verification is required
            if ('requireOTP' in response && response.requireOTP) {
                toast.success('message' in response ? response.message : 'Mã OTP đã được gửi đến email của bạn')
                navigate('/verify-otp', {
                    state: {
                        email: formData.email,
                        type: mode
                    }
                })
                return
            }

            // Direct login (fallback for backward compatibility)
            toast.success(mode === 'login' ? 'Đăng nhập thành công!' : 'Tạo tài khoản thành công!')

            // Cast to AuthResponse type for login
            const authResponse = response as AuthResponse
            login(authResponse)

            // Redirect based on role
            if (authResponse.role === 'admin') {
                navigate('/admin')
            } else {
                navigate('/')
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } }
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Panel - Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md space-y-8"
                >
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 justify-center">
                        <img src="/images/logo.png" alt="EViENT" className="size-10 rounded-xl shadow-lg shadow-primary/25" />
                        <span className="text-2xl font-bold">EViENT</span>
                    </Link>

                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {mode === 'login'
                                ? 'Đăng nhập để khám phá các sự kiện tuyệt vời'
                                : 'Bắt đầu hành trình trải nghiệm của bạn'}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-border">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${mode === 'login'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Đăng nhập
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${mode === 'register'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Đăng ký
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Họ và tên</label>
                                <Input
                                    placeholder="Nguyễn Văn A"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    error={errors.full_name}
                                    icon={<User className="size-5" />}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="email@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                error={errors.email}
                                icon={<Mail className="size-5" />}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mật khẩu</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Nhập mật khẩu"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    error={errors.password}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                        </div>

                        {mode === 'register' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Xác nhận mật khẩu</label>
                                <Input
                                    type="password"
                                    placeholder="Nhập lại mật khẩu"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    error={errors.confirmPassword}
                                    icon={<Lock className="size-5" />}
                                />
                            </div>
                        )}

                        {mode === 'login' && (
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded border-border" />
                                    <span className="text-sm text-muted-foreground">Ghi nhớ đăng nhập</span>
                                </label>
                                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                                    Quên mật khẩu?
                                </Link>
                            </div>
                        )}

                        <Button type="submit" className="w-full" loading={loading}>
                            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                        </Button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground">
                        {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                        <button
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            className="text-primary font-medium hover:underline"
                        >
                            {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                        </button>
                    </p>
                </motion.div>
            </div>

            {/* Right Panel - Decorative (hidden on mobile) */}
            <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary to-indigo-600 items-center justify-center p-12">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="relative text-center text-white">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="size-24 mx-auto mb-8 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <Ticket className="size-12 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Khám phá sự kiện</h2>
                        <p className="text-white/80 max-w-md">
                            Tham gia hàng ngàn sự kiện hấp dẫn. Mua vé dễ dàng, trải nghiệm tuyệt vời.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
