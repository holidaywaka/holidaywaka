

import Linked from '../general/Linked'
import type { navlinkProps } from 'global'
import { SideLinks2 } from '../utils'
import Formbutton from '../general/Formbutton'


type ComponentProps = {
    options: navlinkProps[]
    onClick?: () => void
    title?: string
    link?: string
    header: string
    total: number
}

export default function NavLinks({ options, link, onClick, title, header, total }: ComponentProps) {
    const isTotal = Number(total) > 9 ? Number(total ?? 0) : `0${Number(total ?? 0)}`
    return (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl mt-5 flex-wrap">
            <div className="">
                <div className='flex items-center gap-2 text-sm font-medium mt-2 mb-2 capitalize'>
                    {options.map((item: navlinkProps, index: number) => {
                        const page = SideLinks2.find(ele => ele.title === item)
                        if (page) return (
                            <Linked key={index} to={page.url}>
                                <span className="px-2 capitalize">{page.title?.replace("-", " ")}</span>
                                {index === options.length - 1 ? '' : '/'}
                            </Linked>
                        )
                    })}
                </div>
                {header && <>
                    <div className="">{header}</div>
                    <div className="font-extrabold text-xl">{(isTotal ?? 0)?.toLocaleString()}</div>
                </>}
            </div>
            <div className="">
                {link ? <Linked to={link} className='bg-primary text-white py-3 px-4 rounded-lg'>{title}</Linked> : title ? <Formbutton title={`${title}`} onClick={onClick} /> : null}
            </div>
        </div>
    )
}
