import React from "react"
import Formbutton from "~/components/general/Formbutton"
import type { docsProps } from "~/routes/admin/docs/types"
import { getAlert } from "~/services/get-alert"
import { createResponse, NewApis } from "~/services/new-apis"


type props = {
    refetch: () => void
    close: () => void
    data: docsProps | null | undefined
    tag: 'view' | 'delete'
}
export default function DocsModal(props: props) {

    if (props.tag === "view") return <ViewDocsComponent {...props} />
    if (props.tag === "delete") return <DeleteDocsComponent {...props} />
}

function DeleteDocsComponent(props: props) {
    const [loading, setLoading] = React.useState(false)
    async function handleDeleteAction() {
        try {
            setLoading(true)
            const response = await createResponse({
                endpoint: `${NewApis.docs.delete}/${props.data?.tag}`,
                method: "DELETE",
            })
            getAlert(response.message, 'success')
            props.close()
            props.refetch()
        } catch (error) {
            getAlert((error as Error).message, 'error')
        } finally {
            setLoading(false)
        }
    }
    return (
        <div className="p-4 text-sm">
            Are you sure you want to delete this document? This action cannot be undone.
            <div className="flex items-center gap-3 mt-5">
                <button onClick={props.close} className="bg-gray-200 cursor-pointer px-4 py-2 rounded">Cancel</button>
                <Formbutton
                    title="Delete"
                    onClick={handleDeleteAction}
                    loading={loading}
                    bg="bg-red-600 hover:bg-red-700 text-white"
                />
            </div>
        </div>
    )
}

function ViewDocsComponent(props: props) {
    return (
        <div className="p-4 h-[75dvh] overflow-y-auto scrolls text-sm">
            <div className="whitespace-pre-wrap">{props.data?.content}</div>
        </div>
    )
}
