import type { TripProps } from 'global'
import React from 'react'
import Formbutton from '~/components/general/Formbutton'
import ModalHeader from '~/components/general/ModalHeader'
import { getAlert } from '~/services/get-alert'
import { createResponse, NewApis } from '~/services/new-apis'

type props = {
    close: () => void
    refetch: () => void
    data: TripProps | undefined | null
}

export default function TripStatusModal(props: props) {
    const [loading, setLoading] = React.useState(false)
    const isTrue = props.data?.status === 'true'
    const status = isTrue ? 'Deactivate' : "Re-Activate"

    async function handleAction() {
        try {
            setLoading(true)
            const body = {
                status: isTrue ? 'false' : 'true'
            }
            const response = await createResponse({
                endpoint: `${NewApis.trips.update}/${props.data?.id}`,
                data: {data: JSON.stringify(body)},
                method: "PUT"
            })

            getAlert(response.message, 'success')
            props.close()
            props.refetch()
        } catch (error) {
            getAlert((error as Error).message, 'error')
        }finally {
            setLoading(false)
        }
    }
    return (
        <div>
            <ModalHeader title="" close={props.close} />
            <div className="px-4 pb-4">
                <div className="text-center">Kindly confirm your request to {status} this package</div>
                <div className="w-fit ml-auto mt-5">
                    <Formbutton onClick={handleAction} loading={loading} title="Yes, Proceed" />
                </div>
            </div>
        </div>
    )
}
