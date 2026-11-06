import type { transferFormProps } from 'global'
import { Profile } from 'iconsax-reactjs'
import { FiMinus, FiPlus } from 'react-icons/fi'

type passengerProps = {
    tag: string
    tagName: string
    value: number
    otherValue: number
    capacity: number
    setFieldValue: (tag: string, value: any) => void
    form: transferFormProps
}



export default function TransferSinglePassengerFlowComponent(props: passengerProps) {
    const isAdult = props.tag?.toLowerCase() === "adults"
    const limit = isAdult ? 1 : 0

    function increment() {
        // value must to exceed the total limit from the API
        if ((props.value + props.otherValue) >= props.capacity) return
        const newValue = props.value + 1
        const newTag = isAdult ? `Adult No.${newValue}` : `Child No.${newValue}`

        const newField = { firstName: '', lastName: '', tag: newTag, service: '' }
        const newPassenger = [...props.form.passengers, newField]

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
        props.setFieldValue("passengers", newPassenger)
    }

    function decrement() {
        if (props.value <= limit) return
        const newValue = props.value - 1

        const newTag = isAdult ? `Adult No.${props.value}` : `Child No.${props.value}`

        // find for passenger based on the newTag
        const filterOff = props.form.passengers.filter(ele => ele.tag !== newTag)

        props.setFieldValue(props.tagName, newValue)
        props.setFieldValue("passengers", filterOff)
    }
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2 font-semibold"> <div className="size-8 bg-background rounded-full flex items-center justify-center text-zinc-500"><Profile size="16" /></div> {props.tag}</div>
            <div className="flex items-center gap-4">
                <button type="button" aria-label={`Remove ${props.tag}`} onClick={decrement} disabled={props.value <= limit} className="size-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all border border-slate-300 hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"> <FiMinus /> </button>
                <div className="w-5 text-center font-bold text-base">{props.value}</div>
                <button type="button" aria-label={`Add ${props.tag}`} onClick={increment} disabled={(props.value + props.otherValue) >= props.capacity} className="size-8 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-all border border-slate-300 hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"> <FiPlus /> </button>
            </div>
        </div>
    )
}

