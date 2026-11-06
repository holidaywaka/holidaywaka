import { useForm } from '@mantine/form';
import { Lock } from 'iconsax-reactjs';
import { useNavigate, useSearchParams } from 'react-router';
import Formbutton from '~/components/general/Formbutton';
import NewForminput from '~/components/general/NewForminput';
import { getAlert } from '~/services/get-alert';
import { createResponse, NewApis } from '~/services/new-apis';
import { privatePage } from '~/services/seo';

export function meta() {
    return privatePage("Reset Password")
}

export default function reset_password() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            password: '',
            confirmPassword: '',
            email: searchParams.get("email"),
        },
        validate: {
            password: value => !value ? 'Password is required ' : null,
            confirmPassword: (value, values) => !value ? 'Password is required ' : (value !== values.password) ? 'Password(s) do not match' : null,
            email: value => !value ? 'Email Address is required' : (!String(value).includes("@")) ? 'Invalid email address' : null,
        }
    })

    async function HandleSubmission(values: typeof form.values) {
        try {
            const response = await createResponse({
                endpoint: NewApis.users.reset_password,
                data: values,
                method: "POST"
            })
            getAlert(response.message, 'success')
            navigate(`/login`)
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }
    return (
        <div>
            <div className="w-11/12 mx-auto p-4 rounded-xl my-6 max-w-xl bg-white">
                <div className="text-center font-extrabold text-3xl lg:text-4xl">Secure my account</div>
                <form onSubmit={form.onSubmit(HandleSubmission)} className="mt-10">
                    <NewForminput
                        formtype="password"
                        {...form.getInputProps("password")}
                        content="Password"
                        error={form.errors.password?.toString() || ''}
                    />
                    <NewForminput
                        formtype="password"
                        {...form.getInputProps("confirmPassword")}
                        content="Confirm Password"
                        error={form.errors.confirmPassword?.toString() || ''}
                    />
                    <Formbutton title="Secure my account" loading={form.submitting} Icon={Lock} />
                </form>
            </div>
        </div>
    )
}
