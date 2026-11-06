import type { singlePlaceProps, transferOfferPriceprops } from 'global'
import { ArrowLeft, ArrowRight, Profile2User } from 'iconsax-reactjs'
import { RiLuggageCartFill } from 'react-icons/ri'
import { useForm } from '@mantine/form'
import { FiAlertTriangle, FiCheck } from 'react-icons/fi'
import { Apis, Post } from '~/services/apis'
import { useNavigate, useSearchParams } from 'react-router'
import { convert } from 'html-to-text'
import Currencies from '~/components/general/Currencies'
import { PickupOptions, TransferOptionType } from '~/components/utils'
import { getAlert } from '~/services/get-alert'
import NewForminput from '~/components/general/NewForminput'
import DateTimeComponent from '~/routes/general/home/components/transfers/display-search-component/transfer-date-time'
import Marker from '~/components/pageComponent/Marker'
import TransferSinglePassengerFlowComponent from '~/routes/general/home/components/transfers/display-search-component/transfer-single-passenger'
import Formbutton from '~/components/general/Formbutton'
import TransferPassengerComponent from '~/routes/general/home/components/transfers/display-search-component/transfer-passenger'
import dayjs from 'dayjs'
import PaymentOptions from '~/components/payment/payment-options'
import { LoadingOverlay } from '@mantine/core'
import { PAYMENT_METHODS } from '~/components/payment/enums'

type componentProps = {
    data: transferOfferPriceprops
    airportReturn: transferOfferPriceprops | null
    origin: singlePlaceProps | null
    destination: singlePlaceProps | null
    durations: string[]
    isTransfer: string
    onClose: () => void
    transferType: string
}


export default function BookAirportTransfer(props: componentProps) {
    const [searchParams,] = useSearchParams()
    const transferType = searchParams.get("transferType")
    const getCurrency = Currencies.find(ele => ele.abbreviation === props.data?.charge?.currency)?.symbol
    const currency = convert(getCurrency || '')
    const navigate = useNavigate()
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            adults_amount: 1,
            children_amount: 0,
            date: null,
            time: '',
            paymen_method: '',
            flight_number: '',
            terminal_number: '',
            train_number: '',
            departureDate: null,
            departureTime: '',
            returnPickupTime: null,
            tollroad: '',
            returnTerminal: '',
            duration: props.data?.minimum_duration_count?.toString() ?? "5",
            train_carriage_number: '',
            passengers: [
                {
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    tag: 'Adult No.1',
                    phoneCode: '+234',
                    service: ''
                },
            ]
        },
        validate: {
            date: value => ((props.origin?.airportStart && !props.destination?.airportStart) && !value) ? 'Arrival Date is required' : null,
            paymen_method: value => (!value) ? 'Kindly select your preferred payment method' : null,
            time: value => ((props.origin?.airportStart && !props.destination?.airportStart) && !value) ? 'Arrival Time is required' : null,
            duration: value => (props.data?.pickup_type === PickupOptions.CHAUFFEUR && !value) ? 'Duration is required' : null,
            departureDate: value => ((!props.origin?.airportStart || props.destination?.airportStart || props?.airportReturn?.car_id) && !value) ? 'Departure date is required' : null,
            departureTime: value => ((!props.origin?.airportStart || props.destination?.airportStart || props?.airportReturn?.car_id) && !value) ? 'Departure time is required' : null,
            returnPickupTime: value => ((props.destination?.airportStart || props?.airportReturn?.car_id) && !value) ? 'Return pickup time is required' : null,
            passengers: {
                firstName: (value) => !value ? `First name is required` : null,
                lastName: (value) => !value ? `Last Name is required` : null,
                email: (value, values) => (!values.passengers[0].email && !value) ? `Email address is required` : null,
                phone: (value, values) => (!values.passengers[0].phone && !value) ? `Phone Number is required is required` : (!values.passengers[0].phoneCode) ? 'Country dial code is required' : null,
            }
        },
    })
    async function HandleSubmission(values: typeof form.values) {
        try {
            if (!values.passengers?.length)
                return getAlert("Passengers are required", 'error');

            // ✅ Child seat validation
            for (const passenger of values.passengers) {
                if (
                    props.data?.pickup_type === PickupOptions.TRANSFER &&
                    passenger.tag?.toLowerCase().startsWith("child") &&
                    !passenger.service
                ) {
                    return getAlert(
                        `Kindly select a seater for ${passenger.tag}`, 'error'
                    );
                }
            }

            const leadPassenger = values.passengers[0];

            // ✅ Format passengers
            const passengers = values.passengers.map(ele => ({
                name: `${ele.firstName} ${ele.lastName}`,
                email: leadPassenger.email,
                phone: `${leadPassenger.phoneCode}${leadPassenger.phone}`
            }));

            // ✅ Format additional services
            const addsServices = values.passengers.reduce((acc, ele) => {
                const service = props.data?.additional_services
                    ?.find(val => val.uid === ele.service);

                if (service) acc.push({ id: service.id });

                return acc;
            }, [] as any[]);

            // if toll road is selected
            if (values.tollroad) {
                const tollService = props.data?.additional_services
                    ?.find(val => val.uid === values.tollroad);
                if (tollService) addsServices.push({ id: tollService.id });
            }



            // ✅ Finish location logic
            const finishLocation =
                props.data?.pickup_type === PickupOptions.TRANSFER
                    ? {
                        finish_location: {
                            place_id: props.destination?.place_id,
                            time: props.destination?.airportStart ? `${values.departureDate} ${values.departureTime}` : "",
                            address: props.destination?.address,
                            location: `${props.destination?.lat},${props.destination?.lng}`,
                            terminal_number: ""
                        }
                    }
                    : {};

            // ✅ Base trip
            const trip = [
                {
                    price_id: props.data?.price_id,
                    additional_locations: [],
                    currency: props.data?.currency,
                    is_rent: props.data?.pickup_type === PickupOptions.CHAUFFEUR,
                    duration:
                        props.data?.pickup_type === PickupOptions.TRANSFER
                            ? null
                            : values.duration,

                    start_location: {
                        place_id: props.origin?.place_id,
                        time: props.destination?.airportStart
                            ? values.returnPickupTime
                            : props.origin?.airportStart
                                ? `${values.date} ${values.time}`
                                : `${values.departureDate} ${values.departureTime}`,
                        flight_number: values.flight_number,
                        terminal_number: values.terminal_number,
                        address: props.origin?.address,
                        location: `${props.origin?.lat},${props.origin?.lng}`
                    },

                    ...finishLocation,

                    passengers_number: passengers.length,
                    adults_amount: values.adults_amount,
                    children_amount: values.children_amount,
                    passengers,

                    platform: 7,
                    pos: null,
                    text_tablet: props.destination?.airportStart ? '' : `${leadPassenger.firstName} ${leadPassenger.lastName}`,
                    comment: "",
                    hash: "",
                    additional_address: false,
                    additional_services: addsServices,
                    viewers: [""]
                }
            ];

            // ✅ Airport return flow
            if (props.airportReturn?.car_id) {

                // ✅ Format additional services
                const addsServices2 = values.passengers.reduce((acc, ele) => {
                    const service = props.airportReturn?.additional_services
                        ?.find(val => val.uid === ele.service);

                    if (service) acc.push(service);

                    return acc;
                }, [] as any[]);

                trip.push({
                    price_id: props.airportReturn?.price_id,
                    additional_locations: [],
                    currency: props.airportReturn?.currency,
                    is_rent: props.airportReturn?.pickup_type === PickupOptions.CHAUFFEUR,
                    duration:
                        props.airportReturn?.pickup_type === PickupOptions.TRANSFER
                            ? null
                            : values.duration,

                    start_location: {
                        place_id: props.destination?.place_id,
                        time: String(form.values.returnPickupTime),
                        flight_number: "",
                        terminal_number: "",
                        address: props.destination?.address,
                        location: `${props.destination?.lat},${props.destination?.lng}`
                    },
                    finish_location: {
                        place_id: props.origin?.place_id,
                        time: `${values?.departureDate} ${values?.departureTime}`,
                        address: props.origin?.address,
                        location: `${props.origin?.lat},${props.origin?.lng}`,
                        terminal_number: values.returnTerminal
                    },
                    passengers_number: passengers.length,
                    adults_amount: values.adults_amount,
                    children_amount: values.children_amount,
                    passengers,

                    platform: 7,
                    pos: null,
                    text_tablet: props.destination?.airportStart ? '' : `${leadPassenger.firstName} ${leadPassenger.lastName}`,
                    comment: "",
                    hash: "",
                    additional_address: false,
                    additional_services: addsServices2,
                    viewers: [""]
                });
            }

            const fields = {
                currency: props.data?.charge?.currency,
                pickup_type: props.data?.pickup_type?.toUpperCase(),
                payment_method: values.paymen_method,
                trip
            };

            const response = await Post(Apis.iway.create_order, fields);
            if (fields.payment_method === PAYMENT_METHODS.direct_bank_transfer) {
                return navigate(`/upload-payment/${response.attachment}`);
            }

            if (fields.payment_method === PAYMENT_METHODS.unified_payment_transfer) {
                return window.location.href = response.url
            }

        } catch (error) {
            getAlert((error as Error).message, 'error');
        }
    }


    function HandleServices(uid: string) {
        if (form.values.tollroad === uid) {
            form.setFieldValue("tollroad", '')
        } else {
            form.setFieldValue("tollroad", uid)
        }
    }

    function paymentoptionAction(value: string) {
        form.setFieldValue("paymen_method", value)
    }

    return (
        <>
            <form onSubmit={form.onSubmit(HandleSubmission)} className="grid grid-cols-1 lg:grid-cols-8 gap-5 w-11/12 mx-auto my-7">
                <div className="lg:col-span-5 h-fit">
                    <button type="button" onClick={props.onClose} className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-4 cursor-pointer hover:gap-3 transition-all"> <ArrowLeft size="16" /> Back to results</button>
                    <div className="bg-white border border-slate-200 p-4 md:p-6 rounded-2xl">
                    <div className='text-sm! relative'>
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 rounded-xl bg-background border border-slate-100">
                            <div className="w-24 h-16 shrink-0 rounded-lg bg-white flex items-center justify-center p-1">
                                <img src={`${props.data?.car_photo ? props.data.car_photo : "/images/van.jpg"}`} loading="lazy" alt={props.data?.car_title} className="max-h-full w-auto object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-extrabold text-lg text-primary">{props.data?.car_title}</div>
                                <div className="text-sm text-zinc-500">{props.data?.car_model}</div>
                                <div className="flex items-center flex-wrap gap-2 mt-1.5">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs font-semibold text-zinc-600"> <Profile2User size="13" /> {props.data?.car_capacity} passengers</span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs font-semibold text-zinc-600"> <RiLuggageCartFill /> {props.data?.car_luggage_capacity} bags</span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="font-extrabold text-lg text-primary">{currency}{Number(props.data?.charge?.amount)?.toLocaleString()}</div>
                                {props.data?.pickup_type === PickupOptions.CHAUFFEUR && <>
                                    <div className="text-xs text-zinc-500">Min. {props.data.minimum_duration_text} x {currency}{Number(props.data?.charge?.price_per_hour)?.toLocaleString()}/hr</div>
                                    <div className="text-xs text-zinc-500">Delivery: {currency}{Number(props.data?.charge?.delivery_costs)?.toLocaleString()}</div>
                                </>}
                            </div>
                        </div>
                        <div className="my-5">
                            {props.origin?.airportStart ? <div className="border border-slate-200 rounded-xl p-4">
                                <div className="mb-4 pb-3 border-b border-slate-100 text-primary">
                                    <span className="font-bold">{props?.origin?.address}</span>
                                    {props.isTransfer === 'true' && <>
                                        <ArrowRight className='inline size-4 mx-3' />
                                        {props.destination?.address}
                                    </>}
                                </div>
                                <NewForminput
                                    content="Flight Number"
                                    placeholder="e.g. BA0075"
                                    error={form.errors.flight_number?.toString() || ''}
                                    {...form.getInputProps("flight_number")}
                                />
                                <NewForminput
                                    content="Arrival Terminal"
                                    formtype="select"
                                    options={["1", "2", "3", "4", "5"]}
                                    error={form.errors.terminal_number?.toString() || ''}
                                    {...form.getInputProps("terminal_number")}
                                />
                                <DateTimeComponent
                                    price_id={String(props.data?.price_id)}
                                    tag="pickup"
                                    form={form}
                                    airportStart={props.origin?.airportStart}
                                />
                                {props.data?.pickup_type === PickupOptions.CHAUFFEUR && <>
                                    <NewForminput
                                        content="Rental Duration (hrs)"
                                        formtype="select"
                                        options={props.durations}
                                        key={form.key("duration")}
                                        error={form.errors.duration?.toString() || ''}
                                        {...form.getInputProps("duration")}
                                    />
                                    <div className="text-right font-medium mb-10">{Number(form.values.duration)}<span className="text-slate-500">h</span> x <span className="text-slate-500">{currency}</span>{props.data?.charge?.price_per_hour?.toLocaleString()} + <span className="text-slate-500">Delivery</span> <span className="text-slate-500">{currency}</span>{props.data?.charge?.delivery_costs?.toLocaleString()}</div>
                                </>}
                            </div> : !props.destination?.airportStart ? <div className="border border-slate-200 rounded-xl p-4">
                                <div className="mb-4 pb-3 border-b border-slate-100 text-primary">
                                    <span className="font-bold">{props?.origin?.address}</span>
                                    {props.isTransfer === 'true' && <>
                                        <ArrowRight className='inline size-4 mx-3' />
                                        {props.destination?.address}
                                    </>}
                                </div>
                                <DateTimeComponent
                                    price_id={String(props.data?.price_id)}
                                    tag="departure"
                                    form={form}
                                    airportStart={false}
                                    departureAsPickup
                                />
                                {props.data?.pickup_type === PickupOptions.CHAUFFEUR && <>
                                    <NewForminput
                                        content="Rental Duration (hrs)"
                                        formtype="select"
                                        options={props.durations}
                                        key={form.key("duration")}
                                        error={form.errors.duration?.toString() || ''}
                                        {...form.getInputProps("duration")}
                                    />
                                    <div className="text-right font-medium mb-10">{Number(form.values.duration)}<span className="text-slate-500">h</span> x <span className="text-slate-500">{currency}</span>{props.data?.charge?.price_per_hour?.toLocaleString()} + <span className="text-slate-500">Delivery</span> <span className="text-slate-500">{currency}</span>{props.data?.charge?.delivery_costs?.toLocaleString()}</div>
                                </>}
                            </div> : ''}

                            {/* ==================================  if transfer type is return ===== */}

                            {(transferType === TransferOptionType.return.title) &&
                                <DisplayReturnCompponent
                                    form={form}
                                    isTransfer={props?.isTransfer ? true : false}
                                    destination={props.destination}
                                    origin={props.origin}
                                    data={props.data}
                                    reverse={true}
                                />
                            }

                            {props.destination?.airportStart &&
                                <DisplayReturnCompponent
                                    form={form}
                                    isTransfer={props?.isTransfer ? true : false}
                                    destination={props.destination}
                                    origin={props.origin}
                                    data={props.data}
                                    reverse={false}
                                />
                            }
                            {(Number(props.data?.additional_services?.length) && props.data?.additional_services?.find(ele => ele.category === "tollroad")) ? <>
                                <Marker title="Toll Road Service" />
                                <div className="grid grid-cols-2 gap-2">
                                    {props.data?.additional_services?.filter(ele => ele.category === "tollroad")?.map((item, index) => (
                                        <div
                                            onClick={() => HandleServices(item.uid)}
                                            className={`border rounded-xl p-3 cursor-pointer hover:bg-secondary/10 transition-all hover:border-secondary! ${form.values.tollroad === item.uid ? 'bg-secondary/10 border-secondary!' : 'border-gray-400'}`} key={index}>
                                            <div className="flex items-center gap-2 text-xs!">
                                                <div> <div className={`size-4 border rounded-sm flex items-center justify-center text-[0.6rem] ${form.values.tollroad === item.uid ? 'bg-primary border-primary text-white' : 'border-gray-400 bg-white text-transparent'}`}><FiCheck /></div> </div>
                                                <div className="font-bold text-md capitalize">{item.type?.replace("_", " ")}</div>
                                            </div>
                                            <div className="text-[0.7rem] text-zinc-700">{item.name}</div>
                                            <div className="font-extrabold">{item.charge?.currency} {Number(item.charge?.price ?? 0)?.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </> : null}
                            <Marker title="Passenger's Informations" />
                            <div>
                                <div className='text-sm!'>
                                    <TransferSinglePassengerFlowComponent
                                        form={form.values}
                                        capacity={Number(props.data?.car_capacity)}
                                        tagName="adults_amount"
                                        tag="Adults"
                                        value={form.values.adults_amount}
                                        otherValue={form.values.children_amount}
                                        setFieldValue={form.setFieldValue} />
                                    <TransferSinglePassengerFlowComponent
                                        form={form.values}
                                        capacity={Number(props.data?.car_capacity)}
                                        tagName="children_amount"
                                        tag="Children"
                                        value={form.values.children_amount}
                                        otherValue={form.values.adults_amount}
                                        setFieldValue={form.setFieldValue} />
                                </div>
                            </div>
                            <TransferPassengerComponent form={form.values} formField={form} data={props.data} />
                        </div>
                    </div>
                    </div>
                </div>
                <div className="lg:col-span-3">
                    <div className="sticky top-20 space-y-4">
                        <div className="relative space-y-4">
                            <LoadingOverlay visible={form.submitting} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                            <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                                <div className="font-bold text-lg text-primary mb-3">Trip summary</div>
                                <dl className="text-sm space-y-2">
                                    <div className="flex justify-between gap-3"><dt className="text-zinc-500">Vehicle</dt><dd className="font-semibold text-right">{props.data?.car_title}</dd></div>
                                    <div className="flex justify-between gap-3"><dt className="text-zinc-500">From</dt><dd className="font-semibold text-right">{props.origin?.address}</dd></div>
                                    {props.isTransfer === 'true' && props.destination?.address && <div className="flex justify-between gap-3"><dt className="text-zinc-500">To</dt><dd className="font-semibold text-right">{props.destination.address}</dd></div>}
                                    {transferType && <div className="flex justify-between gap-3"><dt className="text-zinc-500">Trip</dt><dd className="font-semibold text-right capitalize">{transferType}</dd></div>}
                                    <div className="flex justify-between gap-3"><dt className="text-zinc-500">Passengers</dt><dd className="font-semibold text-right">{Number(form.values.adults_amount) + Number(form.values.children_amount)}</dd></div>
                                </dl>
                                <div className="flex items-center justify-between border-t border-dashed border-slate-200 mt-4 pt-4">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-extrabold text-2xl text-primary">{currency}{Number(props.data?.charge?.amount)?.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className={`bg-white border p-5 rounded-2xl ${form.errors.paymen_method ? 'border-red-300' : 'border-slate-200'}`}>
                                <PaymentOptions
                                    sendData={paymentoptionAction}
                                />
                                {form.errors.paymen_method && <div className="text-red-500 text-sm mt-3">{form.errors.paymen_method?.toString()}</div>}
                            </div>
                            <div className="flex gap-3 rounded-2xl border border-amber-200 text-amber-800 bg-amber-50 text-xs p-4">
                                <FiAlertTriangle className="shrink-0 text-base mt-0.5" />
                                <div><span className="font-bold">Please double-check your details.</span> Fill every field with exact information. You are liable for any inaccurate information you share.</div>
                            </div>
                            <Formbutton title="Proceed to Submission" loading={form.submitting} bg="bg-primary text-white hover:bg-primary/90 border-0 py-4! text-sm! font-semibold" />
                        </div>
                    </div>
                </div>
            </form>
        </>
    )
}

type displayReturnProps = {
    form: any
    isTransfer: boolean
    destination: singlePlaceProps | null
    origin: singlePlaceProps | null
    data: transferOfferPriceprops
    reverse: boolean
}

function DisplayReturnCompponent(props: displayReturnProps) {
    return (
        <div className="border border-slate-200 rounded-xl p-4 mt-4">
            <div className="">
                {(props.isTransfer && props.reverse) && <div className='mb-2'>
                    <span className="font-bold">{props?.destination?.address}</span>
                    <ArrowRight className='inline size-4 mx-3' />
                    {props.origin?.address}
                </div>}
                {(!props.reverse) && <div className='mb-2'>
                    <span className="font-bold">{props?.origin?.address}</span>
                    <ArrowRight className='inline size-4 mx-3' />
                    {props.destination?.address}
                </div>}
            </div>
            <NewForminput
                content="Departure Terminal"
                formtype="select"
                options={["1", "2", "3", "4", "5"]}
                error={props.form.errors.returnTerminal?.toString() || ''}
                {...props.form.getInputProps("returnTerminal")}
            />
            <DateTimeComponent
                price_id={String(props.data?.price_id)}
                tag="departure"
                pickup_date={`${props.form.values.date} ${props.form.values.time}`}
                form={props.form}
                airportStart={props.destination?.airportStart || false}
            />
            <div className="relative">
                <NewForminput
                    formtype="datetime"
                    content="Pick-up Date & Time"
                    minDate={dayjs().toString()}
                    maxDate={String(props.form.values.departureDate)}
                    error={props.form.errors.returnPickupTime?.toString() || ''}
                    valueText={props.form.values.returnPickupTime}
                    valueName="returnPickupTime"
                    onChange={(e: any) => {props.form.setFieldValue("returnPickupTime", e); console.log(e)}}
                />
            </div>
        </div>
    )
}