
import dayjs from 'dayjs'
import NewForminput from '~/components/general/NewForminput'
import { displaysTiming } from '~/components/utils'
import { getAlert } from '~/services/get-alert'
import { createResponse, NewApis } from '~/services/new-apis'
import { useEffect, useRef, useState } from 'react'

type Props = {
    form: any
    price_id: string
    pickup_date?: string
    tag: 'pickup' | 'departure'
    airportStart: boolean
    departureAsPickup?: boolean
}
export default function DateTimeComponent(props: Props) {

    if (props.tag === "pickup") return <PickupComponent {...props} />
    if (props.tag === "departure") return <DepartureComponent {...props} />
}


function PickupComponent({ form, price_id }: Props) {
    const [checksInProgress, setChecksInProgress] = useState(0)
    const [checkError, setCheckError] = useState('')
    const errorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (errorTimeout.current) clearTimeout(errorTimeout.current)
    }, [])

    form.watch("time", (values: { value: string }) => handleCheckTime(values.value))

    async function handleCheckTime(value: string) {
        if (!form.values.date) return getAlert(`Provide date to check for time availability`, 'info')
        if (errorTimeout.current) clearTimeout(errorTimeout.current)
        setCheckError('')
        setChecksInProgress(count => count + 1)
        try {
            const body = {
                pickup_time: `${form.values.date} ${value}`,
                departure_time: "",
                price_id
            }
            const response = await createResponse({
                endpoint: NewApis.v4.check_time,
                method: "POST",
                data: body
            })
            if (!response.allow_booking) {
                const message = 'Booking not allowed at the designated time, kindly provide a different time'
                setCheckError(message)
                errorTimeout.current = setTimeout(() => setCheckError(''), 5000)
                getAlert(message, 'error')
            }
        } catch (error) {
            const message = (error as Error).message
            setCheckError(message)
            errorTimeout.current = setTimeout(() => setCheckError(''), 5000)
            getAlert(message, 'error')
        } finally {
            setChecksInProgress(count => Math.max(0, count - 1))
        }
    }

    return (
        <div>
            <div className="">Arrival Date & Time</div>
            <div className="relative grid grid-cols-8 items-center gap-2">
                <div className="col-span-5">
                    <NewForminput
                        formtype="date"
                        content=""
                        error={form.errors.date?.toString() || ''}
                        valueText={form.values.date}
                        valueName="date"
                        minDate={dayjs().format("YYYY-MM-DD").toString()}
                        onChange={(e: any) => form.setFieldValue("date", e)}
                    />
                </div>
                <div className="col-span-3 mt-1">
                    <NewForminput
                        formtype="select"
                        options={displaysTiming()}
                        content=""
                        {...form.getInputProps("time")}
                        key={form.key("time")}
                        error={form.errors.time?.toString() || ''}
                    />
                </div>
            </div>
            {checkError
                ? <div className="mt-1 text-xs text-red-600" role="alert">{checkError}</div>
                : checksInProgress > 0 && <div className="mt-1 text-xs text-slate-500" role="status" aria-live="polite">Checking time availability...</div>}
        </div>
    )
}

function DepartureComponent({ form, price_id, airportStart, pickup_date, departureAsPickup }: Props) {
    const [checksInProgress, setChecksInProgress] = useState(0)
    const [checkError, setCheckError] = useState('')
    const errorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (errorTimeout.current) clearTimeout(errorTimeout.current)
    }, [])

    form.watch("departureTime", (values: { value: string }) => handleCheckTime(values.value))

    async function handleCheckTime(value: string) {
        if (!form.values.departureDate) return getAlert(`Provide date to check for time availability`, 'info')
        if (errorTimeout.current) clearTimeout(errorTimeout.current)
        setCheckError('')
        setChecksInProgress(count => count + 1)
        try {
            const departure_time = `${form.values.departureDate} ${value}`
            let body: { departure_time: string; pickup_time: string; price_id: string }

            if (departureAsPickup) {
                body = {
                    departure_time: "",
                    pickup_time: departure_time,
                    price_id
                }
            } else {
                const sumInMinutes = 60 + 60 + 60
                const pickup_time = dayjs(departure_time).subtract(sumInMinutes, "minutes").format("YYYY-MM-DD hh:mm")
                form.setFieldValue("returnPickupTime", pickup_time)
                body = {
                    departure_time,
                    pickup_time,
                    price_id
                }
            }

            const response = await createResponse({
                endpoint: NewApis.v4.check_time,
                method: "POST",
                data: body
            })
            if (!response.allow_booking) {
                const message = 'Booking not allowed at the designated time, kindly provide a different time'
                setCheckError(message)
                errorTimeout.current = setTimeout(() => setCheckError(''), 5000)
                getAlert(message, 'error')
            }
        } catch (error) {
            const message = (error as Error).message
            setCheckError(message)
            errorTimeout.current = setTimeout(() => setCheckError(''), 5000)
            getAlert(message, 'error')
        } finally {
            setChecksInProgress(count => Math.max(0, count - 1))
        }
    }

    return (
        <div>
            <div className="">Departure Date & Time</div>
            <div className="relative grid grid-cols-8 items-center gap-2">
                <div className="col-span-5">
                    <NewForminput
                        formtype="date"
                        content=""
                        error={form.errors.departureDate?.toString() || ''}
                        valueText={form.values.departureDate}
                        valueName="departureDate"
                        minDate={departureAsPickup
                            ? dayjs().format("YYYY-MM-DD").toString()
                            : !airportStart ? pickup_date : dayjs().format("YYYY-MM-DD").toString()}
                        onChange={(e: any) => form.setFieldValue("departureDate", e)}
                    />
                </div>
                <div className="col-span-3 mt-1">
                    <NewForminput
                        formtype="select"
                        options={displaysTiming()}
                        content=""
                        {...form.getInputProps("departureTime")}
                        key={form.key("departureTime")}
                        error={form.errors.departureTime?.toString() || ''}
                    />
                </div>
            </div>
            {checkError
                ? <div className="mt-1 text-xs text-red-600" role="alert">{checkError}</div>
                : checksInProgress > 0 && <div className="mt-1 text-xs text-slate-500" role="status" aria-live="polite">Checking time availability...</div>}
        </div>
    )
}