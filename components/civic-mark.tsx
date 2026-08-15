import { cn } from '@/lib/utils'

/** CivicFix brand mark: a location pin carrying a check — "report, then fixed". */
export function CivicMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-lg bg-primary text-primary-foreground',
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[62%]" strokeWidth={2.4}>
        <path
          d="M12 21c4.5-4.2 7-7.4 7-11a7 7 0 1 0-14 0c0 3.6 2.5 6.8 7 11Z"
          className="stroke-current"
          strokeLinejoin="round"
        />
        <path
          d="m9 10 2.2 2.2L15 8.4"
          className="stroke-current"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
