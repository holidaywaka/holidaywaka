
import { Fade } from 'react-awesome-reveal'
import { SiteName } from '~/components/utils'
import VisaProcess from '~/routes/general/visa/visa-process'
import { seo } from '~/services/seo'

export function meta() {
    return seo({
        title: "Visa Applications",
        description: "Apply for your travel visa with HolidayWaka. Check requirements, fees and processing times, and let our team handle a smooth, stress-free application.",
        path: "/visa",
    })
}

const Steps = [
    { title: "Choose a country", content: "Pick your destination and visa type to see requirements and fees." },
    { title: "Share your details", content: "Tell us about your trip and passport. It takes a couple of minutes." },
    { title: "We handle the rest", content: "Our team prepares and tracks your application until it's ready." },
]

export default function visa() {
    return (
        <div className="bg-background">
            <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="lg:h-dvh lg:sticky lg:top-0 self-start">
                    <div className="h-full relative" style={{ background: `url(/images/bg6.jpg)center/cover no-repeat` }}>
                        <div className="absolute inset-0 bg-linear-to-t from-primary via-primary/80 to-primary/50" />
                        <div className="relative h-full flex flex-col justify-end px-6 md:px-12 py-14">
                            <Fade direction="up" triggerOnce cascade damping={0.15}>
                                <div className="inline-flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-[0.2em]">
                                    <span className="h-px w-8 bg-secondary" /> {SiteName}<sup>&reg;</sup>
                                </div>
                                <h1 className="text-white font-extrabold text-4xl lg:text-6xl leading-tight mt-4">Visa Applications</h1>
                                <p className="text-white/80 text-lg mt-4 max-w-md">Smooth, fast, and stress-free – your visa journey starts here!</p>
                            </Fade>
                            <ol className="mt-10 space-y-5 hidden md:block">
                                {Steps.map((item, index) => (
                                    <li key={index} className="flex gap-4">
                                        <div className="size-9 shrink-0 rounded-full border border-secondary text-secondary font-bold flex items-center justify-center text-sm">{index + 1}</div>
                                        <div>
                                            <div className="text-white font-bold">{item.title}</div>
                                            <div className="text-white/70 text-sm">{item.content}</div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
                <div className="min-h-dvh">
                    <VisaProcess />
                </div>
            </div>
        </div>
    )
}
