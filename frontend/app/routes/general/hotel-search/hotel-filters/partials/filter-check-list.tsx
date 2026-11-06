import React from 'react';
import type { IconType } from 'react-icons';
import { FiCheck } from 'react-icons/fi';

export type FilterCheckOption<T extends string | number> = {
    value: T;
    label: React.ReactNode;
    count?: number;
    icon?: IconType;
}

type props<T extends string | number> = {
    title?: string;
    options: FilterCheckOption<T>[];
    selected: T[];
    onChange: (selected: T[]) => void;
    /** Options shown before "Show all"; selected options are always visible */
    limit?: number;
}

export default function FilterCheckList<T extends string | number>(props: props<T>) {
    const [expanded, setExpanded] = React.useState(false);

    function handleAction(item: T) {
        props.onChange(props.selected.includes(item) ? props.selected.filter(ele => ele !== item) : [...props.selected, item]);
    }

    if (props.options.length === 0) return null;
    const limit = props.limit ?? props.options.length;
    const visible = expanded ? props.options : props.options.filter((item, index) => index < limit || props.selected.includes(item.value));
    const hidden = props.options.length - visible.length;

    return (
        <FilterSection title={props.title} selectedCount={props.selected.length} onClear={() => props.onChange([])}>
            <div className="space-y-0.5">
                {visible.map((item) => {
                    const isSelected = props.selected.includes(item.value);
                    // No result left with the other filters applied: kept visible but muted
                    const isEmpty = item.count === 0 && !isSelected;
                    return (
                        <button
                            type="button"
                            role="checkbox"
                            aria-checked={isSelected}
                            disabled={isEmpty}
                            onClick={() => handleAction(item.value)}
                            className="w-full flex items-center gap-2 py-1.5 px-1 -mx-1 rounded-md text-left cursor-pointer hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent transition-colors"
                            key={item.value}>
                            <span className={`shrink-0 size-4.5 border rounded flex items-center justify-center transition-colors ${isSelected ? 'border-primary text-white bg-primary' : 'border-gray-400 bg-white'}`}>
                                {isSelected && <FiCheck className="size-3.5" strokeWidth={3} />}
                            </span>
                            {item.icon && <item.icon className="shrink-0 size-4 text-zinc-500" aria-hidden />}
                            <span className={`flex-1 min-w-0 text-sm ${isSelected ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>
                                {item.label}
                            </span>
                            {item.count !== undefined && <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
                                {item.count.toLocaleString()}
                            </span>}
                        </button>
                    )
                })}
            </div>
            {(hidden > 0 || expanded) && props.options.length > limit && (
                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="mt-1 text-sm font-semibold text-primary hover:underline cursor-pointer">
                    {expanded ? 'Show less' : `Show all ${props.options.length}`}
                </button>
            )}
        </FilterSection>
    )
}

type sectionProps = {
    title?: string;
    selectedCount?: number;
    onClear?: () => void;
    children: React.ReactNode;
}

/** Card wrapper shared by every filter group, with a per-group reset */
export function FilterSection(props: sectionProps) {
    return (
        <div className="bg-white rounded-md p-3 space-y-2">
            {props.title && (
                <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-zinc-900">{props.title}</div>
                    {Boolean(props.selectedCount) && props.onClear && (
                        <button type="button" onClick={props.onClear} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                            Reset
                        </button>
                    )}
                </div>
            )}
            {props.children}
        </div>
    )
}

/** Turns a `{ value: count }` map into options, most frequent first */
export function countsToOptions(counts: Record<string, number> | undefined, label: (value: string) => React.ReactNode, icon?: (value: string) => IconType | undefined) {
    return Object.entries(counts ?? {})
        .sort(([, a], [, b]) => b - a)
        .map(([value, count]) => ({ value, label: label(value), count, icon: icon?.(value) }));
}
