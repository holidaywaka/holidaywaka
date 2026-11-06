import type { transferOrder } from 'global'
import React from 'react'
import Formbutton from '~/components/general/Formbutton'
import { Apis, Posturl } from '~/services/apis'
import { getAlert } from '~/services/get-alert'

type componentProps = {
    close: () => void
    onClose: () => void
    title?: string
    data: transferOrder
    refetch: () => void
    readOnly: boolean
}

export default function CancelTransferOrder(props: componentProps) {
    const [loading, setLoading] = React.useState(false)
    const [screen, setScreen] = React.useState(1)

    async function Action() {
        try {
            setLoading(true)
            const response = await Posturl(Apis.iway.check_cancellation, { order_id: props.data?.order_id })
            getAlert(`${response.message}, ${response.data.status} and your fine is ${response.data?.fine}`, "success")
            setScreen(2)
        } catch (error) {
            getAlert(`${(error as Error).message}`, "error")
        } finally {
            setLoading(false)
        }
    }

    async function CancelAction() {
        try {
            setLoading(true)
            const response = await Posturl(Apis.iway.order_cancellation, { order_id: props.data?.order_id })
            getAlert(response.message, "success")
            props.onClose()
            props.close()
            props.refetch()
        } catch (error) {
            getAlert(`${(error as Error).message}`, "error")
        } finally {
            setLoading(false)
        }
    }

    if (screen === 1) return (
        <div>
            <div className="px-4 pb-4">
                <div className="text-center">Are you sure you want to <span className="text-red-600">Cancel</span> this order {props.data?.order_id}</div>
                <div className="w-fit ml-auto mt-5">
                    <Formbutton onClick={Action} loading={loading} title="Check Cancellation" />
                </div>
            </div>
        </div>
    )
    if (screen === 2) return (
        <div>
            <div className="px-4 pb-4">
                <div className="text-center">Kindly confirm your request to <span className="text-red-600">Cancel</span> this order {props.data?.order_id}</div>
                <div className="w-fit ml-auto mt-5">
                    <Formbutton onClick={CancelAction} loading={loading} title="Proceed to Cancellation" bg="bg-red-600 text-white" />
                </div>
            </div>
        </div>
    )

}
