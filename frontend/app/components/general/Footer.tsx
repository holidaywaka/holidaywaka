import logo from "/images/logo.png"
import { HeaderLinks, SiteAddress, SiteEmail, SiteFacebook, SiteName, SocialLinksOptions } from "../utils"
import { SlEnvolope } from "react-icons/sl"
import Linked from "./Linked"
import { useForm } from "@mantine/form"
import { Facebook, Map, Message, Whatsapp } from "iconsax-reactjs"
import { createResponse, NewApis } from "~/services/new-apis"
import { getAlert } from "~/services/get-alert"
import useFetchResponse from "~/services/fetchResponse"
import type { docsPropsRes } from "~/routes/admin/docs/types"
import type { socialPropsRes } from "~/routes/admin/socials/types"
import type { SocialsProps } from "global"



export default function Footer() {
    const form = useForm({
        initialValues: {
            email: ''
        },
        validate: {
            email: value => !value ? 'Email address is required' : !/^\S+@\S+\.\S+$/.test(value) ? 'Enter a valid email address' : null
        }
    })

    async function HandleSubmission(values: typeof form.values) {
        try {
            const response = await createResponse({
                endpoint: NewApis.newsletters.newsletters,
                method: "POST",
                data: values
            })
            form.reset()
            getAlert(response.message, 'success')
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }

    const { data: socialsData, isLoading: isLoadingSocials } = useFetchResponse<socialPropsRes>({
        endpoint: NewApis.socials.socials,
    })

    const { data } = useFetchResponse<docsPropsRes>({
        endpoint: NewApis.docs.all
    })
    return (
        <footer>
            <div className="bg-primary text-white relative overflow-hidden">
                <div className="absolute -top-24 -right-24 size-72 rounded-full bg-secondary/10" aria-hidden />
                <div className="absolute -bottom-32 left-1/3 size-64 rounded-full bg-white/5" aria-hidden />
                <div className="w-11/12 max-w-7xl mx-auto py-14 relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <div className="text-secondary text-xs font-bold uppercase tracking-[0.2em] mb-3">Newsletter</div>
                            <h2 className="font-extrabold text-3xl md:text-4xl leading-tight">Stay inspired. Get exclusive travel deals &amp; tips.</h2>
                            <p className="text-white/70 mt-3 max-w-lg">The latest holiday packages, insider discounts and destination ideas, delivered straight to your inbox.</p>
                        </div>
                        <form onSubmit={form.onSubmit(HandleSubmission)} noValidate className="w-full max-w-xl lg:ml-auto">
                            <div className={`flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 ring-2 ${form.errors.email ? 'ring-red-400' : 'ring-transparent'}`}>
                                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                                <input
                                    id="newsletter-email"
                                    type="email"
                                    placeholder="Enter your email address"
                                    className="flex-1 min-w-0 px-4 py-3 text-primary placeholder:text-zinc-400 outline-none rounded-xl"
                                    {...form.getInputProps("email")}
                                />
                                <button
                                    type="submit"
                                    disabled={form.submitting}
                                    className="flex items-center justify-center gap-2 bg-secondary text-primary font-bold px-6 py-3 rounded-xl hover:brightness-95 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <SlEnvolope /> {form.submitting ? 'Subscribing…' : 'Subscribe'}
                                </button>
                            </div>
                            {form.errors.email ? <div className="text-red-300 text-sm mt-2 px-2">{form.errors.email}</div> :
                                <div className="text-white/50 text-xs mt-2 px-2">No spam. Unsubscribe any time.</div>}
                        </form>
                    </div>
                </div>
            </div>
            <div className='bg-white border-t border-slate-100'>
                <div className="w-11/12 max-w-7xl mx-auto pt-14 pb-24">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-5">
                            <div className="size-fit"> <Linked to="/"> <img src={logo} alt={SiteName} className="w-36 h-auto" /> </Linked> </div>
                            <p className="text-sm text-zinc-500 mt-4 max-w-sm">Hotels, airport transfers, holiday packages and visa applications, all planned and booked in one place.</p>
                            <div className="flex flex-col text-sm gap-3 mt-6 text-zinc-700">
                                {!isLoadingSocials && <DisplayContactNumber data={socialsData?.data} />}
                                <a href={`mailto:${SiteEmail}`} className="flex items-center gap-3 size-fit hover:text-secondary transition-colors"> <Message size="18" className="shrink-0" /> {SiteEmail}</a>
                                <a href={`${SiteFacebook}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 size-fit hover:text-secondary transition-colors"> <Facebook size="18" className="shrink-0" /> Facebook@HolidayWaka</a>
                                <div className="flex items-start gap-3"> <Map size="18" className="shrink-0 mt-0.5" /> <span>{SiteAddress}</span></div>
                            </div>
                        </div>
                        <div className="lg:col-span-3 lg:col-start-7">
                            <div className="font-bold text-sm uppercase tracking-wider text-zinc-400 mb-4">Explore</div>
                            <nav className="flex flex-col gap-3">
                                {HeaderLinks.map((item, index) => (
                                    <Linked to={item.url} key={index} className="capitalize size-fit text-zinc-700 hover:text-secondary transition-colors">
                                        {item.title}
                                    </Linked>
                                ))}
                            </nav>
                        </div>
                        {Number(data?.data?.length) > 0 && <div className="lg:col-span-3">
                            <div className="font-bold text-sm uppercase tracking-wider text-zinc-400 mb-4">Legal</div>
                            <nav className="flex flex-col gap-3">
                                {data?.data?.map((item, index) => (
                                    <Linked to={`/docs/${item.tag?.split(' ')?.join('-')?.toLowerCase()}`} key={index} className="capitalize size-fit text-zinc-700 hover:text-secondary transition-colors">
                                        {item.tag}
                                    </Linked>
                                ))}
                            </nav>
                        </div>}
                    </div>
                    <div className="border-t border-slate-100 mt-12 pt-6 text-xs text-zinc-400">
                        &copy; {new Date().getFullYear()} {SiteName}. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    )
}


type props = {
    data: SocialsProps[] | undefined;
}
function DisplayContactNumber(props: props) {
    const getData = props.data?.find(ele => ele.tag === SocialLinksOptions.whatsapp);
    const getNumber = getData ? getData.link?.split(".me/")[1] : null;
    if (!getData?.link) return null

    return (
        <a target="_blank" rel="noreferrer" href={getData.link} className="flex items-center gap-3 size-fit hover:text-secondary transition-colors"> <Whatsapp size="18" className="shrink-0" /> {getNumber}</a>
    )
}
