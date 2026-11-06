import React from 'react'
import AHeader from '~/components/admin/AHeader'
import DocsForm from '~/routes/admin/docs/docs-form'

export default function newdocs() {
    return (
        <div>
            <AHeader title="New Docs" subtitle='' />
            <div className="mt-5">
                <DocsForm data={null} />
            </div>
        </div>
    )
}
