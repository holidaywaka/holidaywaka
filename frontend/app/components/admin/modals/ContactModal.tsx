import type { ContactProps, deleteLayoutProps } from "global"
import { FiX } from "react-icons/fi"
import { humanDateTimeFormat } from "~/components/utils"


type componentProps = {
    close: () => void
    title?: string
    isDelete?: deleteLayoutProps | null
    data: ContactProps
    refetch: () => void
    readOnly: boolean
}

export default function ContactModal(props: componentProps) {
    return (
        <div>
            <div className="flex items-center justify-between border-b border-gray-300 px-4 py-4">
                <div className="font-bold">{props.title}</div>
                <div onClick={props.close} className="cursor-pointer p-2 hover:bg-background transition-all"> <FiX /> </div>
            </div>
            <div className="p-4">
                <div className="text-sm space-y-4">
                    <div className="">
                        <div className="text-slate-500">Full Name</div>
                        <div className="font-semibold">{props.data.name}</div>
                    </div>
                    <div className="">
                        <div className="text-slate-500">Contact Info.</div>
                        <div className="font-semibold">{props.data.contact}</div>
                    </div>
                    <div className="">
                        <div className="text-slate-500">Message</div>
                        <div className="font-semibold">{props.data.message}</div>
                    </div>
                    <div className="">
                        <div className="text-slate-500">Date Created</div>
                        <div className="font-semibold">{humanDateTimeFormat(props.data.createdAt || '')}</div>
                    </div>
                </div>
            </div>
        </div >
    )
}
