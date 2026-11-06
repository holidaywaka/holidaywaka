import React from 'react'
import { useParams } from 'react-router'
import type { singleEnquiryPropsRes } from '~/routes/general/packages/types'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import { privatePage } from '~/services/seo'

export function meta() {
    return privatePage("Package Checkout")
}

export default function packageCheckout() {
    const { id } = useParams()
    const { data, isLoading } = useFetchResponse<singleEnquiryPropsRes>({
        endpoint: `${NewApis.trips.single_enquiry}/${id}`
    })

    if (isLoading) return (
        <div className="">Loading...</div>
    )
    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-11/12 mx-auto py-10">
                <div className="">
                </div>
                <div className="">
                    payment summary
                </div>
            </div>
        </div>
    )
}
