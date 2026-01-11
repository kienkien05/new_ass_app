import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import api from '@/services/api'

export default function OTPVerifyPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useAuthStore()

    // Get email and type from navigation state
    const { email, type } = location.state || {}

    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [isLoading, setIsLoading] = useState(false)
    const [countdown, setCountdown] = useState(60)
    const [canResend, setCanResend] = useState(false)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        // Redirect if no email/type
        if (!email || !type) {
            navigate('/login')
            return
        }

        // Focus first input
        inputRefs.current[0]?.focus()
    }, [email, type, navigate])

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            setCanResend(true)
        }
    }, [countdown])

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return // Only allow digits

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1) // Only keep last digit
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').slice(0, 6)
        if (!/^\d+$/.test(pastedData)) return

        const newOtp = [...otp]
        pastedData.split('').forEach((char, i) => {
            if (i < 6) newOtp[i] = char
        })
        setOtp(newOtp)

        // Focus last filled input
        const lastIndex = Math.min(pastedData.length - 1, 5)
        inputRefs.current[lastIndex]?.focus()
    }

    const handleVerify = async () => {
        const otpCode = otp.join('')
        if (otpCode.length !== 6) {
            toast.error('Vui lòng nhập đủ 6 số OTP')
            return
        }

        setIsLoading(true)
        try {
            const endpoint = type === 'register' ? '/auth/verify-register' : '/auth/verify-login'
            const response = await api.post(endpoint, { email, otp: otpCode })

            if (response.data.success) {
                toast.success(response.data.message)

                // Login the user
                login({
                    id: response.data.data.id,
                    full_name: response.data.data.full_name,
                    email: response.data.data.email,
                    role: response.data.data.role,
                    avatar_url: response.data.data.avatar_url,
                    token: response.data.data.token
                })

                // Redirect based on role
                if (response.data.data.role === 'admin') {
                    navigate('/admin')
                } else {
                    navigate('/')
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Xác thực thất bại')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
        if (!canResend) return

        try {
            const response = await api.post('/auth/resend-otp', { email, type })
            if (response.data.success) {
                toast.success('Đã gửi lại mã OTP')
                setCountdown(60)
                setCanResend(false)
                setOtp(['', '', '', '', '', ''])
                inputRefs.current[0]?.focus()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể gửi lại OTP')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Back button */}
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => navigate(type === 'register' ? '/register' : '/login')}
                >
                    <ArrowLeft className="size-4 mr-2" />
                    Quay lại
                </Button>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="size-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold">Xác thực OTP</h1>
                        <p className="text-muted-foreground mt-2">
                            Chúng tôi đã gửi mã xác thực 6 số đến
                        </p>
                        <p className="font-medium text-primary">{email}</p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-border rounded-xl bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            />
                        ))}
                    </div>

                    {/* Verify Button */}
                    <Button
                        className="w-full h-12 text-base"
                        onClick={handleVerify}
                        disabled={isLoading || otp.join('').length !== 6}
                    >
                        {isLoading ? 'Đang xác thực...' : 'Xác nhận'}
                    </Button>

                    {/* Resend */}
                    <div className="text-center mt-6">
                        {canResend ? (
                            <button
                                onClick={handleResend}
                                className="text-primary hover:underline flex items-center justify-center gap-2 mx-auto"
                            >
                                <RefreshCw className="size-4" />
                                Gửi lại mã
                            </button>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Gửi lại mã sau <span className="font-medium text-primary">{countdown}s</span>
                            </p>
                        )}
                    </div>

                    {/* MailHog hint for development */}
                    <div className="mt-6 p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">
                            📧 Xem email tại: <a href="http://localhost:8025" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">localhost:8025</a>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
