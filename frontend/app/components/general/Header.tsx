import logo from "/images/logo.png"
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { useDisclosure } from '@mantine/hooks';
import { Modal } from '@mantine/core';
import { FiBookOpen, FiChevronRight, FiClipboard, FiFileText, FiMail, FiMenu, FiMessageCircle, FiUser, FiX } from 'react-icons/fi';
import { MdOutlineAirportShuttle, MdOutlineBeachAccess, MdOutlineHotel } from 'react-icons/md';
import { useSelector } from 'react-redux';
import type { RootState } from '~/store/store';
import { HeaderLinks, isProductionSite } from '../utils';
import ContactForm from './ContactForm';
import Linked from './Linked';

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'
const iconButton = `size-10 inline-flex items-center justify-center rounded-full text-primary hover:bg-primary/[0.07] transition-colors cursor-pointer ${focusRing}`

// Icon + one-line description per section, used by the slide-in menu
const LINK_META: Record<string, { Icon: React.ComponentType<{ className?: string }>; detail: string }> = {
    '/hotels': { Icon: MdOutlineHotel, detail: 'Stays worldwide at our rates' },
    '/transfers': { Icon: MdOutlineAirportShuttle, detail: 'Airport rides and chauffeurs' },
    '/packages': { Icon: MdOutlineBeachAccess, detail: 'Private and group holidays' },
    '/visa': { Icon: FiFileText, detail: 'Applications handled for you' },
    '/blogs': { Icon: FiBookOpen, detail: 'Guides and travel stories' },
    '/get-in-touch': { Icon: FiMessageCircle, detail: 'Talk to our travel team' },
}

/** Desktop nav: a soft pill glides to whichever link is hovered or focused; the current page gets a sand underline */
function DesktopNav({ links, isActive }: { links: { title: string; url: string }[]; isActive: (url: string) => boolean }) {
    const navRef = useRef<HTMLElement>(null)
    const [pill, setPill] = useState<{ left: number; width: number; visible: boolean }>({ left: 0, width: 0, visible: false })

    function moveTo(element: HTMLElement) {
        const nav = navRef.current
        if (!nav) return
        const navBox = nav.getBoundingClientRect()
        const box = element.getBoundingClientRect()
        setPill({ left: box.left - navBox.left, width: box.width, visible: true })
    }
    const hide = () => setPill((current) => ({ ...current, visible: false }))

    return (
        <nav ref={navRef} aria-label="Main" onMouseLeave={hide} className="relative hidden lg:flex items-center flex-1 justify-center min-w-0">
            <span aria-hidden
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 h-10 rounded-full bg-primary/[0.07] transition-all duration-300 ease-out motion-reduce:transition-none ${pill.visible ? 'opacity-100' : 'opacity-0'}`}
                style={{ left: pill.left, width: pill.width }} />
            {links.map((item) => {
                const active = isActive(item.url)
                return (
                    <Linked key={item.url} to={item.url}
                        onMouseEnter={(event) => moveTo(event.currentTarget)}
                        onFocus={(event) => moveTo(event.currentTarget)}
                        onBlur={hide}
                        aria-current={active ? 'page' : undefined}
                        className={`relative z-10 inline-flex items-center h-10 px-3 xl:px-4 rounded-full text-[0.92rem] xl:text-[0.95rem] font-semibold whitespace-nowrap transition-colors duration-200 ${focusRing} ${active ? 'text-primary' : 'text-zinc-600 hover:text-primary'}`}>
                        {item.title}
                        <span aria-hidden className={`absolute left-3 right-3 xl:left-4 xl:right-4 bottom-0.5 h-0.5 rounded-full bg-secondary origin-center transition-transform duration-300 ${active ? 'scale-x-100' : 'scale-x-0'}`} />
                    </Linked>
                )
            })}
        </nav>
    )
}

/** Slide-in panel for screens narrower than the desktop nav */
function MenuPanel({ open, onClose, links, isActive, showManage, onContact }: {
    open: boolean
    onClose: () => void
    links: { title: string; url: string }[]
    isActive: (url: string) => boolean
    showManage: boolean
    onContact: () => void
}) {
    const panelRef = useRef<HTMLDivElement>(null)

    // Esc closes; the page behind doesn't scroll; focus moves into the panel
    useEffect(() => {
        if (!open) return
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        const overflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const frame = requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('a, button')?.focus({ preventScroll: true }))
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = overflow
            cancelAnimationFrame(frame)
        }
    }, [open, onClose])

    return (
        <div className={`lg:hidden fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
            <div onClick={onClose} className={`absolute inset-0 bg-primary/40 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
            <div ref={panelRef} id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu"
                className={`absolute right-0 top-0 h-full w-[min(22rem,88vw)] bg-white shadow-2xl flex flex-col transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none ${open ? 'translate-x-0 visible' : 'translate-x-full invisible'}`}>
                <div className="flex items-center justify-between h-16 px-5 border-b border-primary/10">
                    <img src={logo} alt="HolidayWaka" className="h-8 w-auto" />
                    <button type="button" onClick={onClose} aria-label="Close menu" className={iconButton}><FiX size={22} /></button>
                </div>

                <nav aria-label="Main menu" className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="space-y-1">
                        {links.map((item) => {
                            const active = isActive(item.url)
                            const meta = LINK_META[item.url]
                            return (
                                <li key={item.url}>
                                    <Linked to={item.url} onClick={onClose} aria-current={active ? 'page' : undefined}
                                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${focusRing} ${active ? 'bg-primary/[0.06]' : 'hover:bg-primary/[0.04]'}`}>
                                        <span className={`shrink-0 size-10 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-primary text-white' : 'bg-champagne text-rose-deep group-hover:bg-blush'}`}>
                                            {meta ? <meta.Icon className="size-5" /> : null}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className={`block font-semibold ${active ? 'text-primary' : 'text-zinc-900'}`}>{item.title}</span>
                                            {meta && <span className="block text-xs text-zinc-500 truncate">{meta.detail}</span>}
                                        </span>
                                        <FiChevronRight className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${active ? 'text-primary' : 'text-zinc-300'}`} aria-hidden />
                                    </Linked>
                                </li>
                            )
                        })}
                    </ul>

                    {showManage && (
                        <Linked to="/manage-booking" onClick={onClose}
                            className={`mt-4 flex items-center gap-3 rounded-xl border border-primary/10 px-3 py-3 hover:border-primary/25 hover:bg-primary/[0.03] transition-colors ${focusRing}`}>
                            <FiClipboard className="shrink-0 size-5 text-primary" aria-hidden />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-zinc-900">Manage a booking</span>
                                <span className="block text-xs text-zinc-500">Find your reservation or report a problem</span>
                            </span>
                        </Linked>
                    )}
                </nav>

                <div className="p-4 border-t border-primary/10 grid gap-2">
                    <Linked to="/login" onClick={onClose} className={`h-11 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-colors ${focusRing}`}>
                        <FiUser /> Sign in
                    </Linked>
                    <button type="button" onClick={() => { onClose(); onContact() }} className={`h-11 inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 text-sm font-semibold text-primary hover:bg-primary/[0.05] cursor-pointer transition-colors ${focusRing}`}>
                        <FiMail /> Contact us
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function Header() {
    const { pathname } = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)
    const closeMenu = useCallback(() => setMenuOpen(false), [])
    const [scrolled, setScrolled] = useState(false)
    const [contactOpened, { close: closeContact, open: openContact }] = useDisclosure(false)
    const { geoLocation } = useSelector((state: RootState) => state.data)
    const isProd = isProductionSite()

    // Hotels are not launched on the live site yet; dev shows them for testing
    const links = HeaderLinks.filter((item) => item.show || (item.url === '/hotels' && !isProd))
    const isActive = (url: string) => pathname === url || pathname.startsWith(`${url}/`)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Close the menu after navigating
    useEffect(() => setMenuOpen(false), [pathname])

    return (
        <>
            <Modal opened={contactOpened} onClose={closeContact} title="Contact us" centered>
                <ContactForm onSuccess={closeContact} />
            </Modal>

            <header className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md backdrop-saturate-150 transition-[box-shadow,border-color] duration-300 border-b ${scrolled ? 'border-transparent shadow-[0_10px_30px_-14px_rgba(0,39,34,0.28)]' : 'border-primary/10 shadow-none'}`}>
                <div className="w-[94%] max-w-7xl mx-auto h-16 lg:h-[4.5rem] flex items-center gap-3 xl:gap-6">
                    <Linked to="/" className={`shrink-0 rounded-md ${focusRing}`}>
                        <img src={logo} alt="HolidayWaka home" className="h-8 xl:h-9 w-auto block" />
                    </Linked>

                    <DesktopNav links={links} isActive={isActive} />

                    <div className="ml-auto lg:ml-0 flex items-center gap-0.5 xl:gap-1 shrink-0">
                        {!isProd && (
                            // Full label on wide screens, icon only where space is tight
                            <Linked to="/manage-booking" title="Manage booking" aria-label="Manage booking"
                                className={`hidden lg:inline-flex items-center gap-2 h-10 px-2.5 2xl:px-3.5 rounded-full text-[0.9rem] font-semibold whitespace-nowrap transition-colors ${focusRing} ${isActive('/manage-booking') ? 'text-primary bg-primary/[0.07]' : 'text-zinc-600 hover:text-primary hover:bg-primary/[0.07]'}`}>
                                <FiClipboard size={17} /> <span className="hidden 2xl:inline">Manage booking</span>
                            </Linked>
                        )}
                        <button type="button" onClick={openContact} aria-label="Contact us" title="Contact us" className={iconButton}>
                            <FiMail size={19} />
                        </button>
                        {geoLocation?.flag && (
                            <span className="hidden xl:inline-flex size-10 items-center justify-center" title={geoLocation?.country ? `Prices shown for ${geoLocation.country}` : undefined}>
                                <img src={geoLocation.flag} alt={geoLocation?.country ?? 'Your country'} className="size-5 rounded-full object-cover ring-1 ring-primary/10" />
                            </span>
                        )}
                        <span aria-hidden className="hidden sm:block w-px h-6 bg-primary/10 mx-1.5" />
                        <Linked to="/login" className={`hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-full border border-primary/20 text-[0.9rem] font-semibold text-primary whitespace-nowrap hover:bg-primary hover:text-white hover:border-primary transition-colors ${focusRing}`}>
                            <FiUser size={16} /> Sign in
                        </Linked>
                        <button type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label="Open menu"
                            className={`lg:hidden ${iconButton}`}>
                            <FiMenu size={22} />
                        </button>
                    </div>
                </div>
            </header>

            <MenuPanel open={menuOpen} onClose={closeMenu} links={links} isActive={isActive} showManage={!isProd} onContact={openContact} />
        </>
    )
}
