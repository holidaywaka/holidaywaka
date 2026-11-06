import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import Dialcodes from './countrycodes'


type ComponentProps = {
    title?: string
    setup?: (value: CodeProps | '') => void
    old?: boolean
    pickValue?: string
    setValue?: any
    valueName?: string
    label?: string
    defaultValue?: string
    error?: string
}

type CodeProps = {
    name?: string
    code?: string
}

const SelectOptions = forwardRef(({ title, setup, old = false, pickValue = "name", setValue, valueName, label, defaultValue, error, ...props }: ComponentProps, ref) => {
    const [text, setText] = useState('')
    const [content, setContent] = useState('')
    const [codes, setCodes] = useState(Dialcodes || [])
    const togref = useRef<HTMLDivElement>(null)
    const [view, setView] = useState(false)

    const GetContent = useCallback(() => {
        const findCode = defaultValue && Dialcodes.find(ele => (ele.name === defaultValue || ele.code === defaultValue))
        if (findCode) {
            if (old === true) {
                setContent(`${findCode.name} - ${findCode.code}` || '')
            } else {
                setValue(valueName, `${findCode.name} - ${findCode.code}`)
            }
        }
    }, [defaultValue])

    useEffect(() => {
        GetContent()
        togref && window.addEventListener('click', e => { togref.current !== null && !togref.current.contains(e.target as Node) && setView(false) }, true)
    }, [GetContent])

    const handleChange = (val: string) => {
        setText(val)
        if (val.length > 0) {
            const findText = Dialcodes.filter(ele => ele.name.toLowerCase().includes(val?.toLowerCase()))
            setCodes(findText)
        } else {
            setCodes(Dialcodes)
        }
    }
    const handleSelection = (val: CodeProps) => {
        if (old === true) {
            if (setup) {
                setup(val)
                setContent(`${val.name} - ${val.code}` || '')
            }
        } else {
            setValue(valueName, `${pickValue === "name" ? val.name : val.code}`)
        }
        setView(false)
    }


    return (
        <div className='relative mt-3'>
            <div className="">{label}</div>
            <div ref={togref} className={`${view ? '' : 'hidden'} absolute top-[3rem] z-10 left-0 w-full bg-white border border-slate-300 shadow-2xl`}>
                <div className="w-11/12 mx-auto mt-3">
                    <input value={text} onChange={e => handleChange(e.target.value)} placeholder='Search country here!...' type="text" className="border border-slate-300 text-sm p-2 w-full rounded-sm" />
                    <div className="h-[20rem] overflow-y-auto scrolls scrollsdown">
                        {codes.map((item, i) => (
                            <div onClick={() => handleSelection(item)} className="text-xs p-1.5 border-b border-slate-300 cursor-pointer hover:bg-slate-50" key={i}>{item.name}</div>
                        ))}
                    </div>
                </div>
            </div>
            <input ref={ref as React.Ref<HTMLInputElement>} {...props} className={`border bg-white w-full p-3 rounded-md outline-none ${error ? '!border-red-700' : '!border-slate-400'}`} onClick={() => setView(true)} placeholder={title} value={content} readOnly />
            {error && <div className='text-red-700'>{error}</div>}

        </div>
    )
})

export default SelectOptions

