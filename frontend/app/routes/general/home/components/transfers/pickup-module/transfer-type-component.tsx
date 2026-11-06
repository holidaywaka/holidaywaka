import React from 'react'
import { useSearchParams } from 'react-router'
import { TransferOptionType } from '~/components/utils'

type Props = {
    default: string
    handleTransfer: (value: string) => void
}

export default function TransferTypeOptionComponent(props: Props) {
    const [searchParams, setSearchParams] = useSearchParams()
    const value = props.default ?? searchParams.get("transferType")

    function HandleSelection(item: string) {
        searchParams.delete("transferType")

        const search = new URLSearchParams(searchParams)
        search.append("transferType", item)
        props.handleTransfer(item)
        return setSearchParams(search)
    }
    return (
        <div>
            <div className="flex flex-wrap items-center gap-6 text-sm mt-5">
                {Object.values(TransferOptionType).map((item, index) => (
                    <div
                        onClick={() => HandleSelection(item.title)}
                        className={`flex items-center gap-1 font-bold cursor-pointer py-1.5 px-2 rounded-md ${value === item.title ? 'bg-primary text-white' : ''}`}
                        key={index}>
                        <div className=""> <div className="size-4 rounded-sm border border-zinc-500 bg-white"></div> </div>
                        <div className="capitalize">{item.content}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
