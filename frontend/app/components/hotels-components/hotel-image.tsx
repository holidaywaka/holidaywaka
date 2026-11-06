import React from 'react'
import { MdHotel } from 'react-icons/md'

type props = {
    image?: string;
    width?: number;
    height?: number;
    className: string;
    size?: string;
    alt?: string;
    onClick?: () => void;
    /** Shown under the icon when there is no photo */
    placeholderText?: string;
}

/** ETG image with a {size} placeholder; falls back to a neutral panel when missing or broken */
export default function HotelImage(props: props) {
    const [failed, setFailed] = React.useState(false)
    const size = props.size ?? "640x400";

    if (!props.image || failed) return (
        <div onClick={props.onClick} className={`${props.className} flex flex-col items-center justify-center gap-1 bg-slate-100 text-zinc-400`}>
            <MdHotel className="size-10" aria-hidden />
            <span className="text-xs">{props.placeholderText ?? 'No photos yet'}</span>
        </div>
    )
    const src = props.image.replace("{size}", size)
    return (
        // display: contents lets percentage sizes on the img resolve against the caller's container
        <picture className="contents">
            <source srcSet={`${src}?format=webp`} type="image/webp" />
            <img className={props.className} src={src} alt={props.alt ?? ""} loading="lazy" onClick={props.onClick} onError={() => setFailed(true)} />
        </picture>
    )
}
