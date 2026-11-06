

import Formbutton from "~/components/general/Formbutton";
import { useNavigate } from "react-router";
import { RiLoginBoxLine } from "react-icons/ri";
import { useForm } from "@mantine/form";
import { createResponse, NewApis } from "~/services/new-apis";
import { getAlert } from "~/services/get-alert";
import NewForminput from "~/components/general/NewForminput";
import { clientVerificationTags } from "~/components/utils";
import { privatePage } from '~/services/seo';


export function meta() {
    return privatePage("Forgot Password")
}

export default function forgot_password() {
    const navigate = useNavigate()
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            email: '',
        },
        validate: {
            email: value => !value ? 'Email Address is required' : (!value.includes("@")) ? 'Invalid email address' : null,
        }
    })

    async function HandleSubmission(values: typeof form.values) {
        try {
            const response = await createResponse({
                endpoint: NewApis.users.forgot_password,
                data: values,
                method: "POST"
            })
            getAlert(response.message, 'success')
            navigate(`/verify-email/${clientVerificationTags.forgot_password}?email=${values.email}`);
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }
    return (
        <div>
            <div className="w-11/12 mx-auto p-4 rounded-xl my-6 max-w-xl bg-white">
                <div className="text-center font-extrabold text-3xl lg:text-4xl">Forgot Password?</div>
                <form onSubmit={form.onSubmit(HandleSubmission)} className="mt-10">
                    <NewForminput
                        {...form.getInputProps("email")}
                        content="Email address"
                        error={form.errors.email?.toString() || ''}
                    />
                    <Formbutton title="Find my account" loading={form.submitting} Icon={RiLoginBoxLine} />
                </form>
            </div>
        </div>
    )
}
