
import React from 'react'

type componentProps = {
    children: React.ReactNode
    onClick?: () => void
    color?: string
}

export default function Tpop({children, onClick, color}: componentProps) {
  return (
    <div 
    onClick={onClick}
    className={`py-2 px-3 hover:bg-slate-100 rounded-md ${color} cursor-pointer min-w-[13rem] transition-all`}>
        {children}
    </div>
  )
}
