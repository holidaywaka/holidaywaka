
import React from 'react'
import { FiSearch } from 'react-icons/fi'
import { ArrowRight } from 'iconsax-reactjs'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { PickupOptions, TransferOptionType } from '~/components/utils'
import TransferTypeOptionComponent from '~/routes/general/home/components/transfers/pickup-module/transfer-type-component'
import TransferPlaceField, { type TransferPlace } from '~/routes/general/home/components/transfers/place-field'
import Formbutton from '~/components/general/Formbutton'


type componentProps = {
    origin: string
    origin2: string
    destination: string
    destination2: string
    start_country: string | null
    origin_id: string | null
    destination_id: string | null
    transferType: string
}

export default function PickupModule(props: componentProps) {
    const queryClient = useQueryClient()
    const location = useLocation()
    const navigate = useNavigate()
    const [origin, setOrigin] = React.useState<TransferPlace | null>(props.origin_id ? {
        id: props.origin_id, title: props.origin, detail: props.origin2, country: props.start_country || '', airport: false,
    } : null)
    const [destination, setDestination] = React.useState<TransferPlace | null>(props.destination_id ? {
        id: props.destination_id, title: props.destination, detail: props.destination2, country: '', airport: false,
    } : null)
    const [transferType, setTransferType] = React.useState(props?.transferType || TransferOptionType.single.title)
    const [errors, setErrors] = React.useState<{ origin?: string; destination?: string }>({})
    const [loading, setLoading] = React.useState(false)

    function handleOrigin(value: TransferPlace | null) {
        setOrigin(value)
        // Drop off results depend on the pick up, so a new pick up needs a new drop off
        if (value?.id !== origin?.id) setDestination(null)
        setErrors({})
    }

    function handleDestination(value: TransferPlace | null) {
        setDestination(value)
        setErrors((current) => ({ ...current, destination: undefined }))
    }

    function HandeSubmission() {
        const next = {
            origin: origin ? undefined : 'Select a pick up location',
            destination: destination ? undefined : 'Select a drop off location',
        }
        if (next.origin || next.destination) return setErrors(next)
        setErrors({})

        const urlLink = `?from=${origin!.id}&to=${destination!.id}&pickup=${PickupOptions.TRANSFER}&start_country=${origin!.country}&transferType=${transferType}`

        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            navigate(`/transfer-search${urlLink}`)

            if (window.location.pathname.includes(`transfer-search`)) {
                queryClient.refetchQueries({
                    queryKey: [`fetch-transfer-search-info-${origin!.id}-${destination!.id}-${PickupOptions.TRANSFER}-${props.transferType}`]
                })
            }
        }, 2000)
    }

    return (
        <div>
            <div className="pb-12">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-start gap-2 md:gap-3 pt-5">
                    <TransferPlaceField
                        mode="origin"
                        label="Pick up"
                        placeholder="Airport, hotel or address"
                        value={origin}
                        onChange={handleOrigin}
                        error={errors.origin}
                    />
                    <div className="hidden md:flex size-9 mt-5 rounded-full bg-primary/10 text-primary items-center justify-center" aria-hidden="true">
                        <ArrowRight className="size-5" />
                    </div>
                    <TransferPlaceField
                        mode="destination"
                        label="Drop off"
                        placeholder="Where are you going?"
                        value={destination}
                        onChange={handleDestination}
                        origin={origin?.id}
                        start_country={origin?.country}
                        disabledReason={origin ? undefined : 'Choose your pick up location first'}
                        error={errors.destination}
                    />
                </div>
                {location.pathname.includes("transfer-search") && <TransferTypeOptionComponent
                    default={transferType}
                    handleTransfer={setTransferType}
                />}
            </div>
            <div className="w-full max-w-60 mx-auto absolute -bottom-5 left-0 right-0">
                <Formbutton loading={loading} onClick={HandeSubmission} title="SEARCH" Icon={FiSearch} bg="!py-4 bg-primary text-white" />
            </div>
        </div>
    )
}
