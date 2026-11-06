import { useForm } from '@mantine/form'
import dayjs from 'dayjs'
import type { PackageEnquiryProps, tripInfoProps, TripProps } from 'global'
import React from 'react'
import Formbutton from '~/components/general/Formbutton'
import NewForminput from '~/components/general/NewForminput'
import { TripTypeOptions } from '~/components/utils'
import ViewTripSummary from '~/routes/general/packages/form/view-trip-summary'
import { minTravelDate } from '~/routes/general/packages/form/package-pricing'

type props = {
    singleData: TripProps | undefined;
    sendData: (value: tripInfoProps) => void;
    fields: tripInfoProps | undefined
    back: () => void;
}

export default function StageTwo(props: props) {
    const [info, setInfo] = React.useState<{
        package: TripProps | null | undefined
        form: PackageEnquiryProps
        totalPayment: number
    }>({
        package: null,
        form: {},
        totalPayment: 0
    })
    const getStartDate = props.singleData?.tripType === TripTypeOptions.group ? `${dayjs(props.singleData.startDate).format("YYYY-MM-DD")}` : null
    const earliest = minTravelDate(props.singleData)
    const visaDays = Number(props.singleData?.visaProcessingDays ?? 0)
    const needsVisa = Boolean(props.singleData?.visaRequired) && visaDays > 0
    // A group departs on its start date; it is closed when that is sooner than the visa can be ready
    const groupTooSoon = props.singleData?.tripType === TripTypeOptions.group && needsVisa && Boolean(getStartDate) && dayjs(getStartDate).isBefore(earliest, 'day')
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            travelDate: props.fields?.form?.travelDate ?? getStartDate,
            message: props.fields?.form?.message ?? '',
        },
        validate: {
            travelDate: value => !value
                ? 'Expected travel date is required'
                : (props.singleData?.tripType !== TripTypeOptions.group && dayjs(value).isBefore(earliest, 'day'))
                    ? `The earliest travel date for this package is ${earliest.format('D MMM YYYY')}`
                    : null,
        },
    })

    function HandleSubmission(values: typeof form.values) {

        const total = {
            ...values,
            ...props.fields?.form
        }


        const totalPayment = total?.travelers?.reduce((acc, curr) => acc + Number(curr.priceAmount), 0) || 0
        const valuesToSave = {
            totalPayment,
            package: props.singleData,
            form: total
        }
        setInfo(valuesToSave)
        props.sendData(valuesToSave)
    }

    return (
        <>
            <ViewTripSummary info={props.fields} />
            <form className='bg-white border border-slate-200 p-4 md:rounded-lg' onSubmit={form.onSubmit(HandleSubmission)}>
                {needsVisa && (
                    <div className={`mb-4 rounded-lg border p-3 text-sm ${groupTooSoon ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                        {groupTooSoon
                            ? `This departure leaves on ${dayjs(getStartDate).format('D MMM YYYY')}, but the visa takes ${visaDays} working days to process, so it can no longer be booked. Please choose another package or contact us.`
                            : `A visa is required for this package. It takes about ${visaDays} working days to process, so the earliest travel date is ${earliest.format('ddd, D MMM YYYY')}.`}
                    </div>
                )}
                {props.singleData?.tripType !== TripTypeOptions.group && <NewForminput
                    content="Travel Date"
                    formtype="date"
                    valueText={form.values.travelDate}
                    onChange={(e: any) => form.setFieldValue("travelDate", e)}
                    setFieldValue={form.setFieldValue}
                    minDate={earliest.toDate().toISOString()}
                    error={form.errors.travelDate?.toString() || ''}
                />}
                <NewForminput
                    {...form.getInputProps("message")}
                    content="Special Request?"
                    formtype="textarea"
                    error={form.errors.message?.toString() || ''}
                />
                <div className="mt-10 grid grid-cols-1 md:grid-cols-7 items-center gap-2">
                    <div className="md:col-span-2 order-2 md:order-1"><button onClick={props.back} className="w-full cursor-pointer hover:bg-background transition-all py-3 rounded-lg">Back</button></div>
                    <div className="md:col-span-5 order-1 md:order-2">
                        <Formbutton
                            title="Next"
                            loading={form.submitting}
                            disabled={groupTooSoon}
                        />
                    </div>
                </div>
            </form>
        </>
    )
}
