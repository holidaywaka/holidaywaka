import { Modal, Popover, Text } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks'
import { ArrowDown2, Trash } from 'iconsax-reactjs'
import React from 'react'
import { FiMinus, FiPlus, FiX } from 'react-icons/fi';
import { modalStyle } from '~/components/utils';

interface HotelGuestRoom {
    adults: number;
    children: number[];
}

interface HotelGuestSelectorFormValues {
    guests?: HotelGuestRoom[];
}

interface HotelGuestSelectorProps {
    form: UseFormReturnType<HotelGuestSelectorFormValues>;
}

export default function HotelGuestSelector(props: HotelGuestSelectorProps) {
    const maxAdults = 6;
    const maxChild = 4;
    const maxRooms = 9;
    const isMaxChild = (roomIndex: number) => (props.form.values.guests ?? [])[roomIndex]?.children.length >= maxChild;
    const [opened, { open, close }] = useDisclosure(false);
    const [popoverOpened, { open: openPopover, close: closePopover }] = useDisclosure(false);
    const childrenLists: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

    function addRoom(): void {
        props.form.setFieldValue('guests', [...(props.form.values.guests ?? []), { adults: 1, children: [] }]);
    }

    return (
        <div>
            <Modal
                opened={opened}
                onClose={close}
                withCloseButton={false}
                centered
                styles={modalStyle}
            >
                <div className="">
                    <div className="space-y-3 h-fit max-h-[50dvh] overflow-y-auto">
                        {(props.form.values.guests ?? []).map((item: {
                            adults: number;
                            children: number[]
                        }, roomIndex: number) => (
                            <div className="border-b border-gray-300 p-4 relative" key={roomIndex}>
                                {roomIndex > 0 && <div className="absolute top-5 right-4 cursor-pointer" onClick={() => props.form.setFieldValue('guests', (props.form.values.guests ?? []).filter((_: any, i: number) => i !== roomIndex))}>
                                    <Trash className="text-red-600" />
                                </div>}
                                <div className="font-bold text-lg italic">Room {roomIndex + 1} </div>

                                <AdultsView
                                    maxAdults={maxAdults}
                                    value={item.adults}
                                    form={props.form}
                                    roomIndex={roomIndex}
                                />
                                <div className="text-xs text-zinc-500 mb-1">Children</div>
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    {item.children.map((childAge, childIndex) => (
                                        <div
                                            onClick={() => props.form.setFieldValue('guests', (props.form.values.guests ?? []).map((room: HotelGuestRoom, index: number) => {
                                                if (index === roomIndex) {
                                                    return {
                                                        ...room,
                                                        children: room.children.filter((_: number, index: number) => index !== childIndex)
                                                    }
                                                }
                                                return room;
                                            }))}
                                            key={childIndex}
                                            className="h-8 bg-gray-100 rounded-md py-1.5 px-2 border border-gray-300 flex items-center justify-center cursor-pointer active:scale-95 transition-all">
                                            {childAge} yrs <FiX className="ml-1 text-red-600" />
                                        </div>
                                    ))}
                                    {!isMaxChild(roomIndex) && <Popover
                                        width={200} position="bottom" withArrow shadow="md">
                                        <Popover.Target>
                                            <div
                                                className="h-8 bg-gray-100 rounded-md py-1.5 px-2 border border-gray-300 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                                                onClick={openPopover}
                                            > <FiPlus className="size-5" /> Add a child
                                            </div>
                                        </Popover.Target>
                                        <Popover.Dropdown styles={{
                                            dropdown: {
                                                height: "10rem",
                                                overflowY: "auto",
                                                paddingTop: 0,
                                                paddingBottom: 0,
                                                paddingRight: 4,
                                                paddingLeft: 4
                                            }
                                        }}>
                                            <div className="flex flex-col gap-2 mt-2">
                                                {childrenLists.map((child) => (
                                                    <div
                                                        key={child}
                                                        className="px-2 py-1 cursor-pointer active:scale-95 transition-all hover:bg-slate-100"
                                                        onClick={() => {
                                                            const guests = props.form.values.guests ?? [];
                                                            props.form.setFieldValue('guests', guests.map((room, index) =>
                                                                index === roomIndex
                                                                    ? { ...room, children: [...room.children, child] }
                                                                    : room
                                                            ));
                                                        }}
                                                    >
                                                        {child} yrs
                                                    </div>
                                                ))}
                                            </div>
                                        </Popover.Dropdown>
                                    </Popover>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 justify-between py-2 px-4 border-t border-gray-200">
                       {(props.form.values.guests ?? []).length >= maxRooms ? <div></div> : <div
                            onClick={addRoom}
                            className="px-2 py-1">
                            <div className="flex items-center gap-1 text-blue-700 cursor-pointer p-1 active:scale-95 transition-all size-fit"> <FiPlus /> Add Room {Number(props.form.values.guests?.length) + 1} </div>
                        </div>}
                        <div
                            onClick={close}
                            className="bg-slate-100 cursor-pointer active:scale-95 transition-all py-1 px-3 rounded-lg">Close</div>
                    </div>
                </div>
            </Modal>
            <div
                onClick={open}
                className="border border-gray-300 rounded-md px-2 py-3 relative cursor-pointer">
                <div className="absolute top-4 text-gray-500 right-0.5 bg-white size-7 flex items-center justify-center cursor-pointer active:scale-95 transition-all"> <ArrowDown2 className="size-6" /> </div>
                <div className="cursor-pointer active:scale-95 transition-all">
                    <div className="text-xs text-zinc-500 mb-1">{(props.form.values.guests ?? []).length} Room{(props.form.values.guests ?? []).length > 1 ? "s" : ""} for</div>
                    <div className="text-lg font-bold">{(props.form.values.guests ?? []).reduce((total, room) => total + room.adults + room.children.length, 0)} Guest{(props.form.values.guests ?? []).reduce((total, room) => total + room.adults + room.children.length, 0) > 1 ? "s" : ""}</div>
                </div>
            </div>
        </div>
    )
}


type AdultsViewProps = {
    value: number;
    roomIndex: number;
    form: UseFormReturnType<HotelGuestSelectorFormValues>;
    maxAdults: number;
}
function AdultsView(props: AdultsViewProps) {
    const adultMax = props.value >= props.maxAdults;
    const adultMin = props.value <= 1;

    function stackAdults(action: "+" | "-") {
        const currentAdults = props.form.values.guests?.[props.roomIndex].adults || 1;
        if (action === "+" && currentAdults < props.maxAdults) {
            props.form.setFieldValue(`guests.${props.roomIndex}.adults`, currentAdults + 1);
        } else if (action === "-" && currentAdults > 1) {
            props.form.setFieldValue(`guests.${props.roomIndex}.adults`, currentAdults - 1);
        }
    }
    return (
        <div className="mb-3">
            <div className="text-xs text-zinc-500 mb-1">Adults</div>
            <div className="flex gap-3 items-center">
                <div
                    onClick={() => adultMin ? null : stackAdults("-")}
                    className={`size-6 border border-gray-300 bg-slate-100 rounded-sm flex items-center justify-center ${adultMin ? 'text-gray-300 cursor-not-allowed' : 'active:scale-95 transition-all cursor-pointer'}`}> <FiMinus className="size-5" /> </div>
                <div className="">{props.value}</div>
                <div
                    onClick={() => adultMax ? null : stackAdults("+")}
                    className={`size-6 border border-gray-300 bg-slate-100 rounded-sm flex items-center justify-center ${adultMax ? "text-gray-300 cursor-not-allowed" : "cursor-pointer active:scale-95 transition-all"}`}> <FiPlus className="size-5" /> </div>
            </div>
        </div>
    )
}