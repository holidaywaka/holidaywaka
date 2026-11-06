import React from 'react'

export const HOTEL_SECTIONS = [
    { id: 'hotel-overview', label: 'Overview' },
    { id: 'hotel-rooms', label: 'Rooms' },
    { id: 'hotel-description', label: 'About' },
    { id: 'hotel-amenities', label: 'Amenities' },
    { id: 'hotel-policies', label: 'Policies' },
]

export function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Sticky in-page navigation; highlights the section currently in view */
export default function HotelSectionNav() {
    const [active, setActive] = React.useState(HOTEL_SECTIONS[0].id)
    const [present, setPresent] = React.useState<string[]>([])

    React.useEffect(() => {
        // Sections render only when the property has data for them
        const elements = HOTEL_SECTIONS.map((section) => document.getElementById(section.id)).filter((element): element is HTMLElement => Boolean(element))
        setPresent(elements.map((element) => element.id))
        const observer = new IntersectionObserver((entries) => {
            const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
            if (visible[0]) setActive(visible[0].target.id)
        }, { rootMargin: '-120px 0px -55% 0px' })
        elements.forEach((element) => observer.observe(element))
        return () => observer.disconnect()
        // Mounted with the loaded hotel, so every section that will exist is already in the DOM
    }, [])

    return (
        <nav className="sticky top-16 z-20 -mx-3 px-3 py-2 bg-slate-100/90 backdrop-blur" aria-label="Hotel sections">
            <div className="flex gap-1 overflow-x-auto scrolls">
                {HOTEL_SECTIONS.filter((section) => present.includes(section.id)).map((section) => (
                    <button
                        key={section.id}
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        aria-current={active === section.id ? 'true' : undefined}
                        className={`shrink-0 h-9 px-4 rounded-lg text-sm font-medium cursor-pointer transition-colors ${active === section.id ? 'bg-primary text-white' : 'bg-white text-zinc-700 hover:bg-white/70'}`}>
                        {section.label}
                    </button>
                ))}
            </div>
        </nav>
    )
}
