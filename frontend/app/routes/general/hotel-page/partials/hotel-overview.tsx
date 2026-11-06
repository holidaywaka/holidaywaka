import { MdAccessTime, MdApartment, MdCreditCard, MdLogin, MdLogout } from 'react-icons/md';
import { paymentMethodLabels, serpFilterIcons } from '~/routes/general/hotel-search/hotel-constants';
import { humanizeSlug } from '~/routes/general/hotel-search/hotel-utils';
import type { HotelFilterReference } from '~/routes/general/hotel-search/types';
import type { hotelProps } from '~/routes/general/hotel-page/types'

type props = {
    hotel: hotelProps;
    reference?: HotelFilterReference;
    onScrollTo: (sectionId: string) => void;
}

const POPULAR_LIMIT = 6;
export const formatTime = (value: string | null | undefined) => value?.slice(0, 5);

/** Three summary cards under the gallery, each linking to its full section */
export default function HotelOverview({ hotel, reference, onScrollTo }: props) {
    const intro = hotel.description_struct?.find((section) => section.paragraphs?.length)?.paragraphs[0];
    const amenityLabel = (value: string) => reference?.serp_filters.find((item) => item.value === value)?.desc ?? humanizeSlug(value);
    const popular = hotel.serp_filters.filter((value) => serpFilterIcons[value]).slice(0, POPULAR_LIMIT);
    const totalAmenities = hotel.amenity_groups.reduce((total, group) => total + group.amenities.length + (group.non_free_amenities?.length ?? 0), 0);
    const payments = (hotel.payment_methods ?? []).map((method) => paymentMethodLabels[method] ?? humanizeSlug(method));
    const facts = hotel.facts;

    const goodToKnow = [
        hotel.check_in_time && { icon: MdLogin, label: 'Check-in', value: `From ${formatTime(hotel.check_in_time)}${hotel.check_in_time_end ? ` until ${formatTime(hotel.check_in_time_end)}` : ''}` },
        hotel.check_out_time && { icon: MdLogout, label: 'Check-out', value: `Until ${formatTime(hotel.check_out_time)}` },
        hotel.front_desk_time_start && hotel.front_desk_time_end && { icon: MdAccessTime, label: 'Front desk', value: `${formatTime(hotel.front_desk_time_start)} – ${formatTime(hotel.front_desk_time_end)}` },
        (facts?.rooms_number || facts?.floors_number) && { icon: MdApartment, label: 'Property', value: [facts?.rooms_number ? `${facts.rooms_number} rooms` : null, facts?.floors_number ? `${facts.floors_number} floors` : null].filter(Boolean).join(' · ') },
        payments.length > 0 && { icon: MdCreditCard, label: 'Accepted at the property', value: payments.join(', ') },
    ].filter(Boolean) as { icon: typeof MdLogin; label: string; value: string }[];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <OverviewCard title="About the property" action={intro ? { label: 'Read the full description', onClick: () => onScrollTo('hotel-description') } : undefined}>
                {intro
                    ? <p className="text-sm text-zinc-700 leading-relaxed line-clamp-6">{intro}</p>
                    : <p className="text-sm text-zinc-500">The property has not shared a description yet.</p>}
            </OverviewCard>

            <OverviewCard title="Popular amenities" action={totalAmenities > 0 ? { label: `All amenities · ${totalAmenities}`, onClick: () => onScrollTo('hotel-amenities') } : undefined}>
                {popular.length > 0 ? (
                    <ul className="space-y-2.5">
                        {popular.map((value) => {
                            const Icon = serpFilterIcons[value];
                            return <li key={value} className="flex items-center gap-3 text-sm text-zinc-800"><Icon className="shrink-0 size-5 text-zinc-700" />{amenityLabel(value)}</li>
                        })}
                    </ul>
                ) : <p className="text-sm text-zinc-500">See the full list of services below.</p>}
            </OverviewCard>

            <OverviewCard title="Good to know" action={{ label: 'Policies', onClick: () => onScrollTo('hotel-policies') }}>
                {goodToKnow.length > 0 ? (
                    <ul className="space-y-2.5">
                        {goodToKnow.map((item) => (
                            <li key={item.label} className="flex items-start gap-3 text-sm">
                                <item.icon className="shrink-0 size-5 text-zinc-700 mt-0.5" />
                                <span><span className="block text-xs text-zinc-500">{item.label}</span><span className="text-zinc-800">{item.value}</span></span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-zinc-500">Check-in details are listed under policies.</p>}
            </OverviewCard>
        </div>
    )
}

function OverviewCard({ title, action, children }: { title: string; action?: { label: string; onClick: () => void }; children: React.ReactNode }) {
    return (
        <section className="bg-white rounded-xl border border-slate-200/70 p-4 flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
            <div className="flex-1">{children}</div>
            {action && (
                <button type="button" onClick={action.onClick} className="w-full h-10 rounded-lg bg-slate-100 text-sm font-semibold text-zinc-800 hover:bg-slate-200 transition-colors cursor-pointer">
                    {action.label}
                </button>
            )}
        </section>
    )
}
