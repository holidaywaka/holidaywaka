

import type { BlogProps } from 'global'
import { useParams } from 'react-router'
import AHeader from '~/components/admin/AHeader'
import BlogForm from '~/routes/admin/blogs/blog-form'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'


export default function EditPackagePage() {
    const { id } = useParams()
    
    const {data, isLoading} = useFetchResponse<BlogProps>({
        endpoint: `${NewApis.blogs.blogs}/${id}`
    })

    if (isLoading) return (
        <div className="text-center">Loading...</div>
    )
    if (!isLoading && data?.id) return (
        <div>
            <AHeader
                title="Edit Blog"
                subtitle=''
            />
            <BlogForm data={data} />
        </div>
    )
}
