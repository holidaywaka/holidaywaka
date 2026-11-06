import React from 'react';
import { ArrowDown2 } from 'iconsax-reactjs';
import type { hotelDescriptionProps, hotelProps } from '~/routes/general/hotel-page/types'

type props = {
    data: hotelDescriptionProps[];
    room: hotelProps;
}

/** Collapsed to the first section by default, like the supplier's own page */
export default function HotelDescription(props: props) {
    const [expanded, setExpanded] = React.useState(false);
    const sections = (props.data ?? []).filter((item) => item.paragraphs?.length);
    const facts = props.room.facts;
    const electricity = facts?.electricity;
    const factRows = [
        facts?.year_built ? { label: 'Year of construction', value: String(facts.year_built) } : null,
        facts?.year_renovated ? { label: 'Last renovation', value: String(facts.year_renovated) } : null,
        facts?.rooms_number || facts?.floors_number ? { label: 'Rooms and floors', value: `${facts?.rooms_number || '–'} rooms · ${facts?.floors_number || '–'} floors` } : null,
        electricity?.sockets?.length ? { label: 'Socket type', value: `Type ${electricity.sockets.map((socket) => socket.toUpperCase()).join(', ')} · ${electricity.voltage.join('/')} V / ${electricity.frequency.join('/')} Hz` } : null,
    ].filter(Boolean) as { label: string; value: string }[];

    if (sections.length === 0 && factRows.length === 0) return null;
    const visible = expanded ? sections : sections.slice(0, 1);
    const canExpand = sections.length > 1 || (sections[0]?.paragraphs.length ?? 0) > 2;

    return (
        <section id="hotel-description" className="bg-white rounded-xl border border-slate-200/70 p-4 md:p-5 scroll-mt-28">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">About the property</h2>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6">
                <div className="space-y-4">
                    {visible.map((item, index) => (
                        <div key={index} className="space-y-1.5">
                            <h3 className="font-semibold text-zinc-900">{item.title}</h3>
                            {(expanded ? item.paragraphs : item.paragraphs.slice(0, 2)).map((paragraph, pIndex) => (
                                <p key={pIndex} className="text-sm text-zinc-700 leading-relaxed">{paragraph}</p>
                            ))}
                        </div>
                    ))}
                    {canExpand && (
                        <button type="button" onClick={() => setExpanded((value) => !value)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline cursor-pointer">
                            <ArrowDown2 className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                            {expanded ? 'Show less' : 'Show the full description'}
                        </button>
                    )}
                </div>
                {factRows.length > 0 && (
                    <aside className="rounded-lg bg-slate-50 p-4 space-y-3 h-fit">
                        <h3 className="font-semibold text-zinc-900">Facts about the property</h3>
                        {factRows.map((row) => (
                            <div key={row.label}>
                                <div className="text-xs text-zinc-500">{row.label}</div>
                                <div className="text-sm font-medium text-zinc-900">{row.value}</div>
                            </div>
                        ))}
                    </aside>
                )}
            </div>
        </section>
    )
}
