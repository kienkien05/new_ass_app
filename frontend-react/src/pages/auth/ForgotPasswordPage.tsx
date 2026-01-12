import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { authService } from '@/services/authService'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) {
            setError('Email là bắt buộc')
            return
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Email không hợp lệ')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            await authService.forgotPassword(email)
            setIsSent(true)
            toast.success('Email đặt lại mật khẩu đã được gửi')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative">
            <div className="absolute top-4 left-4 z-50 text-foreground animate-in fade-in zoom-in duration-300">
                <ModeToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="size-4 mr-2" />
                    Quay lại đăng nhập
                </Link>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                    {isSent ? (
                        <div className="text-center py-4">
                            <div className="size-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Đã gửi email!</h2>
                            <p className="text-muted-foreground mb-6">
                                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>.
                                Vui lòng kiểm tra hộp thư đến (và cả mục spam).
                            </p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setIsSent(false)}
                            >
                                Gửi lại email
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="size-8 text-primary" />
                                </div>
                                <h1 className="text-2xl font-bold">Quên mật khẩu?</h1>
                                <p className="text-muted-foreground mt-2">
                                    Nhập email của bạn để nhận liên kết đặt lại mật khẩu.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            setError('')
                                        }}
                                        error={error}
                                        icon={<Mail className="size-5" />}
                                    />
                                </div>

                                <Button className="w-full" loading={isLoading}>
                                    Gửi liên kết
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
