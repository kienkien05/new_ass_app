import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Users, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/services/api'

interface ApiUser {
    id: string
    email: string
    full_name: string
    avatar_url?: string
    role: 'admin' | 'user'
    is_active: boolean
    phone_number?: string
    facebook_url?: string
    gender?: string
    address?: string
    date_of_birth?: string
    ticket_count?: number
    order_count?: number
}

export default function AdminUsersPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null)

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'user' as 'admin' | 'user',
        phone_number: '',
        facebook_url: '',
        gender: 'other' as 'male' | 'female' | 'other',
        address: '',
        date_of_birth: ''
    })

    // Fetch users from API
    const { data, isLoading } = useQuery<{ success: boolean; data: ApiUser[] }>({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            const response = await api.get('/admin/users?limit=100')
            return response.data
        }
    })

    const users = data?.data || []

    // Create user mutation
    const createUserMutation = useMutation({
        mutationFn: async (userData: typeof formData) => {
            const response = await api.post('/admin/users', userData)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
            toast.success('Thêm người dùng thành công!')
            setIsAddModalOpen(false)
            resetForm()
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Không thể tạo người dùng')
        }
    })

    // Update user mutation
    const updateUserMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
            const response = await api.put(`/admin/users/${id}`, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
            toast.success('Cập nhật người dùng thành công!')
            setIsEditModalOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Không thể cập nhật người dùng')
        }
    })

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/admin/users/${id}`)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
            toast.success('Xóa người dùng thành công!')
            setIsDeleteModalOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Không thể xóa người dùng')
        }
    })

    // Toggle status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.patch(`/admin/users/${id}/toggle-status`)
            return response.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
            toast.success(data.message || 'Đã thay đổi trạng thái!')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Không thể thay đổi trạng thái')
        }
    })

    const filteredUsers = users.filter(
        (user) =>
            user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase())
    )

    const stats = {
        total: users.length,
        active: users.filter((u) => u.is_active).length,
        admins: users.filter((u) => u.role === 'admin').length,
    }

    const resetForm = () => {
        setFormData({
            full_name: '',
            email: '',
            password: '',
            role: 'user',
            phone_number: '',
            facebook_url: '',
            gender: 'other',
            address: '',
            date_of_birth: ''
        })
    }

    const handleAdd = () => {
        if (!formData.full_name || !formData.email || !formData.password) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!')
            return
        }
        createUserMutation.mutate(formData)
    }

    const handleEdit = () => {
        if (!selectedUser) return
        updateUserMutation.mutate({
            id: selectedUser.id,
            data: {
                full_name: formData.full_name || selectedUser.full_name,
                email: formData.email || selectedUser.email,
                role: formData.role,
                phone_number: formData.phone_number,
                facebook_url: formData.facebook_url,
                gender: formData.gender,
                address: formData.address,
                date_of_birth: formData.date_of_birth
            }
        })
    }

    const handleDelete = () => {
        if (!selectedUser) return
        deleteUserMutation.mutate(selectedUser.id)
    }

    const openEditModal = (user: ApiUser) => {
        setSelectedUser(user)
        setFormData({
            full_name: user.full_name || '',
            email: user.email || '',
            password: '',
            role: user.role || 'user',
            phone_number: user.phone_number || '',
            facebook_url: user.facebook_url || '',
            gender: (user.gender as 'male' | 'female' | 'other') || 'other',
            address: user.address || '',
            date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : ''
        })
        setIsEditModalOpen(true)
    }

    const openDeleteModal = (user: ApiUser) => {
        setSelectedUser(user)
        setIsDeleteModalOpen(true)
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-96 rounded-lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
                    <p className="text-muted-foreground mt-1">Quản lý tài khoản người dùng trong hệ thống</p>
                </div>
                <Button onClick={() => { resetForm(); setIsAddModalOpen(true) }}>
                    <Plus className="size-4 mr-2" />
                    Thêm người dùng
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Tổng người dùng</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <UserCheck className="size-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Shield className="size-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.admins}</p>
                                <p className="text-sm text-muted-foreground">Quản trị viên</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm người dùng..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left p-4 font-medium text-sm">Người dùng</th>
                                    <th className="text-left p-4 font-medium text-sm">Email</th>
                                    <th className="text-left p-4 font-medium text-sm">Vai trò</th>
                                    <th className="text-left p-4 font-medium text-sm">Trạng thái</th>
                                    <th className="text-right p-4 font-medium text-sm">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, index) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="border-b border-border last:border-0 hover:bg-muted/50"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-primary">
                                                        {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <span className="font-medium">{user.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{user.email}</td>
                                        <td className="p-4">
                                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                {user.role === 'admin' ? 'Admin' : 'User'}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={user.is_active ? 'success' : 'destructive'}>
                                                {user.is_active ? 'Hoạt động' : 'Vô hiệu'}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => toggleStatusMutation.mutate(user.id)}
                                                    title={user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                >
                                                    {user.is_active ? (
                                                        <UserX className="size-4" />
                                                    ) : (
                                                        <UserCheck className="size-4" />
                                                    )}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEditModal(user)}>
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openDeleteModal(user)}
                                                    disabled={user.role === 'admin'}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredUsers.length === 0 && (
                            <div className="py-12 text-center text-muted-foreground">
                                <Users className="size-12 mx-auto mb-4 opacity-50" />
                                <p>Không tìm thấy người dùng</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add User Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Thêm người dùng mới"
                description="Tạo tài khoản người dùng mới"
            >
                <div className="space-y-4">
                    {/* Row 1: Họ tên + SĐT */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Họ và tên *</label>
                            <Input
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Nhập họ và tên"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Số điện thoại</label>
                            <Input
                                value={formData.phone_number}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                placeholder="Nhập số điện thoại"
                            />
                        </div>
                    </div>

                    {/* Row 2: Email + Địa chỉ */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email *</label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Nhập email"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Địa chỉ</label>
                            <Input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Nhập địa chỉ"
                            />
                        </div>
                    </div>

                    {/* Row 3: Mật khẩu + Vai trò */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mật khẩu *</label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Nhập mật khẩu"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Vai trò</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 4: Giới tính + Ngày sinh */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Giới tính</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                            >
                                <option value="other">Khác</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ngày sinh</label>
                            <Input
                                type="date"
                                value={formData.date_of_birth}
                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Row 5: Facebook URL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Facebook URL</label>
                        <Input
                            value={formData.facebook_url}
                            onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                            placeholder="https://facebook.com/username"
                        />
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleAdd} disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? 'Đang tạo...' : 'Thêm người dùng'}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Edit User Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Chỉnh sửa người dùng"
                description={`Chỉnh sửa thông tin của ${selectedUser?.full_name}`}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Họ và tên</label>
                        <Input
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Vai trò</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Số điện thoại</label>
                        <Input
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Địa chỉ</label>
                        <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleEdit} disabled={updateUserMutation.isPending}>
                        {updateUserMutation.isPending ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Xác nhận xóa"
                description={`Bạn có chắc muốn xóa người dùng "${selectedUser?.full_name}"?`}
            >
                <p className="text-muted-foreground">
                    Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến người dùng này sẽ bị xóa vĩnh viễn.
                </p>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                        Hủy
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleteUserMutation.isPending}>
                        {deleteUserMutation.isPending ? 'Đang xóa...' : 'Xóa người dùng'}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
