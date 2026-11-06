

import { RiCheckDoubleFill } from "react-icons/ri";
import { FiLogOut, FiSearch, FiX } from "react-icons/fi";

import { Burger, Drawer, Modal, Popover } from '@mantine/core'
import React, { useState } from 'react'
import { useDisclosure } from '@mantine/hooks'
import { useSelector } from 'react-redux'
import type { RootState } from '~/store/store'
import { Diamonds, Global, Setting2, User } from 'iconsax-reactjs'
import { drawerStyle, modalStyle } from "../utils";
import ASidebar from "./ASidebar";
import Imaged2 from "../general/Imaged2";
import Linked from "../general/Linked";
import LogoutLayout from "./LogoutLayout";


type headerProps = {
    title: string
    subtitle: string
    children?: React.ReactNode
}


const DropdownLinks = [
    { Icon: User, title: 'View Profile', url: '/admin/settings' },
    { Icon: Setting2, title: 'Settings', url: '/admin/settings' },
]

const NotifyOptions = [
    {
        title: 'All',
        total: '03'
    },
    {
        title: 'Personal',
        total: '03'
    }
]


export default function AHeader({ title, subtitle, children }: headerProps) {
    const { isSidebar, profile } = useSelector((state: RootState) => state.data)
    const [opened, { open, close }] = useDisclosure(isSidebar)
    const [logs, setLogs] = useDisclosure(false)
    const [isSearch, setIsSearch] = useDisclosure(false)
    const [pops, setPops] = useState(false)
    const [pops2, setPops2] = useState(false)
    const [activeNotify, setActiveNotify] = useState(NotifyOptions[0].title)

    function logout() {
        setLogs.open()
        close()
        setPops(false)
    }
    return (
        <>
            <Modal opened={isSearch} onClose={setIsSearch.close} styles={modalStyle} centered withCloseButton={false}>
                <div className="">
                    <div className="border border-gray-300 flex items-center gap-2 px-3">
                        <FiSearch size="20" />
                        <input type="text" className="w-full border-0 outline-0 px-2 py-3" placeholder="Search here..." autoFocus={true} />
                    </div>
                    <div className="p-4"></div>
                </div>
            </Modal>
            <Modal opened={logs} onClose={setLogs.close} styles={modalStyle} centered withCloseButton={false}>
                <LogoutLayout close={setLogs.close} />
            </Modal>
            <Drawer onClose={close} opened={opened} styles={drawerStyle} size="xs" withCloseButton={false}>
                <ASidebar opened={false} toggle={close} close={() => { }} isMobile={true} />
            </Drawer>
            <div className='py-3 px-6 bg-white sticky top-0 left-0 z-20'>
                {children ?
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="lg:hidden">
                                <Burger opened={opened} onClick={open} aria-label="Toggle navigation" />
                            </div>
                            <div>
                                <div className="font-medium text-lg">{title}</div>
                                <div className="text-gray-600 text-xs">{subtitle}</div>
                            </div>
                        </div>
                        <div className="">
                            {children}
                        </div>
                    </div> : <>
                        <div className="grid grid-cols-7 items-center">
                            <div className="col-span-3">
                                <div className="flex items-center gap-3">
                                    <div className="lg:hidden">
                                        <Burger opened={opened} onClick={open} aria-label="Toggle navigation" size="16" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-lg">{title}</div>
                                        <div className="text-gray-600 text-[0.8rem] hidden sm:block">{subtitle}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-4 grid grid-cols-7 items-center gap-5">
                                <div className="col-span-5">
                                    <div onClick={setIsSearch.open} className="relative hidden rounded-lg border border-gray-300 p-2 cursor-pointer hover:scale-95 transition-all md:flex items-center gap-2 bg-background">
                                        <FiSearch />
                                        <div className="">Search</div>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <div className="flex items-center justify-end gap-2 flex-row">
                                        <div onClick={setIsSearch.open} className="p-2 rounded-full border border-gray-300 bg-background block md:hidden cursor-pointer hover:scale-95 transition-all"> <FiSearch /> </div>
                                        <Popover opened={pops2} onChange={setPops2}>
                                            <Popover.Target>
                                                <img loading="lazy" src={`/images/notes.svg`} className='size-7 sm:ize-8 cursor-pointer hover:scale-95 transition-all rounded-full' onClick={() => setPops2(o => !o)} />
                                            </Popover.Target>
                                            <Popover.Dropdown styles={{ dropdown: { padding: 0, borderRadius: '1.2rem', marginLeft: '-1rem', width: '22rem' } }}>
                                                <div className="text-sm">
                                                    <div className="border-b border-gray-300">
                                                        <div className="flex items-center justify-between px-4 pt-2">
                                                            <div className="font-bold">Notifications</div>
                                                            <div onClick={() => setPops2(false)} className="cursor-pointer p-2 hover:bg-background transition-all"> <FiX /> </div>
                                                        </div>
                                                        <div className="flex flex-row items-center border-b border-gray-300 gap-2">
                                                            {NotifyOptions.map((item, index) => (
                                                                <div
                                                                    onClick={() => setActiveNotify(item.title)}
                                                                    className={`flex items-center flex-row gap-2 p-2 border-b-2 ${activeNotify === item.title ? 'border-primary-dark text-primary-dark font-bold' : 'border-transparent'} cursor-pointer`} key={index}>
                                                                    <div className="">{item.title}</div>
                                                                    <div className="">
                                                                        <div className="rounded-full p-1 text-[0.6rem] font-bold bg-gray-100">{item.total}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="text-primary hover:scale-95 transition-all cursor-pointer flex items-center gap-2 p-2 text-sm justify-end size-fit ml-auto">
                                                                <RiCheckDoubleFill />
                                                                <div className="">Mark all as read</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                        <div className="">
                                                            {new Array(5).fill(0).map((_, index) => (
                                                                <div className={`text-sm flex items-center gap-2 p-2 cursor-pointer hover:bg-background transition-all ${index === 4 ? 'rounded-b-2xl' : ''}`} key={index}>
                                                                    <div><div className="bg-[#F6F8FF] rounded-full text-primary p-2 size-fit"> {index %2 === 0 ? <Diamonds size="16" /> : <Global size="16" />} </div></div>
                                                                    <div className="truncate">
                                                                        <div className="truncate"> <span className="text-primary">Peculiar Ugbo</span> just assigned a new Task to you. Create Blog article for next</div>
                                                                        <div className="text-xs">Just now</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                </div>
                                            </Popover.Dropdown>
                                        </Popover>
                                        <div><div className="w-[0.1rem] h-5 bg-gray-300"></div></div>
                                        <Popover opened={pops} onChange={setPops}>
                                            <Popover.Target>
                                                <img loading="lazy" src={`${profile.image ?? '/images/user.png'}`} className='size-7 sm:ize-8 cursor-pointer hover:scale-95 transition-all rounded-full' onClick={() => setPops(o => !o)} />
                                            </Popover.Target>
                                            <Popover.Dropdown styles={{ dropdown: { padding: 0, borderRadius: '1.2rem', marginLeft: '-1rem' } }}>
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-2 border-b border-gray-200 p-4">
                                                        <Imaged2 extra={false} rounded={true} src={`${profile.image ?? '/images/user.png'}`} className="size-8" />
                                                        <div className="">
                                                            <div className="">{profile?.firstName}</div>
                                                            <div className="truncate">{profile?.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        {DropdownLinks.map((item, index) => (
                                                            <Linked to={`${item.url}`} key={index} className="flex items-center gap-4 p-2 hover:bg-background transition-all">
                                                                <item.Icon />
                                                                <div className="">{item.title}</div>
                                                            </Linked>
                                                        ))}
                                                        <div className="border-t border-gray-200">
                                                            <div
                                                                onClick={logout}
                                                                className="flex text-red-600 rounded-b-2xl border-t mt-2 border-gray-200 p-4 items-center gap-4 font-semibold cursor-pointer hover:bg-background transition-all">
                                                                <FiLogOut size="20" />
                                                                <div className="">Log out</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Popover.Dropdown>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>}
            </div>
        </>
    )
}
