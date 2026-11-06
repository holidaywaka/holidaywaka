import { MdCheck, MdWhatshot } from 'react-icons/md';
import { amenityGroupIcons } from '~/routes/general/hotel-search/hotel-constants';
import { humanizeSlug } from '~/routes/general/hotel-search/hotel-utils';
import type { HotelFilterReference } from '~/routes/general/hotel-search/types';
import type { amenityGroupProps } from '~/routes/general/hotel-page/types'

type props = {
    data: amenityGroupProps[];
    /** ETG serp_filters of the hotel, shown first as "Popular" */
    popular?: string[];
    reference?: HotelFilterReference;
}

/** ETG amenity_groups in balanced columns; paid amenities are marked "charged separately" */
export default function Amenities(props: props) {
    const groups = (props.data ?? []).filter((group) => group.amenities.length || group.non_free_amenities?.length);
    if (!groups.length) return null;
    const popular = (props.popular ?? []).map((value) => props.reference?.serp_filters.find((item) => item.value === value)?.desc ?? humanizeSlug(value));

    return (
        <section id="hotel-amenities" className="bg-white rounded-xl border border-slate-200/70 p-4 md:p-5 scroll-mt-28">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Services and amenities</h2>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
                {popular.length > 0 && (
                    <div className="break-inside-avoid mb-5 rounded-xl bg-slate-50 p-3 -mx-1">
                        <GroupTitle icon={<MdWhatshot className="size-5 text-orange-500" />} title="Popular" />
                        <ul className="space-y-1">{popular.map((item) => <AmenityItem key={item} label={item} />)}</ul>
                    </div>
                )}
                {groups.map((group) => {
                    const Icon = amenityGroupIcons[group.group_name];
                    return (
                        <div key={group.group_name} className="break-inside-avoid mb-5">
                            <GroupTitle icon={Icon ? <Icon className="size-5 text-zinc-700" /> : null} title={group.group_name} />
                            <ul className="space-y-1">
                                {group.amenities.map((amenity) => <AmenityItem key={amenity} label={amenity} />)}
                                {group.non_free_amenities?.map((amenity) => <AmenityItem key={`paid-${amenity}`} label={amenity} paid />)}
                            </ul>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

function GroupTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return <h3 className="flex items-center gap-2 font-semibold text-zinc-900 mb-2">{icon}{title}</h3>
}

function AmenityItem({ label, paid = false }: { label: string; paid?: boolean }) {
    return (
        <li className="flex items-start gap-2 text-sm text-zinc-700">
            <MdCheck className="shrink-0 mt-0.5 size-4 text-zinc-400" aria-hidden />
            <span>{label}{paid && <span className="block text-xs text-amber-700">charged separately</span>}</span>
        </li>
    )
}
