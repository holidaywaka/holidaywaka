import bg5 from "/images/bgs5.jpg"
import { Fade } from "react-awesome-reveal";
import { FiCompass, FiGlobe, FiHeart, FiMail, FiMapPin, FiShield, FiSmile, FiStar, FiFeather } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";
import { SiteAddress, SiteEmail, SiteName, SocialLinksOptions, SocialsOptions } from "~/components/utils";
import type { SocialsProps } from "global";
import ContactForm from "~/components/general/ContactForm";
import useFetchResponse from "~/services/fetchResponse";
import { NewApis } from "~/services/new-apis";
import { seo } from '~/services/seo';



export function meta() {
    return seo({
        title: "Contact Us",
        description: "Get in touch with HolidayWaka to plan holiday packages, group trips, hotels, airport transfers and visa applications. We craft unforgettable journeys.",
        path: "/get-in-touch",
    })
}

const Reasons = [
    { Icon: FiCompass, title: "Tailored experiences, not templates", content: "Forget cookie-cutter tours. Our travel experts listen first, then design journeys around your pace, interests and dreams. A foodie pilgrimage through Italy? A secluded Maldives honeymoon? We make it happen." },
    { Icon: FiGlobe, title: "Local knowledge, global standards", content: "Our team includes in-destination specialists, from Maori guides in New Zealand to safari experts in Kenya. You get authentic encounters, backed by 24/7 support." },
    { Icon: FiFeather, title: "Sustainable & responsible travel", content: "We partner with eco-conscious lodges, community-led tours and carbon-offset programmes, so your travels leave positive footprints." },
    { Icon: FiSmile, title: "Stress-free from start to finish", content: "Visa hassles? Hidden fees? Not here. We handle the logistics, so you can savour the anticipation (and the journey)." },
]

const Values = [
    { Icon: FiStar, title: "Travel as transformation", content: "Journeys change lives. That's why we prioritise meaningful connections, whether it's learning to cook paella in Valencia or meditating in a Bhutanese monastery." },
    { Icon: FiShield, title: "Integrity in every detail", content: "Transparent pricing with no hidden costs, honest recommendations that put you before our margin, and rigorous vetting of every partner." },
    { Icon: FiHeart, title: "Celebrating diversity", content: "From wheelchair-accessible itineraries to LGBTQ+-friendly stays, we make sure everyone belongs on the road." },
]

export default function GetInTouch() {

    const { data } = useFetchResponse<{ data: SocialsProps[] }>({
        endpoint: NewApis.socials.socials
    })
    const whatsapp = data?.data?.find(ele => ele.tag === SocialLinksOptions.whatsapp)

    return (
        <div className="bg-background">
            <section className="relative min-h-[60dvh] flex items-center" style={{ background: `url(${bg5})center/cover no-repeat` }}>
                <div className="absolute inset-0 bg-linear-to-r from-primary/95 via-primary/80 to-primary/40" />
                <div className="relative w-11/12 max-w-7xl mx-auto py-20">
                    <Fade direction="up" triggerOnce cascade damping={0.15}>
                        <div className="inline-flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-[0.2em]">
                            <span className="h-px w-8 bg-secondary" /> Get in touch
                        </div>
                        <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mt-4 max-w-3xl">Let's craft your next unforgettable journey</h1>
                        <p className="text-white/80 text-lg mt-5 max-w-xl">Questions about a package, a visa or a booking? Our travel team is a message away.</p>
                        {Number(data?.data?.length) > 0 && <div className="flex flex-row items-center gap-3 mt-8 flex-wrap">
                            {data?.data?.map((item: SocialsProps, index: number) => {
                                const singles = SocialsOptions.find(ele => ele.tag === item.tag)
                                if (!singles) return null
                                return (
                                    <a key={index} rel="noreferrer" target="_blank" href={item.link} aria-label={item.tag}
                                        className="size-12 rounded-full bg-white/10 border border-white/20 backdrop-blur text-white text-xl flex items-center justify-center hover:bg-secondary hover:text-primary hover:border-secondary transition-colors">
                                        <singles.Icon />
                                    </a>
                                )
                            })}
                        </div>}
                    </Fade>
                </div>
            </section>

            <section className="w-11/12 max-w-7xl mx-auto -mt-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 content-start">
                        {whatsapp?.link && <ContactCard Icon={FaWhatsapp} title="Chat on WhatsApp" href={whatsapp.link} detail={whatsapp.link.split(".me/")[1] || 'Start a chat'} />}
                        <ContactCard Icon={FiMail} title="Email us" href={`mailto:${SiteEmail}`} detail={SiteEmail} />
                        <ContactCard Icon={FiMapPin} title="Visit our office" detail={SiteAddress} />
                    </div>
                    <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl shadow-primary/5 border border-slate-100 p-6 md:p-10">
                        <h2 className="font-extrabold text-2xl text-primary">Send us a message</h2>
                        <p className="text-zinc-500 text-sm mt-1 mb-6">We usually reply within one working day.</p>
                        <ContactForm />
                    </div>
                </div>
            </section>

            <section className="w-11/12 max-w-4xl mx-auto py-20 text-center">
                <div className="text-secondary text-xs font-bold uppercase tracking-[0.2em]">About {SiteName}</div>
                <h2 className="font-extrabold text-3xl lg:text-4xl text-primary mt-3">Where passion meets travel</h2>
                <p className="text-zinc-600 text-lg leading-relaxed mt-6">{SiteName} began with a simple belief: travel should inspire, transform and delight. What started as a small team of avid explorers has grown into a trusted travel curator, designing seamless getaways for wanderers worldwide.</p>
                <p className="text-zinc-600 text-lg leading-relaxed mt-4">We're not just planners; we're storytellers. Every itinerary we craft is infused with local secrets, cultural depth and a dash of adventure. Whether it's a solo backpacker's quest or a multigenerational family reunion, we turn trips into timeless memories.</p>
            </section>

            <section className="bg-white py-20">
                <div className="w-11/12 max-w-7xl mx-auto">
                    <SectionHeading eyebrow="Why travel with us" title="Everything handled, nothing generic" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
                        {Reasons.map((item, index) => (
                            <div key={index} className="rounded-2xl border border-slate-100 bg-background p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all">
                                <div className="size-12 rounded-xl bg-primary text-secondary flex items-center justify-center text-xl"> <item.Icon /> </div>
                                <h3 className="font-bold text-lg text-primary mt-5">{item.title}</h3>
                                <p className="text-zinc-600 text-sm leading-relaxed mt-2">{item.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20">
                <div className="w-11/12 max-w-7xl mx-auto">
                    <SectionHeading eyebrow="Our values" title={`The heart of ${SiteName}`} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
                        {Values.map((item, index) => (
                            <div key={index} className="rounded-2xl bg-white border border-slate-100 p-7">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-secondary/25 text-primary flex items-center justify-center"> <item.Icon /> </div>
                                    <span className="text-xs font-bold text-zinc-400">0{index + 1}</span>
                                </div>
                                <h3 className="font-bold text-lg text-primary mt-5">{item.title}</h3>
                                <p className="text-zinc-600 text-sm leading-relaxed mt-2">{item.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string, title: string }) {
    return (
        <div className="text-center max-w-2xl mx-auto">
            <div className="text-secondary text-xs font-bold uppercase tracking-[0.2em]">{eyebrow}</div>
            <h2 className="font-extrabold text-3xl lg:text-4xl text-primary mt-3">{title}</h2>
        </div>
    )
}

type contactCardProps = {
    Icon: React.ComponentType<{ className?: string }>
    title: string
    detail: string
    href?: string
}
function ContactCard({ Icon, title, detail, href }: contactCardProps) {
    const body = (
        <div className="flex items-start gap-4 bg-white rounded-2xl border border-slate-100 shadow-lg shadow-primary/5 p-5 h-full hover:border-secondary transition-colors">
            <div className="size-11 shrink-0 rounded-xl bg-secondary/20 text-primary flex items-center justify-center text-lg"> <Icon /> </div>
            <div className="min-w-0">
                <div className="font-bold text-primary">{title}</div>
                <div className="text-sm text-zinc-500 mt-0.5 wrap-break-word">{detail}</div>
            </div>
        </div>
    )
    if (!href) return body
    return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{body}</a>
}
