
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiCountryFlags, ApiCountries } from './ApiCountries'
import type { phoneSelectorProps, phoneSelectorSetup } from 'global'

export default function PhoneSelector ({ title, setup, defaultValue="+234" }: phoneSelectorProps){
    const [text, setText] = useState('')
    const [content, setContent] = useState({
        img: '',
        code: ''
    })
    const [codes, setCodes] = useState(ApiCountries || [])
    const togref = useRef<HTMLDivElement>(null)
    const [view, setView] = useState(false)

    const GetContent = useCallback(() => {
        const findCode = defaultValue && ApiCountries.find(ele => (ele.dial_code === defaultValue))
        if (findCode) {
            const itemflag = ApiCountryFlags.find((ele) => ele.name?.toLocaleLowerCase() === findCode.code?.toLocaleLowerCase())

            setContent({
                img: itemflag?.data ?? '',
                code: findCode.code
            })
        }
    }, [defaultValue])

    useEffect(() => {
        GetContent()
        togref && window.addEventListener('click', (e) => { togref.current !== null && !togref.current.contains(e.target as Node) && setView(false) }, true)
    }, [GetContent])

    const handleChange = (val: string) => {
        setText(val)
        if (val.length > 0) {
            const findText = ApiCountries.filter(ele => ele.name.toLowerCase().includes(val?.toLowerCase()) || ele.dial_code.toLowerCase().includes(val?.toLowerCase()))
            setCodes(findText)
        } else {
            setCodes(ApiCountries)
        }
    }
    const handleSelection = (val: phoneSelectorSetup) => {
        const itemflag = ApiCountryFlags.find((ele) => ele.name?.toLowerCase() === val.code?.toLowerCase())
        setContent({
            img: itemflag?.data ?? '',
            code: `${val.code}`
        })
        setup(val)
        setView(false)
    }
    return (
        <div className=''>
            <div ref={togref} className={`${view ? '' : 'hidden'} absolute top-[4rem] z-10 left-0 w-full bg-white border shadow-2xl`}>
                <div className="w-11/12 mx-auto mt-3">
                    <input value={text} onChange={(e) => handleChange(e.target.value)} placeholder='Search!...' type="text" className="w-full p-2 text-sm border rounded-sm" />
                    <div className="h-[20rem] overflow-y-auto scrolls scrollsdown">
                        {codes.map((item, i) => {
                            const itemflag = ApiCountryFlags.find((ele) => ele.name?.toLocaleLowerCase() === item.code?.toLocaleLowerCase())
                            return (
                                <div onClick={() => handleSelection(item)} className="text-xs py-1 border-b cursor-pointer hover:bg-slate-50 flex items-center gap-2" key={i}> <img loading="lazy" decoding="async" data-nimg="1" src={itemflag?.data} alt="" className="w-5" /> {item.dial_code}</div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <div onClick={() => setView(true)} className={`outline-none flex items-center justify-between cursor-pointer text-sm w-full h-14 rounded-lg py-2.5 px-3 ${defaultValue ? 'text-slate-600' : ''}`}>{!content.code ? <span className="text-slate-500">{title}</span> : <div className='flex items-center gap-2'> <span>{content.code}</span> </div>} </div>
        </div>
    )
}


