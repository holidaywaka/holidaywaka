import type { PackageEnquiryProps, TripProps } from "global"
import SinglePassengerForm from "~/routes/general/packages/form/trip-single-passenger-form"

type props = {
    form: PackageEnquiryProps
    formField: any
    data: TripProps | undefined
}

export default function PassengerComponent(props: props) {
    return (
        <div>

            {props.form.travelers?.map((item, index) => (
                <SinglePassengerForm
                    form={props.formField}
                    data={props.data}
                    key={index}
                    index={index}
                    isEmail={index > 0 ? false : true}
                    adultsCount={Number(props.form.adults_amount ?? 0)}
                    item={item} />
            ))}
        </div>
    )
}
