
import Formbutton from "../../../components/general/Formbutton"
import { modalStyle, SocialLinksOptions } from "../../../components/utils"
import { SlTrash } from "react-icons/sl"
import { MdOutlineTipsAndUpdates } from "react-icons/md"
import { PiX } from "react-icons/pi"
import { useDisclosure } from "@mantine/hooks"
import { useState } from "react"
import { Modal } from "@mantine/core"
import { useForm } from "@mantine/form"
import NewForminput from "../../../components/general/NewForminput"

import type { deleteLayoutProps, SocialsProps } from "global"
import { createResponse, NewApis } from "~/services/new-apis"
import { getAlert } from "~/services/get-alert"

const StatsOptions = [
    {label: "Active", value: 'true'},
    {label: "Inactive", value: 'false'},
]


type componentProps = {
    close: () => void
    title?: string
    isDelete?: deleteLayoutProps | null
    data: SocialsProps
    refetch: () => void
    readOnly: boolean
}

export default function SocialsModal(props: componentProps) {
    const [dups, setDups] = useDisclosure(false)
    const [stats, setStats] = useDisclosure(false)
    const [loading, setLoading] = useState(false)
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            tag: props.data?.tag || '',
            link: props.data?.link || '',
            status: props.data?.status || StatsOptions[0].value,
        },
        validate: {
            tag: value => !value ? 'Tag is required' : null,
            link: value => !value ? 'Link is required' : null,
            status: value => !value ? 'Status is required' : null,
        }
    })

    async function HandleMainSubmission(values: typeof form.values) {
        try {
            const isId = props.data?.id
            const response = await createResponse({
                endpoint: `${NewApis.socials.socials}${isId ? `/${isId}` : ''}`,
                method: isId ? "PUT" : "POST",
                data: values
            })
            getAlert(response.message, 'success')
            props.close()
            props.refetch()
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }

    async function HandleSubmission(values: typeof form.values) {
        try {
            setLoading(true)
            const isId = props.data?.id
            const response = await createResponse({
                endpoint: `${NewApis.socials.socials}/${isId}`,
                method: "PUT",
                data: values
            })
            getAlert(response.message, 'success')
            setDups.close()
            props.close()
            return props.refetch();
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
                endpoint: `${NewApis.socials.socials}/${props.data?.id}`,
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
                    <div className="w-fit ml-auto mt-4">
                        <Formbutton loading={loading} title="Continue to update" />
                    </div>
                </form>
            </Modal>
            <Modal onClose={setDups.close} opened={dups} styles={modalStyle}>
                <div className="text-center">Are you sure you want to <span className="text-red-600">delete</span> this social contact</div>
                <div className="w-fit ml-auto mt-4 pb-4 px-4">
                    <Formbutton onClick={handleDeleteAction} loading={loading} title="Yes, Delete" />
                </div>
            </Modal>
            <div className="flex items-center justify-between p-4">
                <div className="uppercase">{props.data?.tag ?? 'Social'} contact</div>
                <div className="flex items-center justify-end gap-4">
                    {props.data?.id && <>
                        <div onClick={() => setDups.open()} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-red-600 border-red-600 rounded-md" title="Duplicate Trip"> <SlTrash /> </div>
                        <div onClick={() => setStats.open()} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-green-600 border-green-600 rounded-md" title="Update Trip Status"> <MdOutlineTipsAndUpdates /> </div>
                    </>}
                    <div onClick={props.close} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-slate-600 border-slate-600 rounded-md" title="Close Modal"> <PiX /> </div>
                </div>
            </div>
            <form onSubmit={form.onSubmit(HandleMainSubmission)} className="p-4">
                <NewForminput
                    {...form.getInputProps("link")}
                    error={form.errors.link?.toString() || ''}
                    content="Social media link"
                />
                {!props.data?.id && <NewForminput
                    {...form.getInputProps("tag")}
                    error={form.errors.tag?.toString() || ''}
                    content="Tag"
                    formtype="select"
                    options={Object.values(SocialLinksOptions)}
                />}
                <NewForminput
                    {...form.getInputProps("status")}
                    error={form.errors.status?.toString() || ''}
                    content="Status"
                    formtype="select"
                    options={StatsOptions}
                />
                <Formbutton title={props.data?.id ? 'Update Contact' : 'Add Contact'} loading={form.submitting} />
            </form>
        </div>
    )
}
