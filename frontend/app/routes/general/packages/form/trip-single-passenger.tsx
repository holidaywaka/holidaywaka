import type { PackageEnquiryProps } from "global"
import { Profile } from "iconsax-reactjs"
import { FiMinus, FiPlus } from "react-icons/fi"

type props = {
    tag: string
    tagName: string
    value: number
    setFieldValue: (tag: string, value: any) => void
    form: PackageEnquiryProps
}

export default function SinglePassengerFlowComponent(props: props) {
    const isAdult = props.tag?.toLowerCase() === "adults"
    const isChild = props.tag?.toLowerCase() === "child"
    const limit = isAdult ? 1 : 0

    function increment() {
        const newValue = props.value + 1
        const newTag = isAdult ? `Adult No.${newValue}` : isChild ? `Child No.${newValue}` : `Infant No.${newValue}`

        const newField = { firstName: '', lastName: '', tag: newTag, priceAmount: '' }
        const getTravelers = props.form.travelers || []
        const newPassenger = [...getTravelers, newField]

        // arrange in aphalbetical order
        newPassenger.sort((a, b) => {
            const tagA = a.tag.toUpperCase()
            const tagB = b.tag.toUpperCase()
            if (tagA < tagB) {
                return -1
            }
            if (tagA > tagB) {
                return 1
            }
            return 0
        })

        props.setFieldValue(props.tagName, newValue)
        props.setFieldValue("travelers", newPassenger)
    }

    function decrement() {
        if (props.value <= limit) return
        const newValue = props.value - 1

        const prevTag = isAdult ? `Adult No.${props.value}` : isChild ? `Child No.${props.value}` : `Infant No.${props.value}`

        // find for passenger based on the newTag
        const filterOff = props.form.travelers?.filter(ele => ele.tag !== prevTag)


        props.setFieldValue(props.tagName, newValue)
        props.setFieldValue("travelers", filterOff)
    }
    return (
        <div className="grid grid-cols-2 p-2">
            <div className="flex items-center gap-1"> <div className="bg-gray-100 rounded-full p-1 border border-gray-200"><Profile size="14" /></div> {props.tag}</div>
            <div className="grid grid-cols-3 gap-2">
                <div onClick={decrement} className="size-6 rounded-full flex items-center justify-center cursor-pointer active:scale-105 transition-all border border-gray-300"> <FiMinus /> </div>
                <div className="">{props.value}</div>
                <div onClick={increment} className="size-6 rounded-full flex items-center justify-center cursor-pointer active:scale-105 transition-all border border-gray-300"> <FiPlus /> </div>
            </div>
        </div>
    )
}
