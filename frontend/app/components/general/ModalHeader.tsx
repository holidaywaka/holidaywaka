import { FiX } from "react-icons/fi";

type props = {
    title: string;
    close: () => void
}

export default function ModalHeader(props: props) {
    return (
        <div className="flex items-center justify-between border-b border-gray-300 px-4 py-2 mb-3">
            <div className="font-bold">{props.title}</div>
            <div onClick={props.close} className="cursor-pointer p-2 hover:bg-background transition-all text-2xl"> <FiX /> </div>
        </div>
    )
}
