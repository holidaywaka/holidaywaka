
import React from 'react'
import { useForm } from "@mantine/form"
import { Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import Formbutton from '~/components/general/Formbutton'
import { dispatchProfile } from '~/store/reducer'
import { modalStyle } from '~/components/utils'
import { useDispatch } from 'react-redux'
import NewForminput from '~/components/general/NewForminput'
import { SlLockOpen } from 'react-icons/sl'
import AHeader from '~/components/admin/AHeader'
import { createResponse, NewApis } from '~/services/new-apis'
import { getAlert } from '~/services/get-alert'

export default function AdminPasswordPage() {
    const [forms, setForms] = React.useState({})
    const [loading, setLoading] = React.useState(false)
    const [opened, { open, close }] = useDisclosure(false)
    const dispatch = useDispatch()
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validate: {
            currentPassword: value => !value ? 'Provide your current password' : null,
            newPassword: (value, values) => !value ? 'Provide your new password' : (value === values.currentPassword) ? 'Cannot provide the same password for current as the new password' : null,
            confirmPassword: (value, values) => !value ? 'Re-type your new password' : (value !== values.newPassword) ? 'Password(s) mis matched' : null,
        }
    })

    function HandleSubmission(values: typeof form.values) {
        setForms(values)
        open()
    }

    async function HandleLogout() {
        try {
            setLoading(true)
            const response = await createResponse({
                endpoint: NewApis.users.change_password,
                method: "PUT",
                data: forms
            })
            const response2 = await createResponse({
                endpoint: NewApis.users.logout,
                method: "POST",
            })
            getAlert(response.message, 'success')
            getAlert(response2.message, 'success')
            form.reset()
            dispatch(dispatchProfile({}))
        } catch (error) {
            getAlert((error as Error).message, 'error')
        } finally {
            close()
            setLoading(false)
        }
    }

    return (
        <div>

            <Modal opened={opened} onClose={close} styles={modalStyle}>
                <div className="px-4 pb-4">
                    <div className="text-center text-sm">kindly confirm your request, this will automatically <span className="text-red-500">log you out</span> of your account for a Re-login</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                        <button type="button" onClick={close} className="py-2 px-3 cursor-pointer text-red-500 order-2 md:order-1">Cancel</button>
                        <div className="order-1 md:order-2">
                            <Formbutton title="Yes, Proceed" loading={loading} onClick={HandleLogout} />
                        </div>
                    </div>
                </div>
            </Modal>
            <AHeader
                title="Password"
                subtitle='Manage account password'
            />
            <div className="w-full max-w-xl mx-auto">
                <div className="text-center font-bold text-3xl mt-5">Manage Account Password</div>
                <form onSubmit={form.onSubmit(HandleSubmission)} className='mt-5 bg-white p-4 rounded-xl'>
                    <NewForminput
                        formtype="password"
                        {...form.getInputProps("currentPassword")}
                        error={form.errors.currentPassword?.toString() || ''}
                        content="Current Password"
                    />
                    <NewForminput
                        formtype="password"
                        {...form.getInputProps("newPassword")}
                        error={form.errors.newPassword?.toString() || ''}
                        content="New Password"
                    />
                    <NewForminput
                        formtype="password"
                        {...form.getInputProps("confirmPassword")}
                        error={form.errors.confirmPassword?.toString() || ''}
                        content="Confirm your new Password"
                    />
                    <Formbutton title="Update Account Password" Icon={SlLockOpen} />
                </form>
            </div>
        </div>
    )
}
