
import Formbutton from '~/components/general/Formbutton'
import { Image } from "antd"
import avatar from "/images/user.png"
import { useForm } from '@mantine/form'
import NewForminput from '~/components/general/NewForminput'
import type { phoneSelectorSetup } from 'global'
import AHeader from '~/components/admin/AHeader'

type FormProps = {
    name: string
    email: string
    phone: string
    phoneCode: string
    address: string
}

export default function AdminProfilePage() {
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            name: '',
            email: '',
            phone: '',
            phoneCode: '',
            address: '',
        },
        validate: {
            name: value => !value ? 'provide your full name' : null,
            email: value => !value ? 'provide your Email address' : null,
        }
    })


    async function HandleSubmission(values: FormProps) {
        console.log(values)
    }

    function setup(value: phoneSelectorSetup) {
        form.setFieldValue("phoneCode", `${value.dial_code}`)
    }
    return (
        <div>
            <AHeader title="Profile" subtitle='Manage account profile details' />
            <div className="w-full max-w-xl mx-auto">
                <div className="text-center font-bold text-3xl mt-5">Manage Account Password</div>
                <form onSubmit={form.onSubmit(HandleSubmission)} className='mt-5 bg-white p-4 rounded-xl'>
                    <div className="">
                        <div className="overflow-hidden size-20 lg:size-32 mx-auto rounded-full"> <Image src={avatar} /> </div>
                        <div className="w-fit mx-auto py-2 px-3 rounded-sm text-secondary font-medium text-sm mt-2 mb-3 hover:bg-slate-100 transition-all cursor-pointer">Change photo</div>
                    </div>
                    <NewForminput
                        {...form.getInputProps("name")}
                        error={form.errors.name?.toString() || ''}
                        content="Full Name"
                    />
                    <NewForminput
                        type="email"
                        {...form.getInputProps("email")}
                        error={form.errors.email?.toString() || ''}
                        content="Email Address"
                    />
                    <NewForminput
                        formtype="phone"
                        setup={setup}
                        {...form.getInputProps("phone")}
                        error={form.errors.phone?.toString() || ''}
                        content="Phone number for calls"
                    />
                    <NewForminput
                        formtype="textarea"
                        {...form.getInputProps("address")}
                        error={form.errors.address?.toString() || ''}
                        content="Official Address"
                    />
                    <Formbutton title="Update Account Profile" loading={form.submitting} />
                </form>
            </div>
        </div>
    )
}
