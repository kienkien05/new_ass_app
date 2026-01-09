import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    children: React.ReactNode
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    className,
    size = 'md',
}: ModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={cn(
                                'w-full bg-background rounded-2xl shadow-xl border border-border',
                                sizeClasses[size],
                                className
                            )}
                        >
                            {/* Header */}
                            {(title || description) && (
                                <div className="flex items-start justify-between p-6 border-b border-border">
                                    <div>
                                        {title && <h2 className="text-xl font-bold">{title}</h2>}
                                        {description && (
                                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2 -mt-2">
                                        <X className="size-5" />
                                    </Button>
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-6">{children}</div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}

// Modal Footer component for actions
export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('flex items-center justify-end gap-3 pt-4 border-t border-border -mx-6 -mb-6 px-6 py-4 mt-6', className)}>
            {children}
        </div>
    )
}
