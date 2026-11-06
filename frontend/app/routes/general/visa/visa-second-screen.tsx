
import { useForm } from "@mantine/form"
import dayjs from "dayjs"
import type { phoneSelectorSetup } from "global"
import { ArrowLeft, Minus } from "iconsax-reactjs"
import { GiPassport } from "react-icons/gi"
import { ApiCountries } from "~/components/general/ApiCountries"
import Formbutton from "~/components/general/Formbutton"
import NewForminput from "~/components/general/NewForminput"
import { IsaNumber } from "~/components/utils"
import type { fieldProps, formProps } from "~/routes/general/visa/types"
import { getAlert } from "~/services/get-alert"

type screenTwoComponentProps = {
    submitData: (value: formProps) => void
    fields: fieldProps | undefined;
    back: () => void;
    isLoading: boolean
}

const ExtraOptions = ["yes", 'no']

const buttonContents = [
    {type: 'appointment', content: "Book Appointment"},
    {type: 'fullPayment', content: "Pay Now & Start Process"},
    {type: 'enquiry', content: "Contact an agent"},
]

export default function ScreenTwoComponent(props: screenTwoComponentProps) {
    const isAppointment = buttonContents.find(ele => ele.type === props.fields?.paymentType)?.content
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            nationality: '',
            phoneCode: '+234',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            travelDate: null,
            hasPassport: 'no',
            passportNumber: '',
            message: ''
        },
        validate: {
            phoneCode: value => !value ? 'Country dial code is required' : null,
            nationality: value => !value ? 'Your Nationality is required' : null,
            firstName: value => !value ? 'First name is required' : null,
            lastName: value => !value ? 'Last name is required' : null,
            email: value => !value ? 'Email address is required' : null,
            phone: value => !value ? 'Phone number is required' : null,
            travelDate: value => !value ? 'Expected travel date is required' : null,
            hasPassport: value => !value ? 'Kindly confirm if you have a password already' : null,
            passportNumber: (value, values) => (values.hasPassport === "yes" && !value) ? 'Kindly provide your passport number' : null,
        }
    })



    async function HandleSubmission(values: typeof form.values) {
        try {
            const formdata = {
                ...values,
                phone: `${values.phoneCode}${values.phone}`
            }
            props.submitData(formdata)
        } catch (error) {
            getAlert(`${(error as Error).message}`, 'error')
        }
    }

    function setup(value: phoneSelectorSetup) {
        form.setFieldValue('phoneCode', value.dial_code || '')
    }

    return (
        <form onSubmit={form.onSubmit(HandleSubmission)} className="">
            <div className="bg-white lg:rounded-xl h-fit p-3">
                <div className="border-b pb-5 mb-5">
                    <div className="font-bold text-3xl flex items-center gap-2 cursor-pointer w-full" onClick={props.back}> <ArrowLeft />  <GiPassport /> Application Form</div>
                    <div className="font-semibold text-gray-500"> {props.fields?.country} <Minus className="inline size-4" /> {props.fields?.visaType} @ {IsaNumber(String(isAppointment ? props.fields?.fee : props.fields?.price))} </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <NewForminput
                        content="First Name"
                        error={form.errors.firstName?.toString() || ''}
                        {...form.getInputProps("firstName")}
                    />
                    <NewForminput
                        content="Last Name"
                        error={form.errors.lastName?.toString() || ''}
                        {...form.getInputProps("lastName")}
                    />
                    <NewForminput
                        content="Email address"
                        error={form.errors.email?.toString() || ''}
                        {...form.getInputProps("email")}
                    />
                    <NewForminput
                        formtype="phone"
                        content="Phone Number"
                        setup={setup}
                        error={form.errors.phone?.toString() || ''}
                        {...form.getInputProps("phone")}
                    />
                    <NewForminput
                        content="Nationality"
                        formtype="select"
                        searchable
                        options={ApiCountries.map((ele) => ele.name)}
                        error={form.errors.nationality?.toString() || ''}
                        {...form.getInputProps("nationality")}
                    />
                    <NewForminput
                        content="Expected Travel Date"
                        formtype="date"
                        minDate={dayjs().format("YYYY-MM-DD")}
                        valueName="travelDate"
                        error={form.errors.travelDate?.toString() || ''}
                        valueText={form.values.travelDate}
                        onChange={(e: any) => form.setFieldValue("travelDate", e)}
                        setFieldValue={form.setFieldValue}
                    />
                </div>
                <div className="">Do you have a passport?</div>
                <div className="grid grid-cols-2 ap-4 mb-4">
                    {ExtraOptions.map((item, index) => (
                        <div
                            onClick={() => form.setFieldValue("hasPassport", item)}
                            key={index} className="flex items-center w-fit gap-2 cursor-pointer uppercase">
                            <div className={`size-4 rounded-xs ${form.values.hasPassport === item ? 'bg-primary' : 'bg-slate-300'}`}></div>
                            <div className="">{item}</div>
                        </div>
                    ))}
                </div>
                {form.values.hasPassport === ExtraOptions[0] && <NewForminput
                    content="Passport Number"
                    error={form.errors.passportNumber?.toString() || ''}
                    {...form.getInputProps("passportNumber")}
                />}
                <NewForminput
                    formtype="textarea"
                    content="Have any message for us?"
                    error={form.errors.message?.toString() || ''}
                    {...form.getInputProps("message")}
                />
                <Formbutton title={String(isAppointment)} loading={props.isLoading} />
            </div>
        </form>
    )
}