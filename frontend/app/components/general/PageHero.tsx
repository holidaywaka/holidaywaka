import { Fade } from 'react-awesome-reveal'
import { SiteName } from '~/components/utils'

type props = {
    image: string
    position?: string
    title: string
    subtitle?: string
    /** The search card. HomeCard pulls itself up with -mt-30, so the heading block keeps mb-32 for it */
    children?: React.ReactNode
}

export default function PageHero({ image, position = "center", title, subtitle, children }: props) {
    return (
        <section className="relative" style={{ background: `url(${image})${position}/cover no-repeat` }}>
            <div className="absolute inset-0 bg-linear-to-b from-primary/90 via-primary/75 to-primary/60" />
            <div className="relative pt-16 md:pt-20 pb-14">
                <div className="mb-32 text-center w-11/12 max-w-3xl mx-auto">
                    <Fade direction="up" triggerOnce cascade damping={0.15}>
                        <div className="inline-flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-[0.2em]">
                            <span className="h-px w-8 bg-secondary" /> {SiteName}<sup>&reg;</sup> <span className="h-px w-8 bg-secondary" />
                        </div>
                        <h1 className="text-white font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight mt-4">{title}</h1>
                        {subtitle && <p className="text-white/80 text-base md:text-lg mt-4">{subtitle}</p>}
                    </Fade>
                </div>
                <div className="w-full max-w-7xl mx-auto drop-shadow-2xl">
                    {children}
                </div>
            </div>
        </section>
    )
}

type feature = {
    Icon: React.ComponentType<{ className?: string }>
    title: string
    content: string
}
export function FeatureStrip({ items }: { items: feature[] }) {
    return (
        <section className="bg-white border-b border-slate-100">
            <div className="w-11/12 max-w-7xl mx-auto py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                        <div className="size-11 shrink-0 rounded-xl bg-secondary/20 text-primary flex items-center justify-center text-lg"> <item.Icon /> </div>
                        <div>
                            <div className="font-bold text-primary">{item.title}</div>
                            <div className="text-sm text-zinc-500 mt-0.5">{item.content}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
