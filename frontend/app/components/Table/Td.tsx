

import React from 'react'

export default function Td({ children, className }: { children: React.ReactNode, className?: string}) {
    return (
        <td className={`text-[0.8rem] truncate p-3 border-b border-gray-200 ${className}`}>
            {children}
        </td>
    )
}
