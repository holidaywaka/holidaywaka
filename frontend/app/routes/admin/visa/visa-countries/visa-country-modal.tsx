

import type { deleteLayoutProps, visacountryProps } from "global"
import Formbutton from "../../../../components/general/Formbutton"
import { SlTrash } from "react-icons/sl"
import { MdOutlineTipsAndUpdates } from "react-icons/md"
import { PiX } from "react-icons/pi"
import { useDisclosure } from "@mantine/hooks"
import { useState } from "react"
import { Modal } from "@mantine/core"
import NewForminput from "../../../../components/general/NewForminput"
import { useForm } from "@mantine/form"
import { modalStyle } from "../../../../components/utils"
import Marker from "~/components/pageComponent/Marker"
import type { visacountryFormProps } from "~/routes/admin/visa/types"
import { getAlert } from "~/services/get-alert"
import { createResponse, NewApis } from "~/services/new-apis"

const StatsOptions = [
    {label: "Active", value: 'true'},
    {label: "Inactive", value: 'false'},
]


type componentProps = {
    close: () => void
    title?: string
    isDelete?: deleteLayoutProps | null
    data: visacountryFormProps
    refetch: () => void
    readOnly: boolean
}

export default function VisaCountryModal(props: componentProps) {
    const [dups, setDups] = useDisclosure(false)
    const [stats, setStats] = useDisclosure(false)
    const [loading, setLoading] = useState(false)
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            country: props.data?.country ?? '',
            fee: props.data?.fee ?? '0',
            status: props.data?.status ?? StatsOptions[0].value,
            destinations: props.data?.destinations ?? [
                {
                    id: 1,
                    visaType: '',
                    requirement: '',
                    price: '0',
                    old_price: '0'
                }
            ]
        },
        validate: {
            country: value => !value ? 'Country is requrired' : null,
            status: value => !value ? 'Status is requrired' : null,
            destinations: {
                visaType: (value) => !value ? 'Visa type is required' : null,
                price: (value) => !value ? 'Price is required' : null,
            }
        }
    })

    async function HandleMainSubmission(values: typeof form.values) {
        try {
            const isId = props.data?.id
            const response = await createResponse({
                endpoint: isId ? `${NewApis.visa.update_country}/${props.data?.id}` : NewApis.visa.visa_country,
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
            const response = await createResponse({
                endpoint: `${NewApis.visa.update_country}/${props.data.id}`,
                method: "PUT",
                data: values
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

    async function HandleDuplication() {
        try {
            setLoading(true)
            const response = await createResponse({
                endpoint: `${NewApis.visa.delete_country}/${props.data.id}`,
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
                        content="Select status"
                        options={StatsOptions}
                    />
                    <div className="w-fit ml-auto mt-5">
                        <Formbutton loading={loading} title="Continue to update" />
                    </div>
                </form>
            </Modal>
            <Modal onClose={setDups.close} opened={dups} styles={modalStyle}>
                <div className="px-4 pb-4">
                    <div className="text-center">Are you sure you want to <span className="text-red-600">delete</span> this social contact</div>
                    <div className="w-fit ml-auto mt-5">
                        <Formbutton onClick={HandleDuplication} loading={loading} title="Yes, Delete" />
                    </div>
                </div>
            </Modal>
            <div className="flex items-center justify-between px-4 pt-4">
                <div className="uppercase">Visa Information</div>
                <div className="flex items-center justify-end gap-4">
                    {props.data?.id && <>
                        <div onClick={() => setDups.open()} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-red-600 border-red-600 rounded-md" title="Duplicate"> <SlTrash /> </div>
                        <div onClick={() => setStats.open()} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-green-600 border-green-600 rounded-md" title="Update Status"> <MdOutlineTipsAndUpdates /> </div>
                    </>}
                    <div onClick={close} className="cursor-pointer hover:scale-105 transition-all hover:bg-slate-100 p-2 text-base border text-slate-600 border-slate-600 rounded-md" title="Close Modal"> <PiX /> </div>
                </div>
            </div>
            <form onSubmit={form.onSubmit(HandleMainSubmission)}>
                <div className="max-h-[75dvh] overflow-y-auto overflow-x-hidden scrolls p-4 text-sm!">
                    <NewForminput
                        {...form.getInputProps("country")}
                        error={form.errors.country?.toString() || ''}
                        content="Country"
                    />
                    <NewForminput
                        formtype="number"
                        setFieldValue={form.setFieldValue}
                        valueName="fee"
                        valueText={form.values.fee}
                        error={form.errors.fee?.toString() || ''}
                        content="fee"
                    />
                    <NewForminput
                        {...form.getInputProps("status")}
                        error={form.errors.status?.toString() || ''}
                        content="Status"
                        formtype="select"
                        options={StatsOptions}
                    />
                    <Marker title="Visa Types" />
                    <div className="">
                        {form.values.destinations.map((item, index) => (
                            <div key={item.id} className="border border-slate-300 rounded-md p-4 mb-4">
                                {index > 0 && <div className="size-fit ml-auto">
                                    <div onClick={() => form.removeListItem('destinations', index)} className="w-fit ml-auto cursor-pointer px-4 py-2 bg-red-100 rounded-md hover:bg-red-50 transition-all border border-red-200 active:scale-95 text-red-600">
                                        Remove
                                    </div>
                                </div>}
                                <NewForminput
                                    {...form.getInputProps(`destinations.${index}.visaType`)}
                                    error={form.errors[`destinations.${index}.visaType`]?.toString() || ''}
                                    content="Visa Type"
                                />
                                <NewForminput
                                    {...form.getInputProps(`destinations.${index}.requirement`)}
                                    error={form.errors[`destinations.${index}.requirement`]?.toString() || ''}
                                    content="Requirement"
                                    formtype="textarea"
                                />
                                <NewForminput
                                    formtype="number"
                                    setFieldValue={form.setFieldValue}
                                    valueName={`destinations.${index}.price`}
                                    valueText={form.values.destinations[index].price}
                                    error={form.errors[`destinations.${index}.price`]?.toString() || ''}
                                    content="Price"
                                />
                                <NewForminput
                                    formtype="number"
                                    setFieldValue={form.setFieldValue}
                                    valueName={`destinations.${index}.old_price`}
                                    valueText={form.values.destinations[index].old_price}
                                    error={form.errors[`destinations.${index}.old_price`]?.toString() || ''}
                                    content="Old Price"
                                />
                            </div>
                        ))}
                        <div onClick={() => form.insertListItem('destinations', { visaType: '', requirement: '', price: '', old_price: '', id: form.values.destinations?.length + 1 })} className="w-fit ml-auto cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-all border border-slate-200 active:scale-95">
                            Add Visa Type
                        </div>
                    </div>
                </div>
                <div className="px-4 py-2">
                    <Formbutton title={props.data?.id ? 'Update Contact' : 'Add Contact'} loading={form.submitting} />
                </div>
            </form>
        </div>
    )
}
