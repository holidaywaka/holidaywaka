

import { useDispatch } from "react-redux";
import Formbutton from "~/components/general/Formbutton";
import { dispatchProfile } from "~/store/reducer";
import { useNavigate } from "react-router";
import { RiLoginBoxLine } from "react-icons/ri";
import NewForminput from "../general/NewForminput";
import { useForm } from "@mantine/form";
import { createResponse, NewApis } from "~/services/new-apis";
import { getAlert } from "~/services/get-alert";
import Linked from "~/components/general/Linked";

type componentProps = {
    redirect?: boolean;
}


export default function LoginAccess({ redirect = false}: componentProps) {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            email: '',
            password: '',
        },
        validate: {
            email: value => !value ? 'Email Address is required' : (!value.includes("@")) ? 'Invalid email address' : null,
            password: value => !value ? 'Password is required' : null
        }
    })

    async function HandleSubmission(values: typeof form.values) {
        try {
            const response = await createResponse({
                endpoint: NewApis.users.login,
                data: values,
                method: "POST"
            })
            getAlert(response.message, 'success')
            dispatch(dispatchProfile(response.data))
            if (redirect) {
                navigate("/admin-portal/home")
            }
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }
    return (
        <div className="w-11/12 max-w-md mx-auto my-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 border border-slate-100 p-6 sm:p-10">
                <div className="size-12 rounded-2xl bg-secondary/20 text-primary flex items-center justify-center text-2xl mb-6"> <RiLoginBoxLine /> </div>
                <h1 className="font-extrabold text-3xl text-primary">Welcome back</h1>
                <p className="text-zinc-500 mt-2 text-sm">Sign in to manage bookings, packages and content.</p>
                <form onSubmit={form.onSubmit(HandleSubmission)} className="mt-8">
                    <NewForminput
                        {...form.getInputProps("email")}
                        content="Email address"
                        placeholder="you@example.com"
                        error={form.errors.email?.toString() || ''}
                    />
                    <div className="relative">
                        <Linked to="/forgot-password" className="absolute right-0 top-0 z-10 text-sm font-semibold text-secondary hover:text-primary transition-colors">Forgot password?</Linked>
                        <NewForminput
                            formtype="password"
                            {...form.getInputProps("password")}
                            content="Password"
                            placeholder="Enter your password"
                            error={form.errors.password?.toString() || ''}
                        />
                    </div>
                    <div className="mt-2">
                        <Formbutton title="Sign in" loading={form.submitting} Icon={RiLoginBoxLine} bg="bg-primary text-white hover:bg-primary/90 border-0 py-4! text-sm!" />
                    </div>
                </form>
            </div>
        </div>
    )
}
