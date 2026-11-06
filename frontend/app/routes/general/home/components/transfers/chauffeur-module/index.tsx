
import React from 'react'
import { FiSearch } from 'react-icons/fi'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { PickupOptions } from '~/components/utils'
import TransferPlaceField, { type TransferPlace } from '~/routes/general/home/components/transfers/place-field'
import Formbutton from '~/components/general/Formbutton'


type componentProps = {
    origin: string
    origin2: string
    origin_id: string | null
}

export default function ChauffeurPickupModule(props: componentProps) {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [origin, setOrigin] = React.useState<TransferPlace | null>(props.origin_id ? {
        id: props.origin_id, title: props.origin, detail: props.origin2, country: '', airport: false,
    } : null)
    const [error, setError] = React.useState('')
    const [loading, setLoading] = React.useState(false)

    function handleOrigin(value: TransferPlace | null) {
        setOrigin(value)
        setError('')
    }

    function HandeSubmission() {
        if (!origin) return setError('Select a pick up location')
        setError('')

        const urlLink = `?from=${origin.id}&pickup=${PickupOptions.CHAUFFEUR}`

        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            navigate(`/transfer-search${urlLink}`)

            if (window.location.pathname.includes(`transfer-search`)) {
                queryClient.refetchQueries({
                    queryKey: [`fetch-transfer-search-info-${origin.id}-${PickupOptions.CHAUFFEUR}`]
                })
            }
        }, 2000)
    }

    return (
        <div>
            <div className="pt-5 pb-12">
                <TransferPlaceField
                    mode="place"
                    label="Pick up from"
                    placeholder="Where should your driver meet you?"
                    value={origin}
                    onChange={handleOrigin}
                    error={error}
                />
            </div>
            <div className="w-full max-w-60 mx-auto absolute -bottom-5 left-0 right-0">
                <Formbutton loading={loading} onClick={HandeSubmission} title="SEARCH" Icon={FiSearch} bg="!py-4 bg-primary text-white" />
            </div>
        </div>
    )
}
