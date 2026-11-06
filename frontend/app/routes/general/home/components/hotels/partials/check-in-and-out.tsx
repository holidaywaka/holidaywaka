import { Popover } from '@mantine/core';
import { DatePicker } from '@mantine/dates'
import dayjs from 'dayjs';
import type { UseFormReturnType } from '@mantine/form';
import React from 'react'
import { HOTEL_DATE_FORMAT, HOTEL_LIMITS } from '~/routes/general/hotel-search/hotel-utils';

type props = {
    form: UseFormReturnType<any>;
}

export default function CheckInAndOut(props: props) {
    const checkIn = props.form.values.checkin ?? null;
    const checkOut = props.form.values.checkout ?? null;
    const error = props.form.errors.checkin;
    const [opened, setOpened] = React.useState(false);

    function action([start, end]: [string | null, string | null]) {
        props.form.setFieldValue('checkin', start);
        props.form.setFieldValue('checkout', end);
        if (start && end) setOpened(false);
    }
    return (
        <>
            <Popover opened={opened} onChange={setOpened}>
                <Popover.Target>
                    <div
                        onClick={() => setOpened((o) => !o)}
                        className={`grid grid-cols-2 md:col-span-5 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} relative`}>
                        <div className="border-r border-gray-300 px-2 py-3 cursor-pointer active:scale-95 transition-all">
                            <div className="text-xs text-zinc-500 mb-1">Check-in</div>
                            <div className="text-lg font-bold">{!checkIn ? "Select date" : dayjs(checkIn).format("MMM D, YYYY")}</div>
                        </div>
                        <div className="px-2 py-3 cursor-pointer active:scale-95 transition-all">
                            <div className="text-xs text-zinc-500 mb-1">Check-out</div>
                            <div className="text-lg font-bold">{!checkOut ? "Select date" : dayjs(checkOut).format("MMM D, YYYY")}</div>
                        </div>
                        {error && <div className="col-span-2 text-xs text-red-600 px-2 pb-1">{error}</div>}
                    </div>
                </Popover.Target>

                <Popover.Dropdown>
                    <DatePicker
                    type="range"
                    value={[checkIn, checkOut]}
                    onChange={action}
                    minDate={dayjs().format(HOTEL_DATE_FORMAT)}
                    maxDate={dayjs().add(HOTEL_LIMITS.maxDaysAhead, 'day').format(HOTEL_DATE_FORMAT)}
                    />
                </Popover.Dropdown>
            </Popover>


        </>
    )
}
