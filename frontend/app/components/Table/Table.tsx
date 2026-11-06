
import React from 'react'

export default function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto scroll-smooth scrollsdown">
      <table className='border-separate border-spacing-0 w-full'>
        {children}
      </table>
    </div>
  )
}
