import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Users, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { useUserStore, type AppUser } from '@/stores/userStore'

export default function AdminUsersPage() {
    const { users, addUser, updateUser, deleteUser, toggleStatus, emailExists } = useUserStore()
    const [search, setSearch] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'user' as 'admin' | 'user',
    })

    const filteredUsers = users.filter(
        (user) =>
            user.full_name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
    )

    const stats = {
        total: users.length,
        active: users.filter((u) => u.status === 'active').length,
        admins: users.filter((u) => u.role === 'admin').length,
    }

    const resetForm = () => {
        setFormData({ full_name: '', email: '', password: '', role: 'user' })
    }

    const handleAdd = () => {
        if (!formData.full_name || !formData.email || !formData.password) {
            toast.error('Vui lòng điền đầy đủ thông tin!')
            return
        }
        // Check for duplicate email
        if (emailExists(formData.email)) {
            toast.error('Email đã tồn tại trong hệ thống!')
            return
        }
        addUser({
            full_name: formData.full_name,
            email: formData.email,
            role: formData.role,
            status: 'active',
        })
        setIsAddModalOpen(false)
        resetForm()
        toast.success('Thêm người dùng thành công!')
    }

    const handleEdit = () => {
        if (!selectedUser) return
        // Check for duplicate email (excluding current user)
        const existingUser = users.find(
            (u) => u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== selectedUser.id
        )
        if (existingUser) {
            toast.error('Email đã tồn tại trong hệ thống!')
            return
        }
        updateUser(selectedUser.id, {
            full_name: formData.full_name || selectedUser.full_name,
            email: formData.email || selectedUser.email,
            role: formData.role,
        })
        setIsEditModalOpen(false)
        setSelectedUser(null)
        resetForm()
        toast.success('Cập nhật người dùng thành công!')
    }

    const handleDelete = () => {
        if (!selectedUser) return
        deleteUser(selectedUser.id)
        setIsDeleteModalOpen(false)
        setSelectedUser(null)
        toast.success('Xóa người dùng thành công!')
    }

    const handleToggleStatus = (user: AppUser) => {
        toggleStatus(user.id)
        toast.success(user.status === 'active' ? 'Đã vô hiệu hóa tài khoản' : 'Đã kích hoạt tài khoản')
    }

    const openEditModal = (user: AppUser) => {
        setSelectedUser(user)
        setFormData({
            full_name: user.full_name,
            email: user.email,
            password: '',
            role: user.role,
        })
        setIsEditModalOpen(true)
    }

    const openDeleteModal = (user: AppUser) => {
        setSelectedUser(user)
        setIsDeleteModalOpen(true)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Users className="size-5 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Tổng người dùng</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <UserCheck className="size-5 text-emerald-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.active}</p>
                                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Shield className="size-5 text-amber-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.admins}</p>
                                <p className="text-xs text-muted-foreground">Quản trị viên</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm người dùng..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left p-4 font-medium text-sm">Họ tên</th>
                                    <th className="text-left p-4 font-medium text-sm">Email</th>
                                    <th className="text-left p-4 font-medium text-sm">Vai trò</th>
                                    <th className="text-left p-4 font-medium text-sm">Trạng thái</th>
                                    <th className="text-left p-4 font-medium text-sm">Ngày tạo</th>
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
                                                        {user.full_name.charAt(0).toUpperCase()}
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
                                            <Badge variant={user.status === 'active' ? 'success' : 'destructive'}>
                                                {user.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{user.created_at}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleStatus(user)}
                                                >
                                                    {user.status === 'active' ? (
                                                        <UserX className="size-4" />
                                                    ) : (
                                                        <UserCheck className="size-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditModal(user)}
                                                >
                                                    <Edit className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => openDeleteModal(user)}
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
                                <p>Không tìm thấy người dùng nào</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); resetForm() }}
                title="Thêm người dùng mới"
                description="Tạo tài khoản người dùng mới"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Họ tên *</label>
                        <Input
                            placeholder="Nhập họ tên"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email *</label>
                        <Input
                            type="email"
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mật khẩu *</label>
                        <Input
                            type="password"
                            placeholder="Nhập mật khẩu"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Vai trò</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        >
                            <option value="user">Người dùng</option>
                            <option value="admin">Quản trị viên</option>
                        </select>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => { setIsAddModalOpen(false); resetForm() }}>
                        Hủy
                    </Button>
                    <Button onClick={handleAdd}>
                        Thêm người dùng
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); resetForm() }}
                title="Chỉnh sửa người dùng"
                description="Cập nhật thông tin người dùng"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Họ tên</label>
                        <Input
                            placeholder="Nhập họ tên"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Vai trò</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        >
                            <option value="user">Người dùng</option>
                            <option value="admin">Quản trị viên</option>
                        </select>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => { setIsEditModalOpen(false); resetForm() }}>
                        Hủy
                    </Button>
                    <Button onClick={handleEdit}>
                        Lưu thay đổi
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Xác nhận xóa"
                size="sm"
            >
                <p className="text-muted-foreground">
                    Bạn có chắc chắn muốn xóa người dùng "{selectedUser?.full_name}"? Hành động này không thể hoàn tác.
                </p>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                        Hủy
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        Xóa
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}
