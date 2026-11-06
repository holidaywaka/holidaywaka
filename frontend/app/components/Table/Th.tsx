
import { ArrowDown} from 'iconsax-reactjs'

export default function Th({ item }: { item: string }) {
    const splitted = item.split("|")
    return (
        <th className='text-[0.8rem] truncate p-3 border-y border-gray-200'>
            <div className="flex items-center">
                <span>{splitted?.[0]}</span>
                {splitted?.[1] === 'down-arrow' ? <ArrowDown size="16" className='ml-2' /> : ''}
            </div>
        </th>
    )
}
