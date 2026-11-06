

import { Months } from '../utils'
import { useSearchParams } from 'react-router'

type props = {
  month: string[]
  tag: 'startDate' | 'endDate'
}

export default function MonthFilter(props: props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const month = searchParams.get(props.tag) ?? 'all'

  const handleMonths = (val: string) => {
    if (val === "all") {
      searchParams.delete(props.tag)
      setSearchParams(searchParams)
    } else {
      searchParams.delete(props.tag)
      const search = new URLSearchParams(searchParams)
      search.append(props.tag, val)
      setSearchParams(search)
    }
  }

  return (
    <div>

      <div className='grid grid-cols-2 gap-3 text-sm'>
        <div className={`p-2 hover:bg-slate-100 ${month === 'all' ? 'bg-slate-100' : ''} cursor-pointer transition-all flex items-center gap-1`} onClick={() => handleMonths('all')}>
          <div className={`p-2 rounded-sm w-4 h-4 ${month === 'all' ? 'bg-primary' : 'bg-slate-300'}`}></div>
          <div className='capitalize font-medium'>all </div>
        </div>
        {props.month.map((item, i) => (
          <div className={`p-2 hover:bg-slate-100 ${month === item ? 'bg-slate-100' : ''} cursor-pointer transition-all flex items-center gap-1`} key={i} onClick={() => handleMonths(item)}>
            <div className={`p-2 rounded-sm w-4 h-4 ${month === item ? 'bg-primary' : 'bg-slate-300'}`}></div>
            <div className='capitalize font-medium'>{item} </div>
          </div>
        ))}
      </div>
    </div>
  )
}

