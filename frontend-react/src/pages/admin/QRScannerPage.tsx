import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Camera, Check, X, AlertCircle, Ticket, User, MapPin, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import api from '@/services/api'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface TicketInfo {
    id: string
    ticket_code: string
    status: string
    used_at?: string
    price: number
    event: {
        id: string
        title: string
        start_time: string
        location: string
    }
    ticket_type: {
        id: string
        name: string
    }
    buyer: {
        id: string
        name: string
        email: string
    }
    seat?: {
        room: string
        row: string
        number: number
    }
}

interface ScanResult {
    success: boolean
    valid: boolean
    message: string
    warning?: string
    ticket_info?: TicketInfo
}

export default function QRScannerPage() {
    const [isScanning, setIsScanning] = useState(false)
    const [lastResult, setLastResult] = useState<ScanResult | null>(null)
    const [manualCode, setManualCode] = useState('')
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)
    const scannerContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error)
            }
        }
    }, [])

    const startScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error)
        }

        setIsScanning(true)
        setLastResult(null)

        setTimeout(() => {
            scannerRef.current = new Html5QrcodeScanner(
                'qr-reader',
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    rememberLastUsedCamera: true,
                },
                false
            )

            scannerRef.current.render(
                async (decodedText) => {
                    await validateTicket(decodedText)
                    if (scannerRef.current) {
                        scannerRef.current.pause(true)
                    }
                },
                (error) => {
                    // Ignore scanning errors
                }
            )
        }, 100)
    }

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error)
            scannerRef.current = null
        }
        setIsScanning(false)
    }

    const validateTicket = async (ticketCode: string) => {
        try {
            const response = await api.post('/tickets/validate-qr', {
                ticket_code: ticketCode
            })
            setLastResult(response.data)
            if (response.data.success) {
                toast.success(response.data.message)
            }
        } catch (error: any) {
            const result = error.response?.data || {
                success: false,
                valid: false,
                message: error.message || 'Lỗi không xác định'
            }
            setLastResult(result)
            toast.error(result.message)
        }
    }

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (manualCode.trim()) {
            await validateTicket(manualCode.trim())
            setManualCode('')
        }
    }

    const continueScanning = () => {
        setLastResult(null)
        if (scannerRef.current) {
            scannerRef.current.resume()
        }
    }

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return 'Không xác định'
        return new Date(dateStr).toLocaleString('vi-VN')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quét QR Soát Vé</h1>
                    <p className="text-muted-foreground">Quét mã QR trên vé để check-in khách hàng</p>
                </div>
                <div className="flex gap-2">
                    {!isScanning ? (
                        <Button onClick={startScanner} className="gap-2">
                            <Camera className="w-4 h-4" />
                            Bật Camera
                        </Button>
                    ) : (
                        <Button onClick={stopScanner} variant="destructive" className="gap-2">
                            <X className="w-4 h-4" />
                            Tắt Camera
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Scanner Area */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5" />
                            Quét Mã QR
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isScanning ? (
                            <div className="space-y-4">
                                <div
                                    id="qr-reader"
                                    ref={scannerContainerRef}
                                    className="w-full rounded-lg overflow-hidden"
                                />
                                <p className="text-sm text-muted-foreground text-center">
                                    Hướng camera vào mã QR trên vé
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center mb-4">
                                    <Camera className="w-12 h-12 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground mb-4">
                                    Nhấn "Bật Camera" để bắt đầu quét mã QR
                                </p>
                            </div>
                        )}

                        {/* Manual Input */}
                        <div className="mt-6 pt-6 border-t">
                            <p className="text-sm font-medium mb-2">Hoặc nhập mã vé thủ công:</p>
                            <form onSubmit={handleManualSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                    placeholder="Nhập mã vé (VD: ABC123XYZ456)"
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                                <Button type="submit" disabled={!manualCode.trim()}>
                                    Kiểm tra
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>

                {/* Result Area */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Ticket className="w-5 h-5" />
                            Kết Quả
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lastResult ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {/* Status Banner */}
                                <div className={`p-4 rounded-lg flex items-center gap-3 ${lastResult.valid
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {lastResult.valid ? (
                                        <Check className="w-6 h-6" />
                                    ) : (
                                        <X className="w-6 h-6" />
                                    )}
                                    <div>
                                        <p className="font-semibold">{lastResult.message}</p>
                                        {lastResult.warning && (
                                            <p className="text-sm flex items-center gap-1 mt-1">
                                                <AlertCircle className="w-4 h-4" />
                                                {lastResult.warning}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Ticket Info */}
                                {lastResult.ticket_info && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Mã vé</span>
                                                <code className="font-mono font-bold text-lg">
                                                    {lastResult.ticket_info.ticket_code}
                                                </code>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Trạng thái</span>
                                                <Badge variant={
                                                    lastResult.ticket_info.status === 'valid' ? 'default' :
                                                        lastResult.ticket_info.status === 'used' ? 'secondary' : 'destructive'
                                                }>
                                                    {lastResult.ticket_info.status === 'valid' ? 'Hợp lệ' :
                                                        lastResult.ticket_info.status === 'used' ? 'Đã sử dụng' : 'Đã huỷ'}
                                                </Badge>
                                            </div>
                                            {lastResult.ticket_info.used_at && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Thời gian check-in</span>
                                                    <span className="text-sm">{formatDateTime(lastResult.ticket_info.used_at)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Event Info */}
                                        <div className="p-4 border rounded-lg space-y-2">
                                            <h4 className="font-semibold">{lastResult.ticket_info.event.title}</h4>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="w-4 h-4" />
                                                {formatDateTime(lastResult.ticket_info.event.start_time)}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="w-4 h-4" />
                                                {lastResult.ticket_info.event.location}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Ticket className="w-4 h-4" />
                                                Loại vé: <strong>{lastResult.ticket_info.ticket_type.name}</strong>
                                            </div>
                                            {lastResult.ticket_info.seat && (
                                                <div className="text-sm">
                                                    Ghế: <strong>{lastResult.ticket_info.seat.room} - {lastResult.ticket_info.seat.row}{lastResult.ticket_info.seat.number}</strong>
                                                </div>
                                            )}
                                        </div>

                                        {/* Buyer Info */}
                                        <div className="p-4 border rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4" />
                                                <span className="font-medium">Thông tin người mua</span>
                                            </div>
                                            <p className="text-sm">{lastResult.ticket_info.buyer.name}</p>
                                            <p className="text-sm text-muted-foreground">{lastResult.ticket_info.buyer.email}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                {isScanning && (
                                    <Button onClick={continueScanning} className="w-full">
                                        Quét vé tiếp theo
                                    </Button>
                                )}
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center mb-4">
                                    <QrCode className="w-12 h-12 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground">
                                    Kết quả quét sẽ hiển thị tại đây
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
