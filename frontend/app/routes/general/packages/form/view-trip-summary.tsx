import type { tripInfoProps } from 'global'
import React from 'react'
import { BsPeople } from 'react-icons/bs'


type props = {
    info: tripInfoProps | undefined
}
export default function ViewTripSummary({info}: props) {
    const totalPassengers = info?.form?.travelers?.length ?? 0;
    const totalPayment = info?.form?.travelers?.reduce((acc, curr) => acc + Number(curr.priceAmount), 0) || 0

    return (
        <div className='bg-white border border-slate-200 p-4 md:rounded-lg mb-3'>

            <div className="text-right font-bold p-2 text-gray-500">Package Info</div>

            <div className="grid grid-cols-2 gap-3 px-3 py-1 wrap-break-word text-sm">
                <div className="">Package</div>
                <div className="text-right font-semibold">{info?.package?.title}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 px-3 py-1 wrap-break-word text-sm">
                <div className="">Travel Date</div>
                <div className="text-right font-semibold">{info?.form?.travelDate}</div>
            </div>

            <div className="text-right font-bold p-2 text-gray-500">Contact Info</div>
            <div className="grid grid-cols-2 gap-3 px-3 py-1 wrap-break-word text-sm">
                <div className="">Email</div>
                <div className="text-right font-semibold">{info?.form?.travelers?.[0]?.email}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 px-3 py-1 wrap-break-word text-sm">
                <div className="">Contact</div>
                <div className="text-right font-semibold">{info?.form?.travelers?.[0]?.phoneCode}{info?.form?.travelers?.[0]?.phone}</div>
            </div>
           {info?.form?.message && <div className="grid grid-cols-2 gap-3 px-3 py-1 wrap-break-word text-sm">
                <div className="">Enquiry message</div>
                <div className="text-right font-semibold">{info?.form?.message}</div>
            </div>}

            <div className="text-right font-bold p-2 text-gray-500">Travelers Info</div>
            {Number(info?.form?.travelers?.length) > 0 && info?.form?.travelers?.map((item, index) => (
                <div className="" key={index}>
                    <div className="grid grid-cols-2 gap-3 px-3 py-1 wrap-break-word text-sm">
                        <div className="">{item.tag}</div>
                        <div className="text-right font-semibold">{item.firstName} {item.lastName}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 px-3 py-1 wrap-break-word text-sm">
                        <div className="">Price @ </div>
                        <div className="text-right font-semibold">{info?.package?.symbol}{Number(item.priceAmount)?.toLocaleString()}</div>
                    </div>
                </div>
            ))}
            <div className="grid grid-cols-2 gap-3 px-3 py-1 wrap-break-word text-sm border-t-2 border-dashed border-gray-300 pt-1 mt-1">
                <div className="flex items-center gap-1"><BsPeople /> : <b>{totalPassengers}</b> </div>
                <div className="text-right font-semibold">Total: <b>{info?.package?.symbol}{totalPayment?.toLocaleString()}</b></div>
            </div>
            
        </div>
    )
}
