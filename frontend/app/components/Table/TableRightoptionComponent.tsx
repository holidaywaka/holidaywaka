import { Popover } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import dayjs from 'dayjs'
import { ArrowDown2 } from 'iconsax-reactjs'
import React from 'react'
import { FiCalendar } from 'react-icons/fi'
import { useSearchParams } from 'react-router'

type componentProps = {
    item: {
        title: string
        tag?: string
        type: string
        options?: {
            label: string
            value: string
        }[]
    }
    HandleDateAction: (value: [string | null, string | null]) => void
    value: [string | null, string | null]
    HandleStatusSelectionAction: (item: string, tag: string) => void
}

export default function TableRightoptionComponent(props: componentProps) {
    const [searchParams,] = useSearchParams()
    const [opened, setOpened] = React.useState(false)
    const currentValue = props.item.options?.find(el => el.value === searchParams.get(props.item.tag || ''))?.label
    
    function toggles() {
        setOpened((o) => !o)
    }

    function HandleStatusSelection(item: string, tag: string) {
        props.HandleStatusSelectionAction(item, tag)
        toggles()
    }


    if (props.item.type === "date") return <div className="relative" ><DatePickerInput
        type="range"
        label={props.item.title}
        placeholder={`${dayjs().subtract(1, "days").format("MMM DD, YYYY")} - ${dayjs().format("MMM DD, YYYY")}`}
        value={props.value}
        styles={{
            input: { paddingRight: '3rem' }
        }}
        maxDate={new Date()}
        onChange={(value) => props.HandleDateAction(value)}
    />
        <div className="absolute top-[1.85rem] right-1 text-gray-400"><FiCalendar size="18" /> </div>
    </div>

    if (props.item.type === "dropdown") return <Popover width={300} position="bottom" withArrow shadow="md" opened={opened} onChange={setOpened}>
        <Popover.Target>
            <div>
                <div className="">{props.item.title}</div>
                <button
                    onClick={toggles}
                    className="p-2 w-[7.18rem] flex items-center justify-between gap-2 rounded-md cursor-pointer text-xl border border-gray-300 hover:scale-105 transition-all truncate"> {props.item?.tag ? currentValue ? currentValue : props.item.options?.[0].label : props.item.options?.[0].label} <ArrowDown2 size="16" /> </button>
            </div>
        </Popover.Target>
        <Popover.Dropdown styles={{ dropdown: { width: '10rem', padding: 0, maxHeight: '20rem', overflowY: "auto" } }}>
            {props.item.options?.map((ele, i) => (
                <div className="cursor-pointer px-3 py-2 hover:bg-background transition-all" key={i} onClick={() => HandleStatusSelection(ele.value, String(props.item?.tag ?? ele?.label))}>{ele.label}</div>
            ))}
        </Popover.Dropdown>
    </Popover>
}
