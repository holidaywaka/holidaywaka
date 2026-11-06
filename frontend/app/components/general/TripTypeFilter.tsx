
import { useSearchParams } from 'react-router'

type props = {
  tripTypes: string[]
}

export default function TripTypeFilter(props: props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tripType = searchParams.get("tripType") ?? 'all'

  const handletripTypes = (val: string) => {
    if (val.toLowerCase() === "all") {
      searchParams.delete("tripType")
      setSearchParams(searchParams)
    } else {
      searchParams.delete("tripType")
      const search = new URLSearchParams(searchParams)
      search.append("tripType", val)
      setSearchParams(search)
    }
  }

  return (
    <div>

      <div className='grid grid-cols-2 gap-3 text-sm'>
        <div className={`p-2 hover:bg-slate-100 ${tripType === 'all' ? 'bg-slate-100' : ''} cursor-pointer transition-all flex items-center gap-1`} onClick={() => handletripTypes('all')}>
          <div className={`p-2 rounded-sm w-4 h-4 ${tripType === 'all' ? 'bg-primary' : 'bg-slate-300'}`}></div>
          <div className='capitalize font-medium'>all</div>
        </div>
        {props.tripTypes.map((item, i) => (
          <div className={`p-2 hover:bg-slate-100 ${tripType === item ? 'bg-slate-100' : ''} cursor-pointer transition-all flex items-center gap-1`} key={i} onClick={() => handletripTypes(item)}>
            <div className={`p-2 rounded-sm w-4 h-4 ${tripType === item ? 'bg-primary' : 'bg-slate-300'}`}></div>
            <div className='capitalize font-medium'>{item} </div>
          </div>
        ))}
      </div>
    </div>
  )
}

