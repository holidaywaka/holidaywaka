import { useForm } from "@mantine/form"
import { useNavigate } from "react-router"
import Formbutton from "~/components/general/Formbutton"
import NewForminput from "~/components/general/NewForminput"
import { ClientDocsListings, type docsProps } from "~/routes/admin/docs/types"
import { getAlert } from "~/services/get-alert"
import { createResponse, NewApis } from "~/services/new-apis"


type props = {
    data: docsProps | null | undefined
}
export default function DocsForm(props: props) {
    const navigate = useNavigate()
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            tag: props.data?.tag || '',
            id: props.data?.id || null,
            content: props.data?.content || '',
        },
        validate: {
            tag: (value) => value.length < 1 ? 'Tag is required' : null,
            content: (value) => value.length < 1 ? 'Content is required' : null,
        }
    })

    async function handleSubmission(values: typeof form.values) {
        try {
            const body = {
                tag: values.tag,
                content: values.content,
                ...(props.data?.id ? { id: props.data.id } : {})
            }
            const response = await createResponse({
                endpoint: NewApis.docs.manage,
                method: "POST",
                data: body
            })
            getAlert(response.message, 'success')
            navigate('/admin-portal/docs')
        } catch (error) {
            getAlert((error as Error).message, 'error')
        }
    }
    return (
        <div className='px-2 md:px-4 w-full max-w-3xl mx-auto'>
            <form onSubmit={form.onSubmit(handleSubmission)}>
                <div className='bg-white p-2 md:p-6'>
                    <NewForminput
                        content="Document Type"
                        formtype="select"
                        options={Object.values(ClientDocsListings)}
                        error={form.errors.tag?.toString() || ''}
                        {...form.getInputProps('tag')}
                        key={form.key("tag")}
                    />
                    <NewForminput
                        content="Document Content"
                        formtype="textarea"
                        error={form.errors.content?.toString() || ''}
                        {...form.getInputProps('content')}
                        key={form.key("content")}
                        inputStyles={{ minHeight: "350px" }}
                    />
                </div>
                <div className="grid grid-cols-2 gap-5 w-full max-w-xl mx-auto mt-5 mb-10">
                    <div></div>
                    <Formbutton loading={form.submitting} title="Submit" />
                </div>
            </form>
        </div>
    )
}
