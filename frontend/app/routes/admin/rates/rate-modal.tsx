import { useForm } from '@mantine/form'
import Formbutton from '~/components/general/Formbutton'
import NewForminput from '~/components/general/NewForminput'
import { getAlert } from '~/services/get-alert'
import { createResponse, NewApis } from '~/services/new-apis'

type Props = {
    close: () => void
    refetch: () => void
    data: rateQuoteProps
}

type rateQuoteProps = {
    quote?: string
    value?: string
    id?: string
}


export default function RateModal(props: Props) {
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            quote: props.data?.quote || 'USD',
            value: props.data?.value || '',
        },
        validate: {
            quote: value => !value ? 'Quote currency is required' : null,
            value: value => !value ? 'Quote value is required' : null,
        }
    })


    async function HandleSubmission(values: typeof form.values) {
        try {
            const body = {
                quotes: [
                    {
                        quote: values.quote,
                        value: values.value,
                    }
                ]
            }

            const isId = props.data?.id
            const response = await createResponse({
                endpoint: `${NewApis.rates.rates}${isId ? `/${props.data?.id}` : ''}`,
                method: isId ? "PUT" : "POST",
                data: body
            })
            getAlert(response.message, "success")
            props.close()
            props.refetch()
        } catch (error) {
            getAlert((error as Error).message, "error")
        }
    }
    return (
        <form onSubmit={form.onSubmit(HandleSubmission)} className='p-4'>
            <NewForminput
                error={form.errors?.quotes?.toString() || ""}
                {...form.getInputProps("value")}
                content="Quote Value"
                type="number"
            />
            <div className="mt-8">
                <Formbutton title="Save" loading={form.submitting} />
            </div>
        </form>
    )
}
