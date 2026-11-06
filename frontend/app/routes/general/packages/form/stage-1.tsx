import React from "react"
import { useForm } from "@mantine/form"
import type { PackageEnquiryProps, tripInfoProps, TripProps } from "global"
import Formbutton from "~/components/general/Formbutton"
import { BackToTop } from "~/components/utils"
import PassengerComponent from "~/routes/general/packages/form/trip-passenger-component"
import SinglePassengerFlowComponent from "~/routes/general/packages/form/trip-single-passenger"
import { isSoloLocked, soloPrice } from "~/routes/general/packages/form/package-pricing"

type props = {
    singleData: TripProps | undefined;
    sendData: (value: PackageEnquiryProps) => void;
    fields: PackageEnquiryProps | undefined
}


export default function StageOne(props: props) {
    // Controlled: the pricing rules below react to the number of adults
    const form = useForm({
        mode: "controlled",
        initialValues: {
            adults_amount: props.fields?.adults_amount ?? 1,
            children_amount: props.fields?.children_amount ?? 0,
            infant_amount: props.fields?.infant_amount ?? 0,
            travelers: props.fields?.travelers ?? [
                {
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    gender: '',
                    tag: 'Adult No.1',
                    phoneCode: '+234',
                    priceAmount: '',
                    priceType: '',
                },
            ]
        },
        validate: {
            travelers: {
                priceAmount: (value) => !value ? `Price amount is required` : null,
                firstName: (value) => !value ? `First name is required` : null,
                lastName: (value) => !value ? `Last Name is required` : null,
                gender: (value) => !value ? `Gender field is required` : null,
                email: (value, values) => (!values.travelers[0].email && !value) ? `Email address is required` : null,
                phone: (value, values) => (!values.travelers[0].phone && !value) ? `Phone Number is required is required` : (!values.travelers[0].phoneCode) ? 'Country dial code is required' : null,
            }
        },
    })

    // One adult on a private trip: apply the solo price automatically
    const adults = Number(form.values.adults_amount)
    React.useEffect(() => {
        const solo = soloPrice(props.singleData)
        if (!solo) return
        form.values.travelers.forEach((traveler, index) => {
            if (isSoloLocked(props.singleData, adults, traveler.tag) && traveler.priceType !== solo.priceType) {
                form.setFieldValue(`travelers.${index}.priceType`, solo.priceType)
                form.setFieldValue(`travelers.${index}.priceAmount`, String(Number(solo.price)))
            }
        })
    }, [adults, form.values.travelers.length, props.singleData?.id])

    function HandleSubmission(values: typeof form.values) {
        props.sendData(values)
        BackToTop()
    }
    return (
        <div className="bg-white border border-slate-200 p-4 md:rounded-lg">
            <form onSubmit={form.onSubmit(HandleSubmission)}>

                <SinglePassengerFlowComponent
                    form={form.values}
                    tagName="adults_amount"
                    tag="Adults"
                    value={form.values.adults_amount}
                    setFieldValue={form.setFieldValue} />

                <SinglePassengerFlowComponent
                    form={form.values}
                    tagName="children_amount"
                    tag="Child"
                    value={form.values.children_amount}
                    setFieldValue={form.setFieldValue} />

                <SinglePassengerFlowComponent
                    form={form.values}
                    tagName="infant_amount"
                    tag="Infants"
                    value={form.values.infant_amount}
                    setFieldValue={form.setFieldValue} />
                <PassengerComponent form={form.values} formField={form} data={props.singleData} />

                <div className="mt-10">
                    <Formbutton
                        title="Save and continue"
                        loading={form.submitting}
                    />
                </div>
            </form>
        </div>
    )
}
