
import Lottie from 'lottie-react'
import animationLogo from "~/json/Empty.json"


type Props = {
    title: string
}
export default function EmptyView(props: Props) {
    return (
        <div>
            <Lottie
                animationData={animationLogo}
                className="w-auto h-56"
                loop={true}
            />
            <div className="text-center italic text-gray-500 animate-pulse -mt-5 mb-5">{props.title} found!.</div>
        </div>
    )
}
