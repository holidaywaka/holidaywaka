import type { tripInfoProps } from 'global'
import React from 'react'
import { BsPeople } from 'react-icons/bs'
import { useNavigate } from 'react-router'
import Formbutton from '~/components/general/Formbutton'
import Marker from '~/components/pageComponent/Marker'
import { getAlert } from '~/services/get-alert'
import { createResponse, NewApis } from '~/services/new-apis'


type componentProps = {
    close: () => void
    info: tripInfoProps
}

export default function PackageReservationSummaryModal({ info, close }: componentProps) {
    const totalPassengers = info.form?.travelers?.length
    const [loading, setLoading] = React.useState(false)
    const navigate = useNavigate()

    async function ProceedToCheckout() {
        const formFields = {
            ...info.form,
            symbol: info.package?.symbol,
            currency: info.package?.currency,
            travelers: info.form.travelers?.map(ele => {
                return {
                    ...ele,
                    baseAmount: info.package?.prices?.find(cash => cash.price?.toString() === ele.priceAmount)?.price
                }
            }),
            tripType: info.package?.tripType,
            tripId: info.package?.id
        }

        try {
            setLoading(true)
            const response = await createResponse({
                endpoint: NewApis.trips.enquiry,
                data: formFields,
                method: "POST"
            })
            console.log(response)
            window.location.href = response.url
            // navigate(`/packages/${response.enquiry}/checkout`)
            // close()
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="text-sm! pb-5 max-h-[60dvh] overflow-y-auto scrolls">
                <Marker title="Package Info" />

                <div className="grid grid-cols-2 gap-3 px-3 py-1">
                    <div className="">Package</div>
                    <div className="text-right font-semibold">{info?.package?.title}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 px-3 py-1">
                    <div className="">Travel Date</div>
                    <div className="text-right font-semibold">{info.form?.travelDate}</div>
                </div>

                <Marker title="Contact Info" />
                <div className="grid grid-cols-2 gap-3 px-3 py-1">
                    <div className="">Email</div>
                    <div className="text-right font-semibold">{info.form?.travelers?.[0]?.email}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 px-3 py-1">
                    <div className="">Contact</div>
                    <div className="text-right font-semibold">{info.form?.travelers?.[0]?.phoneCode}{info.form?.travelers?.[0]?.phone}</div>
                </div>

                <Marker title="Travelers Info" />
                {Number(info.form?.travelers?.length) > 0 && info.form?.travelers?.map((item, index) => (
                    <div className="" key={index}>
                        <div className="grid grid-cols-2 gap-3 px-3 py-1">
                            <div className="">{item.tag}</div>
                            <div className="text-right font-semibold">{item.firstName} {item.lastName}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 px-3 py-1">
                            <div className="">Price @ </div>
                            <div className="text-right font-semibold">{info.package?.symbol}{Number(item.priceAmount)?.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
                {info.form?.message && <div className="px-3 mt-2"> <b>Message:</b> {info.form?.message}</div>}
            </div>
            <div className="px-4 py-2 grid grid-cols-2 text-sm items-center">
                <div className="">
                    <div className="flex items-center gap-2"><BsPeople /> : <b>{totalPassengers}</b> </div>
                    <div className="">Total: <b>{info.package?.symbol}{info.totalPayment?.toLocaleString()}</b> </div>
                </div>
                <div className=""><Formbutton onClick={ProceedToCheckout} loading={loading} title="Complete reservation" /></div>
            </div>
        </div>
    )
}
