import type { transferFormProps, transferOfferPriceprops } from 'global'
import NewForminput from '~/components/general/NewForminput'
import Marker from '~/components/pageComponent/Marker'

type passengerComponentProps = {
    form: transferFormProps
    formField: any
    data: transferOfferPriceprops
}



export default function TransferPassengerComponent(props: passengerComponentProps) {
    return (
        <div>

            {props.form.passengers?.map((item, index) => (
                <SinglePassengerForm
                    form={props.formField}
                    data={props.data}
                    key={index}
                    index={index}
                    isEmail={index > 0 ? false : true}
                    item={item} />
            ))}
        </div>
    )
}

type singlePassengerComponentProps = {
    item: {
        firstName: string
        lastName: string
        email?: string
        phone?: string
        phoneCode?: string
        tag?: string
        service?: string
    }
    isEmail: boolean
    form: any
    index: number
    data: transferOfferPriceprops
}

function SinglePassengerForm(props: singlePassengerComponentProps) {

    function HandleServices(uid: string) {
        if (props.item.service === "") {
            props.form.setFieldValue(`passengers.${props.index}.service`, `${uid}`)
        } else {
            props.form.setFieldValue(`passengers.${props.index}.service`, ``)
        }
    }
    return (
        <div>
            <div className="px-3 py-2 font-bold text-primary bg-background border border-slate-100 rounded-lg mt-4">{props.item?.tag}</div>
            <div className="p-2">
                <div className="grid grid-cols-2 gap-2">
                    <NewForminput
                        content="First Name"
                        error={props.form.errors[`passengers.${props.index}.firstName`]}
                        {...props.form.getInputProps(`passengers.${props.index}.firstName`)}
                    />
                    <NewForminput
                        content="Last Name"
                        error={props.form.errors[`passengers.${props.index}.lastName`]}
                        {...props.form.getInputProps(`passengers.${props.index}.lastName`)}
                    />
                </div>
                {props.isEmail && <>
                    <NewForminput
                        content="Email Address"
                        error={props.form.errors[`passengers.${props.index}.email`]}
                        {...props.form.getInputProps(`passengers.${props.index}.email`)}
                    />
                    <NewForminput
                        content="Phone Number"
                        formtype="phone"
                        setup={(value) => props.form.setFieldValue(`passengers.${props.index}.phoneCode`, value.dial_code)}
                        error={props.form.errors[`passengers.${props.index}.phone`]}
                        {...props.form.getInputProps(`passengers.${props.index}.phone`)}
                    />
                </>}
                {(Number(props.data?.additional_services?.length) > 0 && props.item.tag?.toLowerCase().startsWith('child')) && <>
                    <Marker title={`Select ${props.item.tag} Seat`} />
                    <div className="grid grid-cols-2 gap-2">
                        {props.data?.additional_services?.filter(ele => ele.category === "baby_seat")?.map((item, index) => (
                            <div
                                onClick={() => HandleServices(item.uid)}
                                className={`border rounded-lg p-2 cursor-pointer hover:bg-secondary/10 transition-all hover:border-secondary! ${props.item.service && props.form.values.passengers.find((ele: { service: string, tag: string }) => (ele.service === item.uid && ele.tag === props.item.tag)) ? 'bg-secondary/10 border-secondary!' : 'border-gray-400'}`} key={index}>
                                <div className="flex items-center gap-2 text-xs!">
                                    <div> <div className={`size-4 border rounded-sm ${props.item.service && props.form.values.passengers.find((ele: { service: string, tag: string }) => (ele.service === item.uid && ele.tag === props.item.tag)) ? 'bg-primary border-primary' : 'border-gray-400 bg-white'}`}></div> </div>
                                    <div className="font-bold text-md capitalize">{item.type?.replace("_", " ")}</div>
                                </div>
                                <div className="text-[0.7rem] text-zinc-700">{item.name}</div>
                                <div className="font-extrabold">{item.charge?.currency} {Number(item.charge?.price ?? 0)?.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </>}
            </div>
        </div>
    )
}