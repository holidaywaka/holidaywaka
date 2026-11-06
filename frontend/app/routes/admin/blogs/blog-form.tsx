


import SingleFileUpload from '../../../components/admin/SingleFileUpload'
import { useNavigate } from 'react-router'
import Formbutton from '../../../components/general/Formbutton'
import type { BlogProps } from 'global'
import { useForm } from '@mantine/form'
import NewForminput from '~/components/general/NewForminput'
import Editor from '~/components/admin/Editor'
import { markdownToHtml, normalizeEditorHtml } from '~/components/general/Markdown'
import { BlogEditorFormats, BlogEditorModules, SideLinks2 } from '~/components/utils'
import { createResponse, NewApis } from '~/services/new-apis'
import { getAlert } from '~/services/get-alert'

// content is a MySQL TEXT column (64 KB); keep a margin for multi-byte characters
const MAX_CONTENT_BYTES = 60000
const plainText = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim()

type componentProps = {
    data: BlogProps | null
}

export default function BlogForm(props: componentProps) {
    const navigate = useNavigate()

    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            // Older posts were typed as Markdown; convert them so the editor keeps headings, lists and paragraphs
            content: markdownToHtml(props.data?.content || ''),
            url: props.data?.url || '',
            read: props.data?.read || '',
            title: props.data?.title || '',
            image: {
                file: null as File | null,
                img: props.data?.media || '' as string | null
            }
        },
        validate: {
            content: value => !plainText(value) ? 'Content is required' : new Blob([normalizeEditorHtml(value)]).size > MAX_CONTENT_BYTES ? 'This article is too long to save. Shorten it or split it into two posts' : null,
            read: value => !value ? 'Minute read estimation is required' : null,
            title: value => !value ? 'Title is required' : null,
            image: {
                file: value => (!props.data?.id && !value) ? 'Image is required' : null
            }
        }
    })

    async function HandleSubmission(values: typeof form.values) {
        try {
            const isId = props.data?.id
            const data = new FormData()
            const content = normalizeEditorHtml(values.content)
            if(content !== props.data?.content) data.append("content", content)
            if(values.title !== props.data?.title) data.append("title", values.title)
            if(values.url !== props.data?.url) data.append("url", values.url)
            if(values.read !== props.data?.read) data.append("read", values.read)
            if (values.image?.file) {
                data.append("media", values.image.file)
            }
            if (isId) {
                data.append("id", `${isId}`)
            }
            const response = await createResponse({
                endpoint: isId ? NewApis.blogs.update : NewApis.blogs.create,
                method: isId ? "PUT" : "POST",
                data,
                type: "FILE"
            })
            getAlert(response.message, 'success')
            return navigate(`${SideLinks2.find(ele => ele.title === "blog")?.url}`)
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }
    return (
        <form onSubmit={form.onSubmit(HandleSubmission)} className='w-full max-w-4xl mx-auto pt-10'>
            <div className=" bg-white p-2 md:p-4">
                <div className="mb-5">
                    <SingleFileUpload
                        removeImage={() => { }}
                        title="Upload File"
                        image={form.values.image}
                        setImage={(val) => form.setFieldValue("image", val)}
                        error={form.errors["image.file"]?.toString() || ''}
                    />
                </div>
                <NewForminput
                    content="Title"
                    {...form.getInputProps("title")}
                    error={form.errors.title?.toString() || ''}
                    key={form.key("title")}
                />
                <NewForminput
                    content="Video URL (Optional)"
                    {...form.getInputProps("url")}
                    error={form.errors.url?.toString() || ''}
                    key={form.key("url")}
                />
                <NewForminput
                    content="Minute read"
                    type="number"
                    {...form.getInputProps("read")}
                    error={form.errors.read?.toString() || ''}
                    key={form.key("read")}
                />
                <div className="mt-5">
                    <Editor
                        title="Content"
                        form={form.values.content}
                        onChange={(value) => form.setFieldValue("content", value)}
                        error={form.errors.content?.toString() || ''}
                        modules={BlogEditorModules}
                        formats={BlogEditorFormats}
                        placeholder="Write your article. Use the toolbar for headings, lists, quotes and links."
                        className="blog-editor mt-1"
                    />
                </div>
            </div>
            <div className="w-fit ml-auto mt-5">
                <Formbutton title="Submit +" loading={form.submitting} />
            </div>
        </form>
    )
}
