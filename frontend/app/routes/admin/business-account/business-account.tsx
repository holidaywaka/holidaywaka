
import Formbutton from '~/components/general/Formbutton'
import { BsBank } from "react-icons/bs"
import NewForminput from '~/components/general/NewForminput'
import { useForm } from '@mantine/form'
import AHeader from '~/components/admin/AHeader'
import useFetchResponse from '~/services/fetchResponse'
import { createResponse, NewApis } from '~/services/new-apis'
import type { bankProps } from 'global'
import { getAlert } from '~/services/get-alert'


export default function BusinessAccountPage() {
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            accountName: '',
            accountNumber: '',
            bankName: '',
        },
        validate: {
            accountName: value => !value ? 'Account name is required' : null,
            accountNumber: value => !value ? 'Account number is required' : null,
            bankName: value => !value ? 'Bank name is required' : null,
        }
    })
    
    const { data } = useFetchResponse<bankProps>({
        endpoint: NewApis.bank.bank,
        onSuccess: (response: bankProps) => {
            form.setFieldValue('accountName', String(response?.accountName || ''))
            form.setFieldValue('accountNumber', String(response?.accountNumber || ''))
            form.setFieldValue('bankName', String(response?.bankName || ''))
        }
    })

    async function HandleSubmission(values: typeof form.values) {
        try {
            const isId = data?.id
            const response = await createResponse({
                endpoint: `${NewApis.bank.bank}${isId ? `/${isId}` : ''}`,
                method: isId ? "PUT" : "POST",
                data: values
            })
            getAlert(response.message, 'success')
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }

    return (
        <div>
            <AHeader title="Business Account" subtitle='Manage business account informations' />
            <div className="w-full max-w-xl mx-auto">
                <div className="text-center font-bold text-3xl mt-5">Manage Business Account</div>
                <div className="text-center">This account will be visible when visitors wants to make payments on bank transfers</div>
                <form onSubmit={form.onSubmit(HandleSubmission)} className='mt-5 bg-white rounded-xl p-4'>
                    <NewForminput
                        {...form.getInputProps("accountName")}
                        error={form.errors.accountName?.toString() || ''}
                        content="Account Name"
                    />
                    <NewForminput
                        {...form.getInputProps("accountNumber")}
                        error={form.errors.accountNumber?.toString() || ''}
                        content="Account Number"
                    />
                    <NewForminput
                        {...form.getInputProps("bankName")}
                        error={form.errors.bankName?.toString() || ''}
                        content="Name of Bank"
                    />
                    <Formbutton title="Update Account Information" loading={form.submitting} Icon={BsBank} />
                </form>
            </div>
        </div>
    )
}

