

import React from 'react'
import EmptyList from '../pageComponent/EmptyList'
import { Link } from 'react-router'
import NavLinks from './NavLinks'
import Formbutton from '../general/Formbutton'
import Linked from '../general/Linked'
import type { navlinkProps } from 'global'

type componentProps = {
    Headers: string[]
    links: navlinkProps[]
    link?: string
    label: string
    linkTitle?: string
    total: number
    button?: boolean
    onClick?: () => void
}

export default function EmptyTable({ Headers, link, linkTitle, button = false, total, label, links, onClick }: componentProps) {
    return (
        <>
            <NavLinks options={links} header="" total={total} />
            <div className="mb-8 bg-slate-100 py-5 gap-10 lg:gap-5 px-5 flex flex-wrap items-center md:justify-between rounded-lg">
                <div className="">
                    <div className="font-bold text-2xl capitalize">{label} ({total})</div>
                </div>
                {link && <div className="w-fit ml-auto">
                    <Linked className="bg-primary text-white py-2.5 px-4 rounded-md" to={`${link}`}>{linkTitle}</Linked>
                </div>}
                {button && <div className="w-fit ml-auto">
                    <Formbutton title={`${linkTitle}`} onClick={onClick} />
                </div>}
            </div>
            <div className="overflow-x-auto scrollsdown border-x border-slate-300">
                <table className="table w-full border border-slate-300">
                    <thead>
                        <tr className="border-b border-slate-300">
                            {Headers.map((item, index) => (
                                <td className="truncate capitalize text-sm font-semibold p-3 last:text-right" key={index}>{item}</td>
                            ))}
                        </tr>
                    </thead>
                </table>
            </div>
            <EmptyList />
        </>
    )
}
