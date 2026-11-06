import React from 'react'
import Skeleton from 'react-loading-skeleton'
import { useParams } from 'react-router'
import type { docsProps } from '~/routes/admin/docs/types'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import { seo } from '~/services/seo'
import type { Route } from './+types/docs'

export function meta({ params }: Route.MetaArgs) {
    const title = params.tag.split('-').join(' ').replace(/\b\w/g, (c) => c.toUpperCase())
    return seo({
        title,
        description: `Read HolidayWaka's ${title.toLowerCase()} for bookings, payments and travel services.`,
        path: `/docs/${params.tag.toLowerCase()}`,
    })
}

export default function generaldocs() {
    const params = useParams()
    const tag = params.tag?.split('-').join(' ')

    const { data, isLoading, refetch } = useFetchResponse<docsProps>({
        endpoint: `${NewApis.docs.tag}/${tag}`
    });

    React.useEffect(() => {
        refetch()
    }, [tag])

    if (isLoading) return (
        <div className="w-11/12 mx-auto p-5 my-10 bg-white rounded-lg">
            <Skeleton className="h-10 mb-3" width="50%" />
            <Skeleton className="h-60 mb-3" />
            <Skeleton className="h-10 mb-3" width="50%" />
            <Skeleton className="h-60 mb-3" />
            <Skeleton className="h-10 mb-3" width="50%" />
            <Skeleton className="h-60 mb-3" />
        </div>
    )
    return (
        <div className="w-11/12 mx-auto p-5 my-10 bg-white rounded-lg max-w-3xl">
            <div className="font-extrabold text-3xl mb-3">{data?.tag}</div>
            <div className="whitespace-pre-wrap">{data?.content}</div>
        </div>
    )
}
