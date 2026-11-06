
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import { ApiCountries, ApiCountryFlags } from "./general/ApiCountries";
import type { discountProps, transferOrder } from "global";
import { Bill, Book1, Box, Building, Chart, Chart2, Coin, Document, DocumentText, Flag, Gift, Global, Home2, Lock, Notification, People, ReceiptSearch, Setting2, Share, Tag, TicketDiscount, Wifi } from "iconsax-reactjs";
import parse from 'html-react-parser'
import { getAlert } from "~/services/get-alert";
import dayjs from "dayjs";


export const dateFormat = 'YYYY-MM-DD';
export const monthFormat = 'MMMM';
export const SiteName = "HolidayWaka"
export const SiteContact = "+2349166691541"
export const SiteAddress = "6th Floor, Spacepad Building, opposite Ologolo Bustop. Lekki Peninsula ll, Lagos"
export const SiteLink = "holidaywaka.com"
export const SiteEmail = "info@holidaywaka.com"
export const SiteFacebook = "https://www.facebook.com/share/19uEESnpZd/?mibextid=wwXIfr"
export const ClientNaira = "₦"
export const MediaType = ['IMAGE', 'VIDEO']
export const TokenName = "hw_25"
export const LocalStorageName = "hw_25"

export function humanDateFormat(date: string | null): string {
    if (date) return dayjs(new Date(date)).format("DD MMM YYYY")
    return ""
}


export const modalStyle = {
    body: { padding: 0 },
    content: { borderRadius: '1.2rem', overflow: 'hidden' },
}

/** Drawers scroll inside their content panel, so it must not clip overflow like modalStyle does */
export const drawerStyle = {
    body: { padding: 0 },
    content: { borderRadius: '1.2rem', overflowY: 'auto' as const },
}

export const normalizeString = (str: string) => str?.trim().toLowerCase().replace(/\s+/g, ' ');


export function humanDateTimeFormat(date: string | null): string {
    if (date) return dayjs(new Date(date)).format("DD MMM YYYY hh:mm A")
    return ""
}

export const ProcessingText = `Kindly hold on why we process your request`

export async function CopyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        getAlert(`Copied`, 'success')
    } catch (error) {
        getAlert(`${(error as Error).message}`, 'error')
    }
}

export const TripTypeOptions = {
    group: "GROUP",
    private: "PRIVATE",
}
export const VisaItems = [
    "kenya",
    "uganda",
    "tanzania",
    "qatar",
    "morocco",
    "vietnam",
    "east africa",
    "other"
];

export const EXCLUDED_PAGES = [
    '/admin-portal',
    '/visa',
    '/login',
    '/blogs',
    '/get-in-touch',
    '/packages',
    '/transfer-search',
    '/transfers',
    '/upload-payment',
    '/upload-submission',
    '/hotels',
    '/hotel-page',
    '/hotel-search',
]

export const PickupOptions = {
    TRANSFER: "transfer",
    CHAUFFEUR: "chauffeur"
}
export const TransferOptionType = {
    single: {
        title: "Single",
        content: 'Single Trip'
    },
    return: {
        title: "Return",
        content: 'Return Trip'
    },
}


export const BackToTop = () => {
    const body = document.documentElement
    body.scrollTo({ top: 0, behavior: 'smooth' });
}

export function IsaNumber(price: string) {
    return isNaN(parseFloat(price || '')) ? price : `${ClientNaira}${parseFloat(price || '')?.toLocaleString()}`
}

export function GetCountryFlag(country: string) {
    if (country) {
        let flag;
        const itemCountry = ApiCountries.find(ele => ele.name?.toLowerCase() === String(country).trim()?.toLowerCase())
        if (itemCountry) {
            flag = ApiCountryFlags.find(ele => ele.name?.toLowerCase() === itemCountry.code.toLowerCase())
        }
        if (flag) return flag.data
    }
}

export const SideLinks2 = [
    {
        title: 'home',
        url: '/admin-portal/home',
        key: '/admin-portal/home',
        Icon: Home2,
        links: []
    },
    {
        title: 'insights',
        url: '/admin-portal/analytics',
        key: '/admin-portal/analytics',
        Icon: Chart,
        links: []
    },
    {
        title: 'transactions',
        url: '/admin-portal/transactions',
        key: '/admin-portal/transactions',
        Icon: Chart2,
        links: []
    },
    {
        title: 'packages',
        url: '/admin-portal/packages/all-packages',
        key: '/admin-portal/packages/all-packages',
        Icon: Gift,
        links: []
    },
    {
        title: 'package-enquiries',
        url: '/admin-portal/packages/trip-enquiries',
        key: '/admin-portal/packages/trip-enquiries',
        Icon: Box,
        links: []
    },
    {
        title: 'transfers',
        url: '/admin-portal/transfers/all-transfers',
        key: '/admin-portal/transfers/all-transfers',
        Icon: Tag,
        links: []
    },
    {
        title: 'hotel-bookings',
        url: '/admin-portal/hotels/bookings',
        key: '/admin-portal/hotels/bookings',
        Icon: Building,
        links: []
    },
    {
        title: 'hotel-content',
        url: '/admin-portal/hotels/content',
        key: '/admin-portal/hotels/content',
        Icon: Building,
        links: []
    },
    {
        title: 'vouchers',
        url: '/admin-portal/vouchers',
        key: '/admin-portal/vouchers',
        Icon: TicketDiscount,
        links: []
    },
    {
        title: 'visa-enquiries',
        url: '/admin-portal/visa-enquiries',
        key: '/admin-portal/visa-enquiries',
        Icon: Global,
        links: []
    },
    {
        title: 'visa-countries',
        url: '/admin-portal/visa-countries',
        key: '/admin-portal/visa-countries',
        Icon: Flag,
        links: []
    },
    {
        title: 'blog',
        url: '/admin-portal/blogs/all-blogs',
        key: '/admin-portal/blogs/all-blogs',
        Icon: Bill,
        links: []
    },
    {
        title: 'newsLetter-subscriptions',
        url: '/admin-portal/marketing/subscriptions',
        key: '/admin-portal/marketing/subscriptions',
        Icon: Book1,
        links: []
    },
    {
        title: 'social',
        url: '/admin-portal/marketing/admin-socials',
        key: '/admin-portal/marketing/admin-socials',
        Icon: Wifi,
        links: []
    },
    {
        title: 'docs',
        url: '/admin-portal/docs',
        key: '/admin-portal/docs',
        Icon: DocumentText,
        links: []
    },
    {
        title: 'contacts',
        url: '/admin-portal/marketing/contacts',
        key: '/admin-portal/marketing/contacts',
        Icon: People,
        links: []
    },
    {
        title: 'markup',
        url: '/admin-portal/markup',
        key: '/admin-portal/markup',
        Icon: Coin,
        links: []
    },
    {
        title: 'rates',
        url: '/admin-portal/rates',
        key: '/admin-portal/rates',
        Icon: Flag,
        links: []
    },
    {
        title: 'account',
        url: '/admin-portal/business-account',
        key: '/admin-portal/business-account',
        Icon: ReceiptSearch,
        links: []
    },
    {
        title: 'notifications',
        url: '/admin-portal/notifications',
        key: '/admin-portal/notifications',
        Icon: Notification,
        links: []
    },
    {
        title: 'password',
        url: '/admin-portal/my-password',
        key: '/admin-portal/my-password',
        Icon: Lock,
        links: []
    },
    {
        title: 'profile',
        url: '/admin-portal/admin-profile',
        key: '/admin-portal/admin-profile',
        Icon: Setting2,
        links: []
    }
]

export const SideLinks = [
    {
        title: 'MAIN',
        sub: [
            {
                title: 'Home',
                url: '/admin-portal/home',
                key: '/admin-portal/home',
                Icon: Home2,
                links: []
            },
            {
                title: 'Insights',
                url: '/admin-portal/analytics',
                key: '/admin-portal/analytics',
                Icon: Chart,
                links: []
            },
            {
                title: 'Transactions',
                url: '/admin-portal/transactions',
                key: '/admin-portal/transactions',
                Icon: Chart2,
                links: []
            },
            {
                title: 'Vouchers',
                url: '/admin-portal/vouchers',
                key: '/admin-portal/vouchers',
                Icon: TicketDiscount,
                links: []
            }
        ],
    },
    {
        title: 'TRAVEL',
        sub: [
            {
                title: 'Hotels',
                url: false,
                Icon: Building,
                key: '/admin-portal/hotels',
                links: [
                    {
                        title: 'Bookings',
                        url: 'bookings'
                    },
                    {
                        title: 'Content sync',
                        url: 'content'
                    }
                ]
            },
            {
                title: 'Packages',
                url: false,
                Icon: Gift,
                key: '/admin-portal/packages',
                links: [
                    {
                        title: 'Packages',
                        url: 'all-packages'
                    },
                    {
                        title: 'New Package',
                        url: 'new'
                    },
                    {
                        title: 'Enquiries',
                        url: 'trip-enquiries'
                    }
                ]
            },
            {
                title: 'Transfers',
                url: false,
                Icon: Tag,
                key: '/admin-portal/transfers',
                links: [
                    {
                        title: 'All Transfers',
                        url: 'all-transfers'
                    }
                ]
            },
            {
                title: 'Visa',
                url: false,
                Icon: Global,
                key: '/admin-portal/visa',
                links: [
                    {
                        title: 'Enquiries',
                        url: 'visa-enquiries'
                    },
                    {
                        title: 'Countries',
                        url: 'visa-countries'
                    }
                ]
            },
        ],
    },
    {
        title: 'CONTENTS',
        sub: [
            {
                title: 'Marketing',
                url: false,
                Icon: Share,
                key: '/admin-portal/marketing',
                links: [
                    {
                        title: 'NewsLetters',
                        url: 'subscriptions'
                    },
                    {
                        title: 'Social',
                        url: 'admin-socials'
                    },
                    {
                        title: 'Contacts',
                        url: 'contacts'
                    },
                ]
            },
            {
                title: 'Blog',
                url: false,
                key: '/admin-portal/blogs',
                Icon: Bill,
                links: [
                    {
                        title: 'All Blogs',
                        url: 'all-blogs'
                    },
                    {
                        title: 'New Blog',
                        url: 'new'
                    },
                ]
            },
            {
                title: 'Docs',
                url: false,
                key: '/admin-portal/docs',
                Icon: DocumentText,
                links: []
            },
        ],
    },
    {
        title: 'SYSTEMS',
        sub: [
            {
                title: 'Markup',
                Icon: Coin,
                key: '/admin-portal/markup',
                url: false,
                links: []
            },
            {
                title: 'Rates',
                Icon: Flag,
                key: '/admin-portal/rates',
                url: false,
                links: []
            },
            {
                title: 'Account',
                Icon: ReceiptSearch,
                key: '/admin-portal/business-account',
                url: false,
                links: []
            },
            {
                title: 'Notifications',
                key: '/admin-portal/notifications',
                Icon: Notification,
                url: false,
                links: []
            },
            {
                title: 'Password',
                key: '/admin-portal/my-password',
                Icon: Lock,
                url: false,
                links: []
            },
            {
                title: 'Profile',
                key: '/admin-portal/admin-profile',
                Icon: Setting2,
                url: false,
                links: []
            },
        ],
    },
]

export const HeaderLinks = [
    { title: `Hotels`, url: `/hotels`, show: true },
    { title: `Transfers`, url: `/transfers`, show: true },
    { title: `Holiday packages`, url: `/packages`, show: true },
    { title: `Visa`, url: `/visa`, show: true },
    { title: `Our Blogs`, url: `/blogs`, show: true },
    { title: `Get in touch`, url: `/get-in-touch`, show: true },
]

export const HeaderLinks2 = [
    { title: `Login`, url: `/login` },
]


export const SocialLinksOptions = {
    instagram: "INSTAGRAM",
    tiktok: "TIKTOK",
    facebook: "FACEBOOK",
    whatsapp: "WHATSAPP",
}

export const clientVerificationTags = {
    registration: "REGISTRATION",
    forgot_password: "FORGOT-PASSWORD"
}

export const SocialsOptions = [
    {
        Icon: FaInstagram,
        url: '',
        delay: 10,
        styles: `bg-pink-500 text-white border-2 border-white shadow-xl rounded-full p-2 text-2xl`,
        tag: 'INSTAGRAM'
    },
    {
        Icon: FaTiktok,
        url: '',
        delay: 100,
        styles: `bg-black text-white border-2 border-white shadow-xl rounded-full p-2 text-2xl`,
        tag: 'TIKTOK'
    },
    {
        Icon: FaFacebookF,
        url: '',
        delay: 190,
        styles: `bg-blue-500 text-white border-2 border-white shadow-xl rounded-full p-2 text-2xl`,
        tag: 'FACEBOOK'
    },
    {
        Icon: FaWhatsapp,
        url: '',
        delay: 280,
        styles: `bg-teal-500 text-white border-2 border-white shadow-xl rounded-full p-2 text-2xl`,
        tag: 'WHATSAPP'
    },
]

export function displayDiscount(value: number | undefined | string, type: discountProps): string {
    const isType = type?.toUpperCase() ?? "FIXED"
    return `${isType === "FIXED" ? ClientNaira : ''}${(Number(value) ?? 0).toLocaleString()}${isType === "PERCENTAGE" ? '%' : ''}`
}

export function reverseDiscount(amt: string, discountValue: string) {
    const discounted = parseFloat(discountValue)
    const amount = Number(amt)
    const original = Math.ceil(amount / (1 + discounted / 100));
    return original;
}

export function displayTransferPriceWithoutService(services: transferOrder["trips"], price: number) {
    let servicePrices = 0
    services?.map((ele: any) => {
        return servicePrices += ele.price
    })
    return price - servicePrices
}

export function sumServicesTotal(services: transferOrder["trips"]) {
    let servicePrices = 0
    services?.map((ele: any) => {
        return servicePrices += ele.price
    })
    return servicePrices
}


// Blog articles: structure-focused toolbar. No image button: Quill embeds images as base64,
// which would overflow the TEXT column; posts have a cover image instead.
export const BlogEditorModules = {
    toolbar: [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote', 'link'],
        [{ 'align': [] }],
        ['clean'],
    ],
}
// Formats the blog page knows how to style; anything else (fonts, colours, pasted images) is dropped on paste
export const BlogEditorFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'blockquote', 'link', 'align']

export const EditorModules = {
    toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        ['link', 'image'],

        // [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],

        [{ 'size': ['small', false, 'large', 'huge'] }],
        // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],

    ],
}
export const AllMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];


export const TransferOptions = [
    {
        title: 'airport',
    },
    // {
    //     title: 'railway'
    // }
]

export function getStatus(status: string) {
    if (status.toLowerCase() === 'active') return `bg-green-100 text-green-600 font-medium text-xs`
    return `bg-red-100 text-red-600 font-medium text-xs`
}
export function normalizeSpaces(desc: string) {
    return parse(desc)
}

export const Months = ["all", "January", 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']


export const ClientTransactionStatusOptions = {
    pending: "PENDING",
    paid: "PAID",
    part_paid: "PART_PAID",
    submitted: "SUBMITTED",
    unpaid: "UNPAID",
    declined: "Declined"
}


export function displaysTiming() {
    const keys = ['00', '15', '30', '45'];
    const indexValues = [];

    for (let hour = 0; hour < 24; hour++) {
        for (const minute of keys) {
            indexValues.push(
                `${hour.toString().padStart(2, '0')}:${minute}`
            );
        }
    }

    return indexValues
}