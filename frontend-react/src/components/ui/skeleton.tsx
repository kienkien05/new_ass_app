import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-xl bg-muted',
                className
            )}
            {...props}
        />
    )
}

// Pre-built skeleton components for common patterns
function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
        </div>
    )
}

function SkeletonEventCard() {
    return (
        <div className="flex-shrink-0 w-72 rounded-2xl border border-border bg-card overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            </div>
        </div>
    )
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
        </div>
    )
}

export { Skeleton, SkeletonCard, SkeletonEventCard, SkeletonTable }
