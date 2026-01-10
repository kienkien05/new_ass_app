import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Lock, Save, Camera, Facebook, Calendar, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'

export default function ProfilePage() {
    const { user, updateUser } = useAuthStore()
    const [activeTab, setActiveTab] = useState<'info' | 'security'>('info')
    const [loading, setLoading] = useState(false)

    // Form data state
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        address: '',
        facebook_url: '',
        gender: 'other',
        date_of_birth: '',
        // Password fields
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                full_name: user.full_name || '',
                phone_number: user.phone_number || '',
                address: user.address || '',
                facebook_url: user.facebook_url || '',
                gender: user.gender || 'other',
                date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : '',
            }))
        }
    }, [user])

    const handleSave = async () => {
        setLoading(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Update local store
        updateUser({
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            address: formData.address,
            facebook_url: formData.facebook_url,
            gender: formData.gender as 'male' | 'female' | 'other',
            date_of_birth: formData.date_of_birth,
        })

        toast.success('Cập nhật thông tin thành công!')
        setLoading(false)
    }

    const handleChangePassword = async () => {
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp')
            return
        }
        if (formData.newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
            return
        }

        setLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        toast.success('Đổi mật khẩu thành công!')
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' })
        setLoading(false)
    }

    return (
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
                    <p className="text-muted-foreground mt-2">Quản lý thông tin tài khoản của bạn</p>
                </div>

                {/* Profile Card */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20 overflow-hidden">
                                    {user?.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.full_name}
                                            className="size-24 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl font-bold text-primary">
                                            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    )}
                                </div>
                                <button className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                                    <Camera className="size-4" />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="text-center sm:text-left">
                                <h2 className="text-xl font-bold">{user?.full_name || 'Người dùng'}</h2>
                                <p className="text-muted-foreground">{user?.email}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Thành viên từ {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <div className="flex border-b border-border mb-6">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Thông tin cá nhân
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'security'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Bảo mật
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'info' ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="size-5" />
                                Thông tin cơ bản
                            </CardTitle>
                            <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Họ và tên</label>
                                    <Input
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        icon={<User className="size-5" />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        icon={<Mail className="size-5" />}
                                        className="bg-muted"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Số điện thoại</label>
                                    <Input
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        placeholder="0912 345 678"
                                        icon={<Phone className="size-5" />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Địa chỉ</label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Địa chỉ của bạn"
                                        icon={<MapPin className="size-5" />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ngày sinh</label>
                                    <Input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        icon={<Calendar className="size-5" />}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Giới tính</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-10 px-3 py-2 pl-10 border border-border rounded-lg bg-background appearance-none"
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        >
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="other">Khác</option>
                                        </select>
                                        <UserCheck className="absolute left-3 top-2.5 size-5 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Facebook URL</label>
                                    <Input
                                        value={formData.facebook_url}
                                        onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                                        placeholder="https://facebook.com/username"
                                        icon={<Facebook className="size-5" />}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-border">
                                <Button onClick={handleSave} loading={loading}>
                                    <Save className="size-4 mr-2" />
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="size-5" />
                                Đổi mật khẩu
                            </CardTitle>
                            <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Mật khẩu hiện tại</label>
                                    <Input
                                        type="password"
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                        placeholder="Nhập mật khẩu hiện tại"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Mật khẩu mới</label>
                                    <Input
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        placeholder="Nhập mật khẩu mới"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Xác nhận mật khẩu mới</label>
                                    <Input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="Nhập lại mật khẩu mới"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-border">
                                <Button onClick={handleChangePassword} loading={loading}>
                                    Cập nhật mật khẩu
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </div>
    )
}
