
import Formbutton from "../../../components/general/Formbutton"
import { modalStyle } from "../../../components/utils"
import { SlTrash } from "react-icons/sl"
import { MdOutlineTipsAndUpdates } from "react-icons/md"
import { PiX } from "react-icons/pi"
import { useDisclosure } from "@mantine/hooks"
import { useState } from "react"
import { Modal } from "@mantine/core"
import { useForm } from "@mantine/form"
import NewForminput from "../../../components/general/NewForminput"
import type { deleteLayoutProps, markupProps } from "global"
import { getAlert } from "~/services/get-alert"
import { createResponse, NewApis } from "~/services/new-apis"




const DiscountTypeOptions = [
    "PERCENTAGE",
    "FIXED",
]

const StatsOptions = [
    "true",
    "false"
]


type componentProps = {
    close: () => void
    title?: string
    isDelete?: deleteLayoutProps | null
    data: markupProps
    refetch: () => void
    readOnly: boolean
    services: string[]
}

export default function MarkupModal(props: componentProps) {
    const [dups, setDups] = useDisclosure(false)
    const [stats, setStats] = useDisclosure(false)
    const [loading, setLoading] = useState(false)
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            tag: props.data?.tag ?? '',
            discountValue: props.data?.discountValue ?? '',
            vat: props.data?.vat ?? '',
            discountType: DiscountTypeOptions[0],
            status: props.data?.status ?? StatsOptions[0],
        },
        validate: {
            tag: value => !value ? 'Tag is required' : null,
            // 0 is a valid markup / VAT
            discountValue: value => value === '' || value === null || isNaN(Number(value)) ? 'Discount value is required' : null,
            vat: value => value === '' || value === null || isNaN(Number(value)) ? 'Value added tax is required' : null,
            status: value => !value ? 'Status is required' : null,
        }
    })

    async function HandleMainSubmission(values: typeof form.values) {
        try {
            const isId = props.data?.id
            const response = await createResponse({
                endpoint: `${NewApis.markups.markups}${isId ? `/${props.data?.id}` : ''}`,
                method: isId ? 'PUT' : "POST",
                data: values
            })
            getAlert(response.message, 'success')
            props.close()
            props.refetch()
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }

    async function HandleSubmission(values: { status: string }) {
        try {
            setLoading(true)
            const response = await createResponse({
                endpoint: `${NewApis.markups.markups}/${props.data?.id}`,
                method: "PUT",
                data: { status: values.status }
            })
            getAlert(response.message, 'success')
            setDups.close()
            props.close()
            return props.refetch()
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteAction() {
        try {
            setLoading(true)
            const response = await createResponse({
                endpoint: `${NewApis.markups.markups}/${props.data?.id}`,
                method: "DELETE"
            })
            getAlert(response.message, 'success')
            setDups.close()
            props.close()
            return props.refetch()
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        } finally {
            setLoading(false)
        }
    }
    return (
        <div>
            <Modal onClose={setStats.close} opened={stats} styles={modalStyle}>
                <form onSubmit={form.onSubmit(HandleSubmission)} className="px-4 pb-4">
                    <NewForminput
                        formtype="select"
                        {...form.getInputProps("status")}
                        error={form.errors.status?.toString() || ''}
                        content="Select Status"
                        options={StatsOptions}
                    />
                    <div className="w-fit ml-auto mt-3">
                        <Formbutton loading={loading} title="Continue to update" />
                    </div>
                </form>
            </Modal>
            <Modal onClose={setDups.close} opened={dups} styles={modalStyle}>
                <div className="px-4 pb-4">
                    <div className="text-center">Are you sure you want to <span className="text-red-600">delete</span> this markup</div>
                    <div className="w-fit ml-auto mt-3">
                        <Formbutton onClick={handleDeleteAction} loading={loading} title="Yes, Delete" />
                    </div>
                </div>
            </Modal>
            <div className="flex items-center justify-between p-4 border-b border-gray-300">
                <div className="uppercase">{props.title}</div>
                <div className="flex items-center justify-end gap-4">
                    {props.data?.id && <>
                        <div onClick={() => setDups.open()} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-red-600 border-red-600 rounded-md" title="Duplicate Trip"> <SlTrash /> </div>
                        <div onClick={() => setStats.open()} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-green-600 border-green-600 rounded-md" title="Update Trip Status"> <MdOutlineTipsAndUpdates /> </div>
                    </>}
                    <div onClick={close} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-slate-600 border-slate-600 rounded-md" title="Close Modal"> <PiX /> </div>
                </div>
            </div>
            <form onSubmit={form.onSubmit(HandleMainSubmission)}>
                <div className="h-fit max-h-[60dvh] overflow-y-auto overflow-x-hidden scrolls px-4 py-4">
                    <NewForminput
                        {...form.getInputProps("discountValue")}
                        error={form.errors.discountValue?.toString() || ''}
                        type="number"
                        content="Discount Value (%)"
                    />
                    {!props.data?.id && <NewForminput
                        {...form.getInputProps("tag")}
                        error={form.errors.tag?.toString() || ''}
                        content="Tag"
                        formtype="select"
                        options={props.services}
                    />}
                    <NewForminput
                        {...form.getInputProps("vat")}
                        error={form.errors.vat?.toString() || ''}
                        content="VAT (%)"
                    />
                    <NewForminput
                        {...form.getInputProps("status")}
                        error={form.errors.status?.toString() || ''}
                        content="Status"
                        formtype="select"
                        options={StatsOptions}
                    />
                </div>
                <div className="px-4 py-2 border-t border-gray-300">
                    <Formbutton title={props.data?.id ? 'Update Markup' : 'Add Markup'} loading={form.submitting} />
                </div>
            </form>
        </div>
    )
}
