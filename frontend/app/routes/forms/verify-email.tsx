import { useForm } from '@mantine/form';
import React from 'react'
import { RiLoginBoxLine } from 'react-icons/ri';
import { SlEnvolope } from 'react-icons/sl';
import { useNavigate, useParams, useSearchParams } from 'react-router'
import Formbutton from '~/components/general/Formbutton';
import NewForminput from '~/components/general/NewForminput';
import { getAlert } from '~/services/get-alert';
import { createResponse, NewApis } from '~/services/new-apis';
import { privatePage } from '~/services/seo';

export function meta() {
    return privatePage("Verify Email")
}

export default function verify_email() {
    const { tag } = useParams();
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [resend, setResend] = React.useState({
        status: false,
        text: 'Resend Code'
    })

    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            otp: '',
            tag: tag,
            email: searchParams.get("email"),
        },
        validate: {
            otp: value => !value ? 'Verification code is required' : null,
            tag: value => !value ? 'Verification type is required' : null,
            email: value => !value ? 'Email Address is required' : (!String(value).includes("@")) ? 'Invalid email address' : null,
        }
    });


    async function HandleSubmission(values: typeof form.values) {
        try {
            const response = await createResponse({
                endpoint: NewApis.users.verify_email,
                data: values,
                method: "POST"
            })
            getAlert(response.message, 'success')
            navigate(`/reset-password/?email=${values.email}`)
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }
    
    async function handleResend() {
        try {
            setResend({
                status: true,
                text: 'Resending....'
            })
            const response = await createResponse({
                endpoint: NewApis.users.resend_password,
                data: form.values,
                method: "POST"
            })
            getAlert(response.message, 'success')
            setTimeout(() => {
                setResend({
                    ...resend,
                    text: 'Resend Code'
                })
            }, 3000)
        } catch (error) {
            getAlert((error as Error).message, 'error')
        } finally {
            setResend({
                status: false,
                text: 'Code Sent!'
            })
        }
    }
    return (
        <div>
            <div className="w-11/12 mx-auto p-4 rounded-xl my-6 max-w-xl bg-white">
                <div className="text-center font-extrabold text-3xl lg:text-4xl">Verify my account</div>
                <form onSubmit={form.onSubmit(HandleSubmission)} className="mt-10">
                    <NewForminput
                        formtype="otp"
                        {...form.getInputProps("otp")}
                        content="Verification Code"
                        error={form.errors.otp?.toString() || ''}
                    />
                    <div className="text-blue-600 mb-6">
                        <div
                            onClick={() => (resend.status || form.submitting) ? null : handleResend()}
                            className={`${(resend.status || form.submitting) ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'} py-2 px-3 rounded-lg size-fit ml-auto active:scale-95 transition-all`}>{resend.text}</div>
                    </div>
                    <Formbutton title="Verify my account" loading={form.submitting} Icon={SlEnvolope} />
                </form>
            </div>
        </div>
    )
}
