import { useParams } from 'react-router'
import AHeader from '~/components/admin/AHeader'
import DocsForm from '~/routes/admin/docs/docs-form'
import type { docsProps } from '~/routes/admin/docs/types'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'

export default function editdocs() {
    const { id } = useParams()

    const { data, isLoading } = useFetchResponse<docsProps>({
        endpoint: `${NewApis.docs.tag}/${id}`
    })


    if (isLoading) return (
        <div className="text-center">Loading...</div>
    )
    if (!isLoading && data?.id) return (
        <div>
            <AHeader title="Edit Docs" subtitle='' />
            <div className="mt-5">
                <DocsForm data={data} />
            </div>
        </div>
    )
}
