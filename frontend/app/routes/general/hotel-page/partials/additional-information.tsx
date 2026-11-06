import parse from 'html-react-parser';
import type { IconType } from 'react-icons';
import {
    MdAccessTime, MdAccountBalanceWallet, MdAirportShuttle, MdBabyChangingStation, MdBed, MdChildCare, MdCreditCard,
    MdEventBusy, MdFlight, MdInfoOutline, MdLocalParking, MdPets, MdReceiptLong, MdRestaurant, MdSchedule, MdWifi,
} from 'react-icons/md';
import { paymentMethodLabels } from '~/routes/general/hotel-search/hotel-constants';
import { humanizeSlug } from '~/routes/general/hotel-search/hotel-utils';
import { formatTime } from '~/routes/general/hotel-page/partials/hotel-overview';
import type { hotelProps } from '~/routes/general/hotel-page/types'

type props = {
    hotel: hotelProps;
}

type PolicyEntry = Record<string, unknown>;

// ETG metapolicy_struct keys, in display order
const POLICY_SECTIONS: Record<string, { title: string; icon: IconType }> = {
    deposit: { title: 'Deposit', icon: MdAccountBalanceWallet },
    add_fee: { title: 'Additional fees', icon: MdReceiptLong },
    meal: { title: 'Meals', icon: MdRestaurant },
    children_meal: { title: "Children's meals", icon: MdRestaurant },
    children: { title: 'Children', icon: MdChildCare },
    extra_bed: { title: 'Extra beds', icon: MdBed },
    cot: { title: 'Cots', icon: MdBabyChangingStation },
    pets: { title: 'Pets', icon: MdPets },
    parking: { title: 'Parking', icon: MdLocalParking },
    internet: { title: 'Internet', icon: MdWifi },
    shuttle: { title: 'Shuttle', icon: MdAirportShuttle },
    check_in_check_out: { title: 'Early check-in and late check-out', icon: MdSchedule },
    no_show: { title: 'No-show', icon: MdEventBusy },
    visa: { title: 'Visa support', icon: MdFlight },
}

const FIELD_LABELS: Record<string, string> = {
    deposit_type: 'Deposit type', payment_type: 'Payment', pricing_method: 'Charged', availability: 'Availability',
    territory_type: 'Location', pets_type: 'Pets', meal_type: 'Meal', amount: 'Quantity', internet_type: 'Type',
    work_area: 'Area', shuttle_type: 'Type', destination_type: 'Destination', fee_type: 'Fee', check_in_check_out_type: 'Type',
    extra_bed: 'Extra bed', day_period: 'Time of day', time: 'Time', visa_support: 'Visa support',
}

const VALUE_LABELS: Record<string, string> = {
    on_site: 'On-site', off_site: 'Off-site', off_side: 'Off-site', not_included: 'Not included', included: 'Included',
    per_guest_per_night: 'per guest per night', per_room_per_night: 'per room per night', per_guest_per_stay: 'per guest per stay',
    per_room_per_stay: 'per room per stay', per_night: 'per night', per_stay: 'per stay', per_hour: 'per hour', per_guest: 'per guest',
}

const isSpecified = (value: unknown) => value !== null && value !== undefined && value !== '' && value !== 'unspecified';
const valueText = (value: unknown) => VALUE_LABELS[String(value)] ?? humanizeSlug(String(value));

function priceText(entry: PolicyEntry) {
    if (entry.inclusion === 'included') return 'Included in the rate';
    const price = Number(entry.price);
    if (!isSpecified(entry.price) || !Number.isFinite(price)) return null;
    if (price === 0) return 'Free';
    const unit = entry.price_unit ?? entry.pricing_method;
    return `${price.toLocaleString()} ${entry.currency ?? ''} ${isSpecified(unit) ? valueText(unit) : ''}`.replace(/\s+/g, ' ').trim();
}

/** ETG entry -> label/value rows, e.g. { territory_type: "on_site", price: "30", ... } -> Location: On-site, Price: 30 GBP per room per night */
function describeEntry(entry: PolicyEntry) {
    const rows: { label: string; value: string }[] = [];
    if (isSpecified(entry.age_start) || isSpecified(entry.age_end)) {
        rows.push({ label: 'Ages', value: `${entry.age_start ?? 0}–${entry.age_end ?? 17}` });
    }
    for (const [key, value] of Object.entries(entry)) {
        if (['price', 'currency', 'price_unit', 'inclusion', 'age_start', 'age_end'].includes(key) || key === 'pricing_method' && isSpecified(entry.price)) continue;
        if (!isSpecified(value) || typeof value === 'object') continue;
        if (typeof value === 'boolean') {
            if (value) rows.push({ label: FIELD_LABELS[key] ?? humanizeSlug(key), value: 'Yes' });
            continue;
        }
        rows.push({ label: FIELD_LABELS[key] ?? humanizeSlug(key), value: valueText(value) });
    }
    const price = priceText(entry);
    if (price) rows.push({ label: 'Price', value: price });
    return rows;
}

// Displaying metapolicy_struct and metapolicy_extra_info is an ETG requirement
export default function AdditionalInformation(props: props) {
    const hotel = props.hotel;
    const metapolicy = hotel.metapolicy_struct ?? {};
    const sections = Object.keys(POLICY_SECTIONS)
        .map((key) => {
            const value = metapolicy[key];
            const entries = (Array.isArray(value) ? value : value ? [value] : [])
                .map((entry) => describeEntry(entry as PolicyEntry))
                .filter((rows) => rows.length > 0);
            return { key, ...POLICY_SECTIONS[key], entries };
        })
        .filter((section) => section.entries.length > 0);

    const checkIn = formatTime(hotel.check_in_time);
    const checkInEnd = formatTime(hotel.check_in_time_end);
    const checkOut = formatTime(hotel.check_out_time);
    const payments = (hotel.payment_methods ?? []).map((method) => paymentMethodLabels[method] ?? humanizeSlug(method));
    const notes = (hotel.policy_struct ?? []).filter((item) => item.paragraphs?.length);
    // ETG often repeats metapolicy_extra_info inside policy_struct ("Extra info"); show it once
    const plain = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const notesText = plain(notes.flatMap((note) => note.paragraphs).join(' '));
    const rawExtra = hotel.metapolicy_extra_info?.trim();
    const extraInfo = rawExtra && !notesText.includes(plain(rawExtra)) ? rawExtra : undefined;

    if (!checkIn && !checkOut && sections.length === 0 && payments.length === 0 && notes.length === 0 && !extraInfo) return null;

    return (
        <section id="hotel-policies" className="bg-white rounded-xl border border-slate-200/70 p-4 md:p-5 scroll-mt-28 space-y-4">
            <h2 className="text-xl font-bold text-zinc-900">Policies</h2>

            {(checkIn || checkOut) && (
                <PolicyPanel title="Check-in terms and conditions">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 mb-3"><MdAccessTime className="size-5" /> Check-in and check-out</div>
                    <div className="space-y-4 max-w-xl">
                        {checkIn && <TimeRow label="Check-in" value={`From ${checkIn}${checkInEnd ? ` until ${checkInEnd}` : ''}`} start={checkIn} end={checkInEnd ?? '24:00'} />}
                        {checkOut && <TimeRow label="Check-out" value={`Until ${checkOut}`} start="00:00" end={checkOut} />}
                    </div>
                    {hotel.front_desk_time_start && hotel.front_desk_time_end && (
                        <div className="mt-3 text-sm text-zinc-600">Front desk open {formatTime(hotel.front_desk_time_start)} – {formatTime(hotel.front_desk_time_end)}</div>
                    )}
                </PolicyPanel>
            )}

            {sections.length > 0 && (
                <PolicyPanel title="Paid on the spot" subtitle="Charged by the property, not included in the price you pay online unless stated">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        {sections.map((section) => (
                            <div key={section.key}>
                                <div className="flex items-center gap-2 font-semibold text-zinc-900 mb-2"><section.icon className="size-5" /> {section.title}</div>
                                <div className="space-y-3 pl-7">
                                    {section.entries.map((rows, index) => (
                                        <dl key={index} className={`grid grid-cols-2 gap-x-4 gap-y-1 text-sm ${index > 0 ? 'pt-3 border-t border-slate-200' : ''}`}>
                                            {rows.map((row) => (
                                                <div key={row.label}>
                                                    <dt className="text-xs text-zinc-500">{row.label}</dt>
                                                    <dd className="text-zinc-900">{row.value}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </PolicyPanel>
            )}

            {payments.length > 0 && (
                <PolicyPanel title="Payment at the property">
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 mb-2"><MdCreditCard className="size-5" /> Accepted payment methods</div>
                    <div className="flex flex-wrap gap-2 pl-7">
                        {payments.map((method) => <span key={method} className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-sm text-zinc-800">{method}</span>)}
                    </div>
                </PolicyPanel>
            )}

            {(notes.length > 0 || extraInfo) && (
                <PolicyPanel title="Additional information">
                    <div className="space-y-4 text-sm text-zinc-700 leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1 [&_p]:mb-2 [&_b]:text-zinc-900">
                        {notes.map((note, index) => (
                            <div key={index}>
                                <h3 className="flex items-center gap-2 font-semibold text-zinc-900 mb-1"><MdInfoOutline className="size-5" /> {note.title}</h3>
                                <div className="pl-7">{note.paragraphs.map((paragraph, pIndex) => <div key={pIndex}>{parse(paragraph)}</div>)}</div>
                            </div>
                        ))}
                        {extraInfo && <div>{parse(extraInfo)}</div>}
                    </div>
                </PolicyPanel>
            )}
        </section>
    )
}

function PolicyPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-3">
                <h3 className="font-semibold text-zinc-900">{title}</h3>
                {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
            </div>
            <div className="p-4">{children}</div>
        </div>
    )
}

const minutes = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    return (hours || 0) * 60 + (mins || 0);
}

/** 24-hour bar with the allowed window highlighted */
function TimeRow({ label, value, start, end }: { label: string; value: string; start: string; end: string }) {
    const from = Math.min(1440, minutes(start));
    const to = Math.max(from, Math.min(1440, minutes(end)));
    const marker = label === 'Check-in' ? start : end;
    const markerAt = label === 'Check-in' ? from : to;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-[150px_minmax(0,1fr)] items-center gap-2">
            <div>
                <div className="text-xs text-zinc-500">{label}</div>
                <div className="font-medium text-zinc-900">{value}</div>
            </div>
            <div className="relative pb-5" aria-hidden>
                <div className="h-2 rounded-full bg-slate-200 relative overflow-hidden">
                    <div className="absolute inset-y-0 bg-green-600 rounded-full" style={{ left: `${(from / 1440) * 100}%`, width: `${((to - from) / 1440) * 100}%` }} />
                </div>
                <span className="absolute top-3 text-[11px] text-zinc-500 -translate-x-1/2" style={{ left: `${(markerAt / 1440) * 100}%` }}>{marker}</span>
            </div>
        </div>
    )
}
