
import { Carousel } from '@mantine/carousel';
import { useRef } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { FaArrowLeftLong, FaArrowRightLong } from 'react-icons/fa6';
import { Fade } from 'react-awesome-reveal';
import { SiteName } from '~/components/utils';
import Linked from '~/components/general/Linked';
import { Outlet } from 'react-router';
import Footer from '~/components/general/Footer'
import Header from '~/components/general/Header'
import Socials from '~/components/general/Socials'

const BannerImages = [
    { title: `Airport Transfers`, image: `/images/bg8.jpg`, content: `Reliable rides from airport to doorstep – comfort, safety, and convenience guaranteed!`, url: `/transfers` },
    { title: `Personal Trips`, image: `/images/bgs.jpg`, content: `Your journey, your way – adventure tailored just for you!`, url: `/packages?tripType=PRIVATE` },
    { title: `Group Trips`, image: `/images/bgs1.jpg`, content: `Explore together, save together – unforgettable trips with friends & family!`, url: `/packages?tripType=GROUP` },
    { title: `Visa Applications`, image: `/images/bg6.jpg`, content: `Smooth, fast, and stress-free – your visa journey starts here!`, url: `/visa` },
];

export default function layout() {
    const autoplay = useRef(Autoplay({ delay: 6000 }));
    return (
        <div className="bg-background">
            <div className="grid grid-cols-1 lg:grid-cols-7">
                <div className="lg:col-span-4 h-dvh hidden lg:block sticky top-0">
                    <Carousel
                        withIndicators
                        height="100dvh"
                        emblaOptions={{ loop: true, align: 'start' }}
                        plugins={[autoplay.current]}
                        onMouseLeave={() => autoplay.current.play()}
                        nextControlIcon={<FaArrowRightLong size={16} />}
                        previousControlIcon={<FaArrowLeftLong size={16} />}
                    >
                        {BannerImages.map((item, index) => (
                            <Carousel.Slide key={index}>
                                <div className="h-dvh" style={{ background: `url(${item.image})${index === 0 ? 'center top' : 'center'}/cover no-repeat` }}>
                                    <div className="size-full bg-linear-to-t from-primary via-primary/60 to-primary/20 flex items-end">
                                        <div className="p-12 xl:p-16 pb-20 max-w-2xl">
                                            <Fade direction="up" triggerOnce cascade damping={0.15}>
                                                <div className="inline-flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-[0.2em]">
                                                    <span className="h-px w-8 bg-secondary" /> {SiteName}<sup>&reg;</sup>
                                                </div>
                                                <h2 className="text-white font-extrabold text-5xl xl:text-6xl leading-tight mt-4">{item.title}</h2>
                                                <p className="text-white/80 text-lg mt-4">{item.content}</p>
                                                <Linked to={item.url} className="inline-flex items-center gap-2 mt-8 text-white font-semibold border border-white/40 rounded-full px-5 py-2.5 hover:bg-white hover:text-primary transition-colors">
                                                    Explore <FaArrowRightLong size={14} />
                                                </Linked>
                                            </Fade>
                                        </div>
                                    </div>
                                </div>
                            </Carousel.Slide>
                        ))}
                    </Carousel>
                </div>
                <div className="lg:col-span-3 min-h-dvh flex flex-col">
                    <div className="lg:hidden">
                        <Header />
                        <Socials />
                    </div>
                    <div className="size-fit mx-auto pt-10 hidden lg:block">
                        <Linked to="/"> <img src="/images/logo.png" alt={SiteName} className="h-11 w-auto" /> </Linked>
                    </div>
                    <div className="flex-1 flex flex-col justify-center py-8">
                        <Outlet />
                    </div>
                    <div className="hidden lg:block text-center text-xs text-zinc-400 pb-6">&copy; {new Date().getFullYear()} {SiteName}. All rights reserved.</div>
                    <div className="lg:hidden">
                        <Footer />
                    </div>
                </div>
            </div>
        </div>
    )
}
