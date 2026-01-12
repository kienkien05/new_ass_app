import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/authService'
import { ModeToggle } from '@/components/ui/mode-toggle'

export default function ResetPasswordPage() {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!password || !confirmPassword) {
            setError('Vui lòng nhập đầy đủ thông tin')
            return
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự')
            return
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp')
            return
        }

        if (!token) {
            toast.error('Token không hợp lệ')
            return
        }

        setIsLoading(true)
        try {
            await authService.resetPassword(token, password)
            toast.success('Đặt lại mật khẩu thành công')
            navigate('/login')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative">
            <div className="absolute top-4 left-4 z-50 text-foreground">
                <ModeToggle />
            </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => navigate('/login')}
                >
                    <ArrowLeft className="size-4 mr-2" />
                    Quay lại đăng nhập
                </Button>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                    <div className="text-center mb-8">
                        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="size-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
                        <p className="text-muted-foreground mt-2">
                            Nhập mật khẩu mới của bạn bên dưới
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mật khẩu mới</label>
                            <Input
                                type="password"
                                placeholder="Nhập mật khẩu mới"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Xác nhận mật khẩu</label>
                            <Input
                                type="password"
                                placeholder="Nhập lại mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-destructive font-medium">{error}</p>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
