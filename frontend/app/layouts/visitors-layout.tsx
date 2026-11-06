

import type { visacountryProps } from 'global'
import { Flag } from 'iconsax-reactjs'
import React, { useEffect } from 'react'
import { FiFlag } from 'react-icons/fi'
import { PiX } from 'react-icons/pi'
import { useDispatch } from 'react-redux'
import { Outlet, useLocation, useSearchParams } from 'react-router'
import { ApiCountryFlags } from '~/components/general/ApiCountries'
import Currencies from '~/components/general/Currencies'
import Linked from '~/components/general/Linked'
import LoadingIndicator from '~/components/general/LoadingIndicator'
import { EXCLUDED_PAGES, GetCountryFlag, LocalStorageName } from '~/components/utils'
import type { visaCountryPropsRes } from '~/routes/admin/visa/types'
import VisaFlagView from '~/routes/general/visa/visa-flag-view'
import useFetchResponse from '~/services/fetchResponse'
import { createResponse, NewApis } from '~/services/new-apis'
import { dispatchGeoLocation, dispatchVisaCountries, dispatchVisaOptions } from '~/store/reducer'

const VISA_PROMO_SEEN = "hw_visa_promo_seen"
// Storage can throw (private mode, blocked site data); the popup simply shows again in that case
function readSessionFlag(key: string) {
    try { return sessionStorage.getItem(key) === "1" } catch { return false }
}
function writeSessionFlag(key: string) {
    try { sessionStorage.setItem(key, "1") } catch { /* ignore */ }
}

type countryProps = {
    label: string
    value: string
}

type geoLocationPropsRes = {
    "ip": string
    "asn": string
    "as_name": string
    "as_domain": string
    "country_code": string
    "country": string
    "continent_code": string
    "continent": string
}

export default function VisitorsLayout() {
    const [opens, setOpens] = React.useState(false)
    const { pathname } = useLocation()
    const dispatch = useDispatch();

    const { data, isLoading } = useFetchResponse<visaCountryPropsRes>({
        endpoint: NewApis.visa.all_countries,
        onSuccess: (response: visaCountryPropsRes) => {
            const detail: countryProps[] = []
            response.data.map((item: visacountryProps) => {
                return detail.push({
                    label: `${item.country}`,
                    value: `${item.id}`
                })
            })
            dispatch(dispatchVisaOptions(detail))
            dispatch(dispatchVisaCountries(response.data))
        }
    })

    React.useEffect(() => {
        (async () => {
            const locals = JSON.parse(localStorage.getItem(LocalStorageName) ?? 'null')
            if (locals) {
                dispatch(dispatchGeoLocation(locals))
            } else {
                const result: geoLocationPropsRes = await createResponse({
                    endpoint: "",
                    origin: `https://api.ipinfo.io/lite/me?token=166a72855070bc`,
                })
                const findCurrency = Currencies.find(ele => ele.currency?.toLowerCase().includes(result.country?.toLowerCase()))
                const flag = ApiCountryFlags.find(ele => ele.name === result.country_code?.toLowerCase())
                const fields = {
                    ...result,
                    ...findCurrency,
                    flag: flag?.data
                }
                localStorage.setItem(LocalStorageName, JSON.stringify(fields))
                dispatch(dispatchGeoLocation(fields))
            }
        })()
    }, [])

    useEffect(() => {
        const DEFAULT_DURATION = 10000;
        const ROOT_PATH_DURATION = 4000;

        const shouldExclude = EXCLUDED_PAGES.some(path =>
            pathname.startsWith(path) ||
            pathname.replace(/\/$/, '') === path.replace(/\/$/, '')
        );
        // Once per browser session: it used to reopen on every navigation, even right after being closed
        if (shouldExclude || readSessionFlag(VISA_PROMO_SEEN)) return;

        const isRootPath = pathname === '/' || pathname.endsWith('/');
        const timer = setTimeout(() => {
            setOpens(true);
            writeSessionFlag(VISA_PROMO_SEEN);
        }, isRootPath ? ROOT_PATH_DURATION : DEFAULT_DURATION);

        return () => clearTimeout(timer);
    }, [pathname]);

    useEffect(() => {
        if (!opens) return
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpens(false)
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [opens])

    const height = "max-h-[50dvh]"

    if (isLoading) return <LoadingIndicator />

    return (
        <div>
            {(opens && Number(data?.data?.length) > 0) && <div onClick={() => setOpens(false)} className="fixed inset-0 hidden lg:flex items-center justify-center bg-primary/50 backdrop-blur-sm z-999 p-6">
                <div role="dialog" aria-modal="true" aria-labelledby="visa-promo-title" onClick={(event) => event.stopPropagation()} className="grid grid-cols-5 w-full max-w-4xl bg-champagne rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="col-span-2 relative" style={{ background: `url(/images/get-visa.jpg)center/cover` }}>
                        <div className="absolute inset-0 bg-linear-to-t from-primary/90 via-primary/30 to-transparent" />
                        <div className="absolute bottom-0 p-8 text-white">
                            <div className="text-secondary text-xs font-bold uppercase tracking-[0.28em]">Visa consultation</div>
                            <div className="font-display font-semibold text-4xl leading-tight mt-3">Travel further, <span className="italic text-secondary">worry less</span></div>
                        </div>
                    </div>
                    <div className="col-span-3 relative flex flex-col">
                        <button type="button" aria-label="Close" onClick={() => setOpens(false)} className="absolute top-4 right-4 size-9 rounded-full flex items-center justify-center text-lg text-primary hover:bg-blush transition-colors cursor-pointer"> <PiX /> </button>
                        <div className="px-8 pt-8 pb-4">
                            <h2 id="visa-promo-title" className="font-display font-semibold text-primary text-3xl">Where would you like to go?</h2>
                            <p className="text-sm text-zinc-500 mt-1">We currently process visas for these destinations.</p>
                        </div>
                        <div className={`${height} overflow-y-auto px-8 scrolls`}>
                            <div className="grid grid-cols-2 gap-2 pb-4">
                                {data?.data?.filter(ele => Number(ele.destinations?.length) > 0)?.map((item, index) => (
                                    <div className="rounded-xl bg-white border border-blush p-3 text-sm" key={index}>
                                        <VisaFlagView
                                            country={String(item.country)}
                                        />
                                        <div className="flex flex-wrap items-center gap-1 mt-2 ml-9">
                                            {item.destinations?.map((ele, idx) => (
                                                <div className="text-[0.65rem] py-0.5 px-2 font-semibold text-rose-deep bg-blush rounded-full" key={idx}>{ele.visaType}</div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-8 py-5 border-t border-blush mt-auto">
                            <Linked
                                onClick={() => setOpens(false)}
                                to="/visa" className="block bg-primary text-white font-bold py-3.5 px-4 rounded-full w-full text-center hover:bg-primary/90 transition-colors">Start your visa process</Linked>
                        </div>
                    </div>
                </div>
            </div>}
            <Outlet />
        </div>
    )
}
