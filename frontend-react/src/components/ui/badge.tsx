import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-primary/10 text-primary',
                secondary: 'bg-secondary text-secondary-foreground',
                success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                destructive: 'bg-destructive/10 text-destructive',
                outline: 'border border-border text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
