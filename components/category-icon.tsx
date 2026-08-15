import {
  CircleDashed,
  Droplets,
  Footprints,
  Lightbulb,
  SprayCan,
  Signpost,
  TrafficCone,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

const ICONS: Record<Category, LucideIcon> = {
  Pothole: TrafficCone,
  Streetlight: Lightbulb,
  Graffiti: SprayCan,
  'Trash & Litter': Trash2,
  'Water Leak': Droplets,
  Sidewalk: Footprints,
  Signage: Signpost,
  Other: CircleDashed,
}

/**
 * Renders a category glyph. Pass only `className` for a bare icon, or pass
 * `iconClassName` to get a rounded "chip" where `className` sizes the chip.
 */
export function CategoryIcon({
  category,
  className,
  iconClassName,
}: {
  category: Category
  className?: string
  iconClassName?: string
}) {
  const Icon = ICONS[category] ?? CircleDashed

  if (!iconClassName) {
    return <Icon className={className} aria-hidden="true" />
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-primary/10 text-primary',
        className,
      )}
    >
      <Icon className={iconClassName} aria-hidden="true" />
    </span>
  )
}
