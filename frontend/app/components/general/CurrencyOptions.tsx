

import type { phoneSelectorSetup } from 'global'
import Currencies from './Currencies'
import { convert } from 'html-to-text'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SlArrowDown } from 'react-icons/sl'



type ComponentProps = {
    setup: any
    defaultValue: string
}


const CurrencyOptions = ({setup, defaultValue}: ComponentProps) => {
    const [text, setText] = useState('')
    const [content, setContent] = useState( defaultValue ? Currencies.find(ele => (ele.abbreviation === defaultValue))?.abbreviation : '')
    const [codes, setCodes] = useState(Currencies || [])
    const togref = useRef<HTMLDivElement>(null)
    const [view, setView] = useState(false)
    
    useEffect(() => {
        togref && window.addEventListener('click', e => {togref.current !== null && !togref.current.contains(e.target as Node) && setView(false) }, true)
    }, [])

    const handleChange = (val: string) => {
        setText(val)
        if(val.length > 0) {
            const findText = Currencies.filter(ele => (ele.abbreviation.toLowerCase().includes(val?.toLowerCase()) || ele.currency.toLowerCase().includes(val?.toLowerCase())))
            setCodes(findText)
        }else {
            setCodes(Currencies)
        }
    }
    const handleSelection = (val: phoneSelectorSetup) => {
        const text = convert(`${val.abbreviation}`)
        setContent(text)
        setup(val)
        setView(false)
    }
    return (
        <div className="relative">
            <div ref={togref} className={`${view ? '' : 'hidden'} absolute top-[4rem] z-10 left-0 w-full bg-white border shadow-2xl`}>
                <div className="w-11/12 mx-auto mt-3">
                    <input value={text} onChange={e => handleChange(e.target.value)} placeholder='Search...' type="text" className="w-full p-2 text-sm border rounded-sm" />
                    <div className="h-fit max-h-[20rem] overflow-y-auto scrolls scrollsdown">
                        {codes.map((item, i) => (
                            <div onClick={() => handleSelection(item)} className="text-xs p-1.5 border-b last:border-none cursor-pointer hover:bg-slate-50" key={i} dangerouslySetInnerHTML={{__html: `${item.abbreviation}`}} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="outline-none flex items-center justify-between cursor-pointer text-sm w-full h-14 rounded-lg py-2.5 px-3 " onClick={() => setView(true)}><span>{content}</span> <SlArrowDown /> </div>
        </div>
    )
}

export default CurrencyOptions
