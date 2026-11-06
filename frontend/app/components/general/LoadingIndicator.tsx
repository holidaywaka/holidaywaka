
import React from 'react'
import { SiteName } from '../utils'

export default function LoadingIndicator({title=SiteName}: {title?: string}) {
    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <img src="/images/icon.png" alt="" className="h-10 w-auto rounded-full" />
            <div className="text-primary font-bold">{title}</div>
        </div>
    )
}
