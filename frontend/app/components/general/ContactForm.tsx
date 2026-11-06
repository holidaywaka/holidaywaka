import Formbutton from './Formbutton';
import { FaPaperPlane } from 'react-icons/fa6';
import NewForminput from './NewForminput';
import { useForm } from '@mantine/form';
import { createResponse, NewApis } from '~/services/new-apis';
import { getAlert } from '~/services/get-alert';

type props = {
    onSuccess?: () => void
}

export default function ContactForm({ onSuccess }: props) {
    // Controlled so form.reset() clears the visible inputs after a successful send
    const form = useForm({
        initialValues: {
            name: '',
            contact: '',
            message: '',
        },
        validate: {
            name: value => !value ? 'Full name is required' : null,
            contact: value => !value ? 'Your contact is required' : null,
            message: value => !value ? 'Your request is required' : null,
        }
    })

    async function HandleSubmission(values: typeof form.values) {
        try {
            const response = await createResponse({
                endpoint: NewApis.contacts.contacts,
                method: "POST",
                data: values
            })
            getAlert(response.message, 'success')
            form.reset()
            onSuccess?.()
        } catch (error) {
            return getAlert(`${(error as Error).message}`, 'error')
        }
    }
    return (
        <div>
            <form onSubmit={form.onSubmit(HandleSubmission)} className="">
                <NewForminput
                {...form.getInputProps("name")}
                    content="Full Name"
                    error={form.errors.name?.toString() || ''}
                />
                <NewForminput
                {...form.getInputProps("contact")}
                    content="Contact Detail (Email Address / Phone Number)"
                    error={form.errors.contact?.toString() || ''}
                />
                <NewForminput
                {...form.getInputProps("message")}
                    content="Content of your message"
                    error={form.errors.message?.toString() || ''}
                    formtype="textarea"
                />
                <Formbutton
                    title="Submit Enquiry"
                    Icon={FaPaperPlane}
                    loading={form.submitting}
                />
            </form>
        </div>
    )
}
