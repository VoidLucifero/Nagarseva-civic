import { CategoryIcon } from '@/components/category-icon'
import type { Category } from '@/lib/types'

const CATEGORIES: { name: Category; blurb: string }[] = [
  { name: 'Pothole', blurb: 'Road damage & surface hazards' },
  { name: 'Streetlight', blurb: 'Outages & flickering lamps' },
  { name: 'Graffiti', blurb: 'Vandalism & tagging removal' },
  { name: 'Trash & Litter', blurb: 'Overflowing bins & dumping' },
  { name: 'Water Leak', blurb: 'Mains, hydrants & flooding' },
  { name: 'Sidewalk', blurb: 'Cracked or blocked walkways' },
  { name: 'Signage', blurb: 'Damaged or missing signs' },
  { name: 'Other', blurb: 'Anything else in your area' },
]

export function CategoriesShowcase() {
  return (
    <section className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            What you can report
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Every corner of your neighborhood, covered
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Pick a category and our system routes your report to the right city department
            automatically.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <CategoryIcon category={cat.name} className="size-11" iconClassName="size-5" />
              <h3 className="mt-4 font-semibold">{cat.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{cat.blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
