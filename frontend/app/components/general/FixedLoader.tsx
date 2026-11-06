import React from 'react'
import LoadingIndicator from '~/components/general/LoadingIndicator'

export default function FixedLoader(props: {title: string, loading: boolean}) {
    if(!props.loading) return null
    if(props.loading) return (
        <div className="fixed size-full top-0 left-0 bg-white/10 backdrop-blur-sm">
            <LoadingIndicator title={props.title} />
        </div>
    )
}
