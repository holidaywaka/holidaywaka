

import { useSearchParams } from 'react-router'


type componentProps = {
    single?: string[]
}
export default function CityFilter(props: componentProps) {
    const [searchParams, setSearchParams] = useSearchParams()
    const city = searchParams.get("city") ?? null

    function firstFilter (val: string) {
        if (val === "all") {
            searchParams.delete("city")
            return setSearchParams(searchParams)
        } else {
            searchParams.delete("city")
            const search = new URLSearchParams(searchParams)
            search.append("city", val)
            setSearchParams(search)
        }
    }

    return (
        <div>

            <div>
                <div className="flex flex-col items-center">
                    <div className={`flex items-center gap-2 hover:bg-slate-100 ${!city ? 'bg-slate-100' : ''} cursor-pointer transition-all p-2 w-full`} onClick={() => firstFilter('all')}>
                        <div className={`w-5 h-5 rounded-sm ${!city ? ' bg-primary' : 'bg-slate-200'}`}></div>
                        <span className="checkmark"></span>
                        <div className='capitalize font-medium'>all </div>
                    </div>
                    {props.single?.map((item, i) => (
                        <div className={`flex items-center gap-2 hover:bg-slate-100 ${city === item ? 'bg-slate-100' : ''} cursor-pointer transition-all p-2 w-full`} key={i} onClick={() => firstFilter(item)}>
                            <div className={`w-5 h-5 rounded-sm ${city === item ? ' bg-primary' : 'bg-slate-200'}`}></div>
                            <span className="checkmark"></span>
                            <div className='capitalize font-medium'>{item} </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
