import { Carousel } from '@mantine/carousel';
import { useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { FaArrowLeftLong, FaArrowRightLong } from "react-icons/fa6"
import { FiArrowUpRight, FiCheck, FiCompass, FiHeart, FiMail, FiMapPin, FiMessageCircle, FiShield } from 'react-icons/fi';
import { Fade } from 'react-awesome-reveal';
import Socials from '~/components/general/Socials';
import Header from '~/components/general/Header';
import Footer from '~/components/general/Footer';
import PageTrips from '~/components/pageComponent/PageTrips';
import BlogComponent from '~/components/pageComponent/BlogComponent';
import { SiteAddress, SiteEmail, SiteName, VisaItems } from '~/components/utils';
import Linked from '~/components/general/Linked';
import { ApiCountries, ApiCountryFlags } from "~/components/general/ApiCountries";
import HomeCard from "~/routes/general/home/components/home-card";


const BannerImages = [
  { title: `Hotels`, lead: `Stays worth`, accent: `remembering`, image: `/images/bgs7.jpg`, content: `Exclusive hotels at affordable rates, from city escapes to beachfront retreats.`, url: `/hotels` },
  { title: `Airport Transfers`, lead: `Arrive in`, accent: `quiet comfort`, image: `/images/bg8.jpg`, position: 'center top', content: `Reliable rides from airport to doorstep – comfort, safety, and convenience guaranteed.`, url: `/transfers` },
  { title: `Personal Trips`, lead: `Your journey,`, accent: `your way`, image: `/images/bgs.jpg`, content: `Adventure tailored just for you, planned around your pace and your dreams.`, url: `/packages?tripType=PRIVATE` },
  { title: `Group Trips`, lead: `Explore together,`, accent: `save together`, image: `/images/bgs1.jpg`, content: `Unforgettable trips with friends & family, with every detail taken care of.`, url: `/packages?tripType=GROUP` },
  { title: `Visa Applications`, lead: `Visas, made`, accent: `effortless`, image: `/images/bg6.jpg`, content: `Smooth, fast, and stress-free – your visa journey starts here.`, url: `/visa` },
];

const Services = [
  { title: `Hotels`, content: `Handpicked stays, compared side by side and booked in minutes.`, image: `/images/bgs6.jpg`, url: `/hotels` },
  { title: `Transfers`, content: `Meet-and-greet airport rides and hourly chauffeurs.`, image: `/images/bg8.jpg`, url: `/transfers` },
  { title: `Holiday Packages`, content: `Curated private and group escapes around the world.`, image: `/images/bgs.jpg`, url: `/packages` },
  { title: `Visas`, content: `Expert guidance from requirements to approval.`, image: `/images/bg6.jpg`, url: `/visa` },
]

const Promises = [
  { Icon: FiHeart, title: `Thoughtfully curated`, content: `Every stay, ride and itinerary is chosen with care, never pulled from a template.` },
  { Icon: FiShield, title: `Transparent pricing`, content: `What you see is what you pay. No hidden fees, no surprises at checkout.` },
  { Icon: FiCompass, title: `One team, every detail`, content: `Hotels, transfers, packages and visas, planned together in one place.` },
  { Icon: FiMessageCircle, title: `Real people, real support`, content: `Questions before or during your trip? Our team is a message away.` },
]

const VisaPoints = [
  `Tourist, business and student visas`,
  `We prepare and check your paperwork`,
  `Guidance at every step, until it's approved`,
]

function Eyebrow({ children, tone = "dark" }: { children: React.ReactNode, tone?: "dark" | "light" }) {
  return (
    <div className={`inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] ${tone === "light" ? 'text-secondary' : 'text-rose-deep'}`}>
      <span className={`h-px w-10 ${tone === "light" ? 'bg-secondary' : 'bg-rosegold'}`} /> {children}
    </div>
  )
}

export default function LandingIndex() {
  const autoplay = useRef(Autoplay({ delay: 7000 }));

  return (
    <div className="bg-champagne">
      <Header />

      {/* ---------- Hero ---------- */}
      <section className="relative">
        <Carousel
          withIndicators
          height="max(88dvh, 640px)"
          emblaOptions={{ loop: true, align: 'start' }}
          plugins={[autoplay.current]}
          onMouseLeave={() => autoplay.current.play()}
          nextControlIcon={<FaArrowRightLong size={14} />}
          previousControlIcon={<FaArrowLeftLong size={14} />}
          classNames={{
            indicators: 'bottom-44! md:bottom-48!',
            indicator: 'h-1! w-4! rounded-full! bg-white/50! transition-all! duration-500! data-active:w-12! data-active:bg-secondary!',
            control: 'size-11! bg-white/10! border! border-white/30! text-white! backdrop-blur-md! opacity-100! hover:bg-white/25!',
            controls: 'hidden! md:flex! px-6!',
          }}
        >
          {BannerImages.map((item, index) => {
            const Heading = index === 0 ? 'h1' : 'h2'
            return (
              <Carousel.Slide key={index}>
                <div className="h-full relative overflow-hidden" style={{ background: `url(${item.image})${item.position ?? 'center'}/cover no-repeat` }}>
                  <div className="absolute inset-0 bg-linear-to-r from-primary/90 via-primary/55 to-primary/10" />
                  <div className="absolute inset-0 bg-linear-to-t from-primary/70 via-transparent to-transparent" />
                  <div className="relative h-full w-11/12 max-w-7xl mx-auto flex items-center pb-44">
                    <div className="max-w-2xl">
                      <Fade direction="up" triggerOnce cascade damping={0.12}>
                        <Eyebrow tone="light">{SiteName}<sup>&reg;</sup> &middot; {item.title}</Eyebrow>
                        <Heading className="font-display font-semibold text-white text-5xl sm:text-6xl lg:text-8xl leading-[0.95] mt-6">
                          {item.lead} <span className="italic text-secondary">{item.accent}</span>
                        </Heading>
                        <p className="text-white/80 text-base md:text-lg mt-6 max-w-lg leading-relaxed">{item.content}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-9">
                          <Linked to={item.url} className="inline-flex items-center gap-2 bg-secondary text-primary font-bold rounded-full px-7 py-3.5 hover:bg-white transition-colors">
                            Explore {item.title.toLowerCase()} <FaArrowRightLong size={13} />
                          </Linked>
                          <Linked to="/get-in-touch" className="inline-flex items-center gap-2 text-white font-semibold rounded-full px-7 py-3.5 border border-white/40 hover:bg-white/10 transition-colors">
                            Plan with us
                          </Linked>
                        </div>
                      </Fade>
                    </div>
                  </div>
                </div>
              </Carousel.Slide>
            )
          })}
        </Carousel>
      </section>

      {/* ---------- Search (HomeCard pulls itself up over the hero) ---------- */}
      <div className="relative z-10 max-w-7xl mx-auto drop-shadow-2xl">
        <HomeCard tag="home" />
      </div>

      {/* ---------- Services ---------- */}
      <section className="py-24 md:py-32">
        <div className="w-11/12 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <Eyebrow>Curated for you</Eyebrow>
            <h2 className="font-display font-semibold text-primary text-4xl md:text-6xl leading-tight mt-5">Every part of your journey, <span className="italic text-rosegold">beautifully handled</span></h2>
            <p className="text-zinc-600 text-lg mt-5">Stay, ride, explore and get your papers in order, all with one team that cares about the details.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {Services.map((item, index) => (
              <Linked to={item.url} key={index} className="group block">
                <div className="relative h-[26rem] rounded-t-[999px] rounded-b-[2rem] overflow-hidden shadow-xl shadow-primary/10">
                  <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-700" style={{ background: `url(${item.image})center/cover no-repeat` }} />
                  <div className="absolute inset-0 bg-linear-to-t from-primary via-primary/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                    <div className="text-secondary text-sm font-bold tracking-widest">0{index + 1}</div>
                    <h3 className="font-display font-semibold text-3xl mt-1">{item.title}</h3>
                    <p className="text-white/75 text-sm mt-2">{item.content}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-secondary mt-4 group-hover:gap-2 transition-all">Discover <FiArrowUpRight /></span>
                  </div>
                </div>
              </Linked>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Packages ---------- */}
      <div className="bg-white">
        <PageTrips />
      </div>

      {/* ---------- Promise ---------- */}
      <section className="bg-primary text-white relative overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[32rem] rounded-full bg-secondary/10 blur-3xl" aria-hidden />
        <div className="w-11/12 max-w-7xl mx-auto py-24 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center relative">
          <div className="relative max-w-md mx-auto lg:mx-0 w-full">
            <div className="h-[30rem] md:h-[36rem] rounded-t-[999px] rounded-b-[2.5rem] overflow-hidden ring-1 ring-secondary/40 ring-offset-8 ring-offset-primary" style={{ background: `url(/images/bgs6.jpg)center/cover no-repeat` }} />
            <div className="absolute -bottom-6 -right-2 sm:-right-8 bg-champagne text-primary rounded-2xl px-6 py-4 shadow-2xl max-w-[15rem]">
              <div className="font-display italic text-2xl leading-tight">Travel, beautifully curated.</div>
            </div>
          </div>
          <div>
            <Eyebrow tone="light">The {SiteName} promise</Eyebrow>
            <h2 className="font-display font-semibold text-4xl md:text-6xl leading-tight mt-5">Luxury is in the <span className="italic text-secondary">details</span></h2>
            <p className="text-white/70 text-lg mt-5 max-w-xl">We plan the way we'd want our own trips planned: carefully, honestly, and with you at the centre of every decision.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-9 mt-12">
              {Promises.map((item, index) => (
                <div key={index}>
                  <div className="size-12 rounded-full border border-secondary/50 text-secondary flex items-center justify-center text-lg"> <item.Icon /> </div>
                  <h3 className="font-bold text-lg mt-4">{item.title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed mt-1.5">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Travel with your circle ---------- */}
      <section className="py-24 md:py-32">
        <div className="w-11/12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <Eyebrow>Group &amp; private trips</Eyebrow>
            <h2 className="font-display font-semibold text-primary text-4xl md:text-6xl leading-tight mt-5">Made for the people <span className="italic text-rosegold">you travel with</span></h2>
            <p className="text-zinc-600 text-lg mt-5 leading-relaxed">Girls' getaways, family reunions, honeymoons or a well-earned solo escape. Join a group departure and share the cost, or let us design a private trip around you.</p>
            <div className="flex flex-wrap gap-3 mt-9">
              <Linked to="/packages?tripType=GROUP" className="inline-flex items-center gap-2 bg-primary text-white font-bold rounded-full px-7 py-3.5 hover:bg-primary/90 transition-colors">Group trips <FaArrowRightLong size={13} /></Linked>
              <Linked to="/packages?tripType=PRIVATE" className="inline-flex items-center gap-2 text-primary font-bold rounded-full px-7 py-3.5 border border-primary/25 hover:border-primary transition-colors">Private trips</Linked>
            </div>
          </div>
          <div className="lg:col-span-7 order-1 lg:order-2 relative">
            <div className="absolute -top-6 -right-6 w-2/3 h-2/3 rounded-[2.5rem] bg-blush" aria-hidden />
            <div className="relative h-80 md:h-[30rem] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/15" style={{ background: `url(/images/bgs1.jpg)center/cover no-repeat` }} />
          </div>
        </div>
      </section>

      {/* ---------- Visa ---------- */}
      <section className="bg-blush">
        <div className="w-11/12 max-w-7xl mx-auto py-24 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <Eyebrow>Visa consultation</Eyebrow>
            <h2 className="font-display font-semibold text-primary text-4xl md:text-6xl leading-tight mt-5">Your visa, <span className="italic text-rose-deep">handled with care</span></h2>
            <div className="flex flex-row items-center mt-7">
              {VisaItems.map((item, index) => {
                let flag;
                const itemCountry = ApiCountries.find(ele => ele.name.toLowerCase().includes(item))
                if (itemCountry) {
                  flag = ApiCountryFlags.find(ele => ele.name.includes(itemCountry.code.toLowerCase()))
                }
                if (flag) return (
                  <img src={flag.data} key={index} alt={item} className="block hover:z-20! hover:-translate-y-1.5 transition-all size-11 rounded-full object-cover border-[3px] border-blush -mr-3 shadow-md" style={{ zIndex: (VisaItems.length - index) }} />
                )
              })}
            </div>
            <p className="text-zinc-700 text-lg mt-7 leading-relaxed">Planning a trip abroad but overwhelmed by the visa process? Our experienced team guides you through every step, making sure your application is complete, accurate and on time, so you can focus on the trip itself.</p>
            <ul className="mt-7 space-y-3">
              {VisaPoints.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-primary font-semibold">
                  <span className="size-6 rounded-full bg-primary text-secondary flex items-center justify-center text-xs shrink-0"><FiCheck /></span> {item}
                </li>
              ))}
            </ul>
            <Linked to="/visa" className="inline-flex items-center gap-2 bg-primary text-white font-bold rounded-full px-7 py-3.5 mt-10 hover:bg-primary/90 transition-colors">Let's get you started <FaArrowRightLong size={13} /></Linked>
          </div>
          <div className="relative max-w-lg mx-auto w-full">
            <div className="h-[28rem] md:h-[34rem] rounded-t-[999px] rounded-b-[2.5rem] overflow-hidden shadow-2xl shadow-primary/20" style={{ background: `url(/images/bg7.jpg)center/cover no-repeat` }} />
            <div className="absolute top-10 -left-4 sm:-left-10 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3">
              <div className="size-10 rounded-full bg-secondary/30 text-primary flex items-center justify-center"><FiShield /></div>
              <div>
                <div className="text-xs text-zinc-500">Visa applications</div>
                <div className="font-bold text-primary">Expert-checked</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Journal ---------- */}
      <BlogComponent />

      {/* ---------- Visit us ---------- */}
      <section className="pb-24 md:pb-32">
        <div className="w-11/12 max-w-7xl mx-auto">
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/10 bg-white">
            <iframe title={`${SiteName} office location`} src="https://www.google.com/maps/embed?pb=!1m23!1m12!1m3!1d126868.99310104913!2d3.4315040541299466!3d6.438202397586209!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m8!3e6!4m0!4m5!1s0x103bf7d79d4cf8ef%3A0xca074d65da8ec0fa!2sKm%2018%2C%20Km%2018%20Lekki%20-%20Epe%20Expy%2C%20Lekki%20Penninsula%20II%2C%20Lekki%20101502%2C%20Lagos!3m2!1d6.4381889!2d3.5139053!5e0!3m2!1sen!2sng!4v1760489546496!5m2!1sen!2sng" className="w-full h-[28rem] md:h-[32rem] block grayscale-[35%]" style={{ border: 0 }} allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            <div className="md:absolute md:top-8 md:left-8 bg-white md:rounded-3xl p-7 md:shadow-2xl md:max-w-sm">
              <Eyebrow>Visit us</Eyebrow>
              <h2 className="font-display font-semibold text-primary text-3xl md:text-4xl mt-3">Come say hello</h2>
              <div className="mt-5 space-y-3 text-sm text-zinc-700">
                <div className="flex items-start gap-3"><FiMapPin className="shrink-0 mt-0.5 text-rose-deep" /> {SiteAddress}</div>
                <a href={`mailto:${SiteEmail}`} className="flex items-center gap-3 hover:text-rose-deep transition-colors"><FiMail className="shrink-0 text-rose-deep" /> {SiteEmail}</a>
              </div>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SiteAddress)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-6 text-sm font-bold text-primary border-b-2 border-secondary pb-0.5 hover:gap-3 transition-all">Get directions <FiArrowUpRight /></a>
            </div>
          </div>
        </div>
      </section>

      <Socials />
      <Footer />
    </div>
  )
}
