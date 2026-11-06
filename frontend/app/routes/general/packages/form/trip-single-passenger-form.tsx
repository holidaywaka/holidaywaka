import type { TripProps } from "global"
import NewForminput from "~/components/general/NewForminput"
import { isSoloLocked, soloPrice } from "~/routes/general/packages/form/package-pricing"


const GenderOptions = ['Male', 'Female']


type props = {
    item: {
        firstName: string
        lastName: string
        email?: string
        gender: string
        phone?: string
        phoneCode?: string
        tag?: string
        priceAmount?: string
        priceType?: string
    }
    isEmail: boolean
    form: any
    index: number
    data: TripProps | undefined
    adultsCount: number
}

export default function SinglePassengerForm(props: props) {
    const pricings = (props.data?.prices ?? []).map((item) => ({
        label: `${props.data?.symbol}${Number(item.price)?.toLocaleString()} - ${item.priceType}`,
        value: item.priceType,
    }))
    // Private trip for a single adult: the solo price applies and cannot be changed
    const locked = isSoloLocked(props.data, props.adultsCount, props.item?.tag)
    const solo = soloPrice(props.data)

    function selectPrice(priceType: string | null) {
        const entry = props.data?.prices?.find((item) => item.priceType === priceType)
        props.form.setFieldValue(`travelers.${props.index}.priceType`, entry?.priceType ?? '')
        props.form.setFieldValue(`travelers.${props.index}.priceAmount`, entry ? String(Number(entry.price)) : '')
    }

    return (
        <div>
            <div className="p-2 font-bold bg-gray-200/60 border border-gray-200 rounded-lg">{props.item?.tag}</div>
            <div className="p-2">
                <div className="grid grid-cols-2 gap-2">
                    <NewForminput
                        content="First Name"
                        error={props.form.errors[`travelers.${props.index}.firstName`]}
                        {...props.form.getInputProps(`travelers.${props.index}.firstName`)}
                    />
                    <NewForminput
                        content="Last Name"
                        error={props.form.errors[`travelers.${props.index}.lastName`]}
                        {...props.form.getInputProps(`travelers.${props.index}.lastName`)}
                    />
                </div>
                {props.isEmail && <>
                    <NewForminput
                        content="Email Address"
                        error={props.form.errors[`travelers.${props.index}.email`]}
                        {...props.form.getInputProps(`travelers.${props.index}.email`)}
                    />
                    <NewForminput
                        content="Phone Number"
                        formtype="phone"
                        setup={(value) => props.form.setFieldValue(`travelers.${props.index}.phoneCode`, value.dial_code)}
                        error={props.form.errors[`travelers.${props.index}.phone`]}
                        {...props.form.getInputProps(`travelers.${props.index}.phone`)}
                    />
                </>}
                <NewForminput
                    formtype="select"
                    content="--Select Gender--"
                    error={props.form.errors[`travelers.${props.index}.gender`]}
                    {...props.form.getInputProps(`travelers.${props.index}.gender`)}
                    options={GenderOptions}
                />
                <NewForminput
                    formtype="select"
                    content="--Select Pricing--"
                    error={props.form.errors[`travelers.${props.index}.priceAmount`]}
                    value={locked ? solo?.priceType : props.item?.priceType || undefined}
                    onChange={(value: string | null) => selectPrice(value)}
                    readOnly={locked}
                    options={pricings}
                />
                {locked && <div className="text-xs text-zinc-500 -mt-2 mb-2">One adult on a private trip travels at the solo / single occupancy price.</div>}
            </div>
        </div>
    )
}
