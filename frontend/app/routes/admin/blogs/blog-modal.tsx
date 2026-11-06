

import { useState } from 'react'
import { SlPencil, SlTrash } from 'react-icons/sl'
import { modalStyle } from '../../../components/utils'
import Markdown from '~/components/general/Markdown'
import { PiX } from 'react-icons/pi'
import { useNavigate } from 'react-router'
import { useDisclosure } from '@mantine/hooks'
import { Modal } from '@mantine/core'
import Formbutton from '../../../components/general/Formbutton'
import { MdOutlineTipsAndUpdates } from 'react-icons/md'
import Imaged from '../../../components/general/Imaged'
import EmbedVideo from '../../../components/general/EmbedVideo'
import NewForminput from '../../../components/general/NewForminput'
import type { BlogProps } from "global"
import { useForm } from '@mantine/form'
import { createResponse, NewApis } from '~/services/new-apis'
import { getAlert } from '~/services/get-alert'


type componentProps = {
    close: () => void
    title?: string
    data: BlogProps | null | undefined
    refetch: () => void
}

const StatsOptions = [
    {label: 'Active', value: 'true'},
    {label: 'Inactive', value: 'false'},
]


export default function BlogModal(props: componentProps) {
    const navigate = useNavigate()
    const [dups, setDups] = useDisclosure(false)
    const [stats, setStats] = useDisclosure(false)
    const [loading, setLoading] = useState(false)
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            status: props.data?.status || StatsOptions[0],
            id: String(props.data?.id)
        },
        validate: {
            status: value => !value ? 'Status is required' : null
        }
    })


    async function HandleSubmission(values: typeof form.values) {
        try {
            const response = await createResponse({
                endpoint: NewApis.blogs.update,
                method: "PUT",
                data: values
            })
            getAlert(response.message, 'success')
            setDups.close()
            props.close()
            return props.refetch()
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }

    async function handleDeleteAction() {
        try {
            setLoading(true)
            const response = await createResponse({
                endpoint: `${NewApis.blogs.delete}/${props.data?.id}`,
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
        <>
            <Modal onClose={setStats.close} opened={stats} styles={modalStyle}>
                <form onSubmit={form.onSubmit(HandleSubmission)} className='px-4 pb-4'>
                    <NewForminput
                        formtype="select"
                        {...form.getInputProps("status")}
                        error={form.errors.status?.toString() || ''}
                        content="Select status"
                        options={StatsOptions}
                    />
                    <div className="w-fit ml-auto mt-5">
                        <Formbutton loading={form.submitting} title="Continue to update" />
                    </div>
                </form>
            </Modal>
            <Modal onClose={setDups.close} opened={dups} styles={modalStyle}>
                <div className="px-4 pb-4">
                    <div className="text-center">Are you sure you want to <span className="text-red-600">delete</span> this service</div>
                    <div className="w-fit ml-auto mt-5">
                        <Formbutton onClick={handleDeleteAction} loading={loading} title="Yes, Delete" />
                    </div>
                </div>
            </Modal>
            <div className='text-sm pb-20 h-[95dvh] overflow-x-hidden overflow-y-auto scrolls px-4 pt-4'>
                <div className="flex items-center justify-end mb-3 gap-4">
                    <div onClick={() => setDups.open()} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-red-600 border-red-600 rounded-md" title="Duplicate Trip"> <SlTrash /> </div>
                    <div onClick={() => setStats.open()} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-green-600 border-green-600 rounded-md" title="Update Trip Status"> <MdOutlineTipsAndUpdates /> </div>
                    <div onClick={() => navigate(`/admin-portal/blogs/edit/${props.data?.id}`)} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-blue-600 border-blue-600 rounded-md" title="Edit Trip"> <SlPencil /> </div>
                    <div onClick={props.close} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-slate-600 border-slate-600 rounded-md" title="Close Modal"> <PiX /> </div>
                </div>
                <div className="">
                    <Imaged src={props.data?.media} height="16rem" rounded={false} />
                </div>
                {props.data?.url && <div className="">
                    <EmbedVideo url={props.data?.url} />
                </div>}
                <div className="font-light">{props.data?.read} mins. read</div>
                <div className="font-semibold text-lg">{props.data?.title}</div>
                <div className="border-t border-slate-300 pt-3 mt-2"><Markdown content={props.data?.content || ''} className="text-base!" /></div>
            </div>
        </>
    )
}
