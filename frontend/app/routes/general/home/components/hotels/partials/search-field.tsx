import React from 'react'
import { ArrowDown2 } from 'iconsax-reactjs'
import { FiSearch, FiX } from 'react-icons/fi'

type FieldTriggerProps = {
    label: string;
    icon: React.ReactNode;
    /** Rendered when set; otherwise the placeholder is shown */
    value?: React.ReactNode;
    placeholder: string;
    opened: boolean;
    error?: React.ReactNode;
    onToggle: () => void;
    /** Shows a clear button while a value is set */
    onClear?: () => void;
}

/** Trigger shared by the hotel search pickers: icon, label, value and an open / clear affordance */
export function FieldTrigger(props: FieldTriggerProps) {
    const hasValue = props.value !== undefined && props.value !== null
    const border = props.error ? 'border-red-500' : props.opened ? 'border-primary ring-2 ring-primary/15' : 'border-gray-300 hover:border-zinc-400'
    return (
        <div>
            <div className={`relative flex items-center gap-3 bg-white border ${border} rounded-lg px-3 py-3 transition-all`}>
                <button
                    type="button"
                    onClick={props.onToggle}
                    aria-haspopup="listbox"
                    aria-expanded={props.opened}
                    className="flex flex-1 min-w-0 items-center gap-3 text-left cursor-pointer outline-none">
                    <span className={`shrink-0 size-10 rounded-md flex items-center justify-center ${hasValue ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-500'}`}>
                        {props.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-xs text-zinc-500 mb-0.5">{props.label}</span>
                        {hasValue
                            ? <span className="block text-lg font-bold text-zinc-900 truncate">{props.value}</span>
                            : <span className="block text-lg text-zinc-400 truncate">{props.placeholder}</span>}
                    </span>
                </button>
                {hasValue && props.onClear ? (
                    <button
                        type="button"
                        onClick={props.onClear}
                        aria-label={`Clear ${props.label.toLowerCase()}`}
                        className="shrink-0 size-8 rounded-full flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer transition-all">
                        <FiX className="size-5" />
                    </button>
                ) : (
                    <ArrowDown2 onClick={props.onToggle} className={`shrink-0 size-4 text-zinc-500 cursor-pointer transition-transform ${props.opened ? 'rotate-180' : ''}`} />
                )}
            </div>
            {props.error && <div className="text-xs text-red-600 mt-1 px-1">{props.error}</div>}
        </div>
    )
}

type SearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    placeholder: string;
    label: string;
    listId: string;
    activeId?: string;
}

export function SearchInput(props: SearchInputProps) {
    // Focus without scrolling: autoFocus scrolled the page to the input before the dropdown was positioned,
    // which made the page jump and the list open in the wrong place
    const inputRef = React.useRef<HTMLInputElement>(null)
    React.useEffect(() => {
        const frame = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }))
        return () => cancelAnimationFrame(frame)
    }, [])
    return (
        <div className="p-2 border-b border-gray-200">
            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-gray-300 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
                <FiSearch className="shrink-0 text-zinc-500" />
                <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-label={props.label}
                    aria-controls={props.listId}
                    aria-expanded={true}
                    aria-autocomplete="list"
                    aria-activedescendant={props.activeId}
                    value={props.value}
                    onChange={(e) => props.onChange(e.target.value)}
                    onKeyDown={props.onKeyDown}
                    autoComplete="off"
                    placeholder={props.placeholder}
                    className="w-full min-w-0 text-sm! outline-0 bg-transparent" />
                {props.value && (
                    <button type="button" aria-label="Clear search" onClick={() => props.onChange('')} className="shrink-0 text-zinc-500 hover:text-zinc-900 cursor-pointer">
                        <FiX />
                    </button>
                )}
            </div>
        </div>
    )
}

export function GroupHeading({ children }: { children: React.ReactNode }) {
    return <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 px-2 pt-2 pb-1">{children}</div>
}

/** Bolds the part of `text` that matches the search term */
export function Highlight({ text, term }: { text: string; term: string }) {
    const index = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1
    if (index < 0) return <>{text}</>
    return (
        <>
            {text.slice(0, index)}
            <span className="text-primary">{text.slice(index, index + term.length)}</span>
            {text.slice(index + term.length)}
        </>
    )
}

/** Flag image (emoji flags render as letters on Windows); hidden if the image fails */
export function CountryFlag({ code, className = '' }: { code: string; className?: string }) {
    const [failed, setFailed] = React.useState(false)
    const lower = code.toLowerCase()
    if (failed) return <span className={`inline-flex items-center justify-center w-5 h-[15px] rounded-sm bg-zinc-200 text-[8px] font-bold text-zinc-600 ${className}`}>{code.toUpperCase()}</span>
    return (
        <img
            src={`https://flagcdn.com/w40/${lower}.png`}
            srcSet={`https://flagcdn.com/w80/${lower}.png 2x`}
            width={20}
            height={15}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className={`inline-block w-5 h-[15px] rounded-sm object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)] ${className}`} />
    )
}

/**
 * Arrow / Enter / Escape navigation for a popover list driven from its search input.
 * Items render with `id={optionId(index)}` so the active one can be scrolled into view.
 */
export function useListNavigation<T>(items: T[], onSelect: (item: T) => void, onClose: () => void, idPrefix: string) {
    const [active, setActive] = React.useState(0)
    const optionId = React.useCallback((index: number) => `${idPrefix}-option-${index}`, [idPrefix])

    React.useEffect(() => { setActive(0) }, [items])

    React.useEffect(() => {
        // Scroll only the list: scrollIntoView would also scroll the page (the "page jumps" bug)
        const option = document.getElementById(optionId(active))
        const list = option?.closest('[role="listbox"]') as HTMLElement | null
        if (!option || !list) return
        const optionBox = option.getBoundingClientRect()
        const listBox = list.getBoundingClientRect()
        if (optionBox.top < listBox.top) list.scrollTop -= listBox.top - optionBox.top
        else if (optionBox.bottom > listBox.bottom) list.scrollTop += optionBox.bottom - listBox.bottom
    }, [active, optionId])

    function onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActive((index) => Math.min(items.length - 1, index + 1))
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((index) => Math.max(0, index - 1))
        } else if (event.key === 'Enter') {
            event.preventDefault()
            if (items[active]) onSelect(items[active])
        } else if (event.key === 'Home') {
            event.preventDefault()
            setActive(0)
        } else if (event.key === 'End') {
            event.preventDefault()
            setActive(Math.max(0, items.length - 1))
        } else if (event.key === 'Escape') {
            onClose()
        }
    }

    return { active, setActive, onKeyDown, optionId, activeId: items.length ? optionId(active) : undefined }
}

/** Room a search dropdown needs under its field (search box + list) */
const DROPDOWN_SPACE = 440

/**
 * Before opening a dropdown: if there isn't room for it below the field, scroll the field up to sit just under
 * the sticky header. Dropdowns then always open downward (no flip into the hero) and are fully visible.
 */
export function revealForDropdown(element: HTMLElement | null, needed = DROPDOWN_SPACE) {
    if (!element || typeof window === 'undefined') return
    const rect = element.getBoundingClientRect()
    const headerBottom = Math.max(0, document.querySelector('header')?.getBoundingClientRect().bottom ?? 0)
    const roomBelow = window.innerHeight - rect.bottom
    if (rect.top >= headerBottom && roomBelow >= Math.min(needed, window.innerHeight - headerBottom - rect.height)) return
    window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - headerBottom - 12), behavior: 'instant' as ScrollBehavior })
}

/** Popover props shared by the search pickers: open below the field, never flip above it */
export const DROPDOWN_POPOVER = {
    position: 'bottom-start' as const,
    middlewares: { flip: false, shift: true },
    shadow: 'lg' as const,
    radius: 'md' as const,
    offset: 6,
    trapFocus: false,
}

/** Opens a picker after making room for its dropdown */
export function useDropdownField() {
    const ref = React.useRef<HTMLDivElement>(null)
    const [opened, setOpened] = React.useState(false)
    const open = React.useCallback(() => {
        revealForDropdown(ref.current)
        setOpened(true)
    }, [])
    return { ref, opened, setOpened, open }
}
