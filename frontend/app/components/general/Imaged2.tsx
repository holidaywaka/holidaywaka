
import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { IoMdImages } from 'react-icons/io'
import { Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { FiX } from 'react-icons/fi'
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { modalStyle } from '../utils'

type componentProps = {
    src?: any
    height?: string
    rounded?: boolean
    extra?: boolean
    className?: string
}

export default function Imaged2({ src, rounded = false, extra=true, className }: componentProps) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [opened, { close, open }] = useDisclosure(false)


    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => setLoaded(true);
    }, [src]);

    if (!src) return (
        <div className={`bg-zinc-200 flex flex-col items-center justify-center ${className} ${rounded ? 'rounded-full' : 'rounded-lg'}`}>
            <IoMdImages className='text-3xl' />
            <div className="">{rounded ? '' : 'No Image found...'}</div>
        </div>
    )

    return (
        <>
            {opened && <Modal opened={opened} onClose={close} size="auto" withCloseButton={false} styles={modalStyle}>
                <div className="relative">
                    <div onClick={close} className="absolute top-2 right-2 z-20 size-10 bg-white/70 cursor-pointer text-primary rounded-lg flex items-center justify-center text-3xl hover:text-red-600"> <FiX /> </div>
                    <ImagePreview
                        src={src}
                    />
                </div>
            </Modal>}
            {!isLoaded && <Skeleton circle={rounded ? true : false} className={className} />}
            <img
                onClick={() => extra ? open() : null}
                onLoad={() => setIsLoaded(true)}
                style={{ display: !isLoaded ? 'none' : "block", objectFit: 'cover', borderRadius: !rounded ? '0.3rem' : '50%', cursor: 'pointer' }}
                src={src}
                className={className}
                loading="lazy"
                alt="" />
        </>
    )
}

type previewProps = {
    src: string
}

function ImagePreview({ src }: previewProps) {

    if (!src) return (
        <div className={`bg-zinc-200 flex flex-col items-center h-[10rem] justify-center rounded-lg`}>
            <IoMdImages className='text-3xl' />
            <div className="">No Image found...</div>
        </div>
    )

    return (
        <>
            <LazyLoadImage
                className='w-dvw h-[50dvh] md:h-[100dvh]'
                style={{ display: "block", objectFit: 'cover', borderRadius: '0.3rem' }}
                // style={{ display: "block", objectFit: 'cover', borderRadius: '0.3rem', height: "100dvh", width: "100dvw" }}
                effect="blur"
                // wrapperProps={{
                //     style: { transitionDelay: "1s" },
                // }}
                src={src}
            />
        </>
    )
}
