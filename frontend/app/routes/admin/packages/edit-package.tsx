
import type { TripProps } from 'global'
import dayjs from 'dayjs'
import { useParams } from 'react-router'
import AHeader from '~/components/admin/AHeader'
import TripForm from '~/routes/admin/packages/trip-form'
import type { TripFormProps } from '~/routes/admin/packages/types'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'

// The date picker works with YYYY-MM-DD strings; stored values may carry a time part
const toDateValue = (value?: string) => value && dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD') : undefined

export default function EditPackagePage() {
    const { id } = useParams()

    const { data: response, isLoading } = useFetchResponse<TripProps>({
        endpoint: `${NewApis.trips.single}/${id}/NGN`
    })

    const data: TripFormProps = {
        ...response,
        startDate: toDateValue(response?.startDate),
        endDate: toDateValue(response?.endDate),
        images: response?.images?.map((ele, idx) => { return { id: idx + 1, img: ele, file: null } }),
        prices: response?.prices?.map((ele, idx) => { return { id: idx + 1, price: String(ele.price ?? ''), priceType: ele.priceType } }),
        destinations: response?.destinations?.map((ele, idx) => { return { id: idx + 1, country: ele.country, city: ele.city } }),
        inclusions: response?.inclusions?.map((ele, idx) => { return { id: idx + 1, content: ele } }),
        itineraries: response?.itineraries?.map((ele, idx) => { return { id: idx + 1, content: ele } }),
    }

    if (isLoading) return (
        <div className="text-center">Loading...</div>
    )
    if (!data?.id) return (
        <div className="text-center text-zinc-500 py-10">This package could not be loaded. It may have been deleted.</div>
    )
    return (
        <div>
            <AHeader title="Edit Package" subtitle='' />
            <div className="mt-5">
                <TripForm data={data} images={data.images ? data.images : []} />
            </div>
        </div>
    )
}
