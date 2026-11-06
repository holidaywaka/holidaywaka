

import { Image } from 'antd'
import { useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import {IoMdImages} from 'react-icons/io'

type componentProps = {
    src?: string | undefined
    height?: string
    rounded?: boolean
    circle?: boolean
}

export default function Imaged({ src, height = "12rem", rounded=true, circle }: componentProps) {
    const [isLoaded, setIsLoaded] = useState(false)
    
    if (!src) return (
        <div className="bg-zinc-200 animate-pulse rounded-lg h-[12rem] flex flex-col items-center justify-center">
            <IoMdImages className='text-3xl' />
            <div className="">No Image found...</div>
        </div>
    )

    return (
        <>
        {!isLoaded && <Skeleton style={{height}} circle={circle} />}
        <div className={`${rounded ? 'rounded-xl' : ''} overflow-hidden relative`}>
            <Image
            onLoad={() => setIsLoaded(true)}
            style={{ height, width: "100dvw", display: !isLoaded ? 'none' : "block", objectFit: 'cover', borderRadius: !rounded ? 0 : '0.5rem' }}
            src={src}
            alt="" />
        </div>
        </>
    )
}
