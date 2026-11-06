

import logo from "/images/logo.png"
import { useEffect, useState } from 'react';
import { Slide } from 'react-awesome-reveal';
import { PiTextAlignJustify, PiX } from 'react-icons/pi';
import { IoMdMail } from "react-icons/io"
import { useDisclosure } from '@mantine/hooks';
import { Modal, Popover } from '@mantine/core';
import { HeaderLinks, HeaderLinks2 } from '../utils';
import { FaRegCircleUser } from 'react-icons/fa6';
import ContactForm from './ContactForm';
import Linked from './Linked';
import { useSelector } from 'react-redux';
import type { RootState } from '~/store/store';



function HeaderComponent() {
    const [views, setViews] = useState(false)
    const [opened, { close, open }] = useDisclosure(false)
    const ViewsIcon = views ? PiX : PiTextAlignJustify
    const { geoLocation } = useSelector((state: RootState) => state.data)

    function closeup() {
        setViews(false)
    }

    return (
        <div>
            <Modal opened={opened} onClose={close}>
                <ContactForm onSuccess={close} />
            </Modal>
            <div className="flex items-center justify-between gap-5 w-11/12 mx-auto text-sm">
                {/* <div className="w-11/12 mx-auto flex items-center gap-20"> */}
                <div> <div className="w-24 h-8"> <Linked to="/"> <img src={logo} alt="" className="w-24 h-8 block" loading="lazy" /> </Linked> </div></div>
                <div className="md:flex items-center flex-row hidden">
                    {HeaderLinks.map((item, index) => (
                        item.show && <Linked onClick={closeup} to={`${item.url}`} className={`font-medium truncate text-sm lg:text-base py-2 px-4`} key={index}>{item.title}</Linked>
                    ))}
                </div>
                <div className="text-2xl md:text-3xl flex items-center justify-end gap-4 w-fit ml-auto">
                    <div onClick={() => setViews(e => !e)} className="cursor-pointer active:rotate-180 md:hidden "> <ViewsIcon /> </div>
                    <div onClick={open} className="relative cursor-pointer"> <IoMdMail size="20" /> <div className="absolute top-0 -right-1 animate-bounce bg-red-500 border-2 border-white size-3 rounded-full"></div> </div>
                    {geoLocation?.flag && <div onClick={open} className="relative cursor-pointer size-6"> <img src={geoLocation?.flag} alt="" className="size-6" /> </div>}

                    {/* open login and signup modal */}
                    <Popover width={300} trapFocus position="bottom" withArrow shadow="md">
                        <Popover.Target>
                            <div className="relative cursor-pointer"> <FaRegCircleUser size="20" /> <div className="absolute top-0 -right-1 animate-bounce bg-green-500 border-2 border-white size-3 rounded-full"></div> </div>
                        </Popover.Target>
                        <Popover.Dropdown style={{ padding: 2 }}>
                            <div className="flex flex-col">
                                {HeaderLinks2.map((item, index) => (
                                    <Linked className='hover:bg-slate-100 transition-all outline-none py-2 px-3' to={`${item.url}`} key={index}>{item.title}</Linked>
                                ))}
                            </div>
                        </Popover.Dropdown>
                    </Popover>
                </div>
            </div>
            <div className={`flex flex-col overflow-y-hidden md:hidden ${!views ? 'h-0' : 'h-auto pt-3'} transition-all`}>
                {HeaderLinks.map((item, index) => (
                    <Linked onClick={closeup} to={`${item.url}`} className={`font-medium text-base py-2 px-4 hover:bg-slate-100 trnasition-all`} key={index}>{item.title}</Linked>
                ))}
            </div>
        </div>
    )
}

export default function Header() {
    const [views, setViews] = useState(false)

    useEffect(() => {
        const body = document.querySelector('body');
        if (body) {
            body.onscroll = function () { myFunction(); };
        }
    }, [])

    function myFunction() {
        if (document.body.scrollTop > 250 || document.documentElement.scrollTop > 10) {
            setViews(true)
        } else {
            setViews(false)
        }
    }
    return (
        <div>
            <div className="bg-white p-2">
                <HeaderComponent />
            </div>
            {views && <div className='z-50 fixed top-0 left-0 w-full'>
                <Slide direction="down">
                    <div className="bg-white p-2">
                        <HeaderComponent />
                    </div>
                </Slide>
            </div>}
        </div >
    )
}
