import { FiCheck, FiMinus } from "react-icons/fi";

const options = [5, 4, 3, 2, 1, 0];

type props = {
    value: number[];
    onChange: (value: number[]) => void;
}

export default function HotelStarsView(props: props) {
    function handleAction(item: number) {
        props.onChange(props.value.includes(item) ? props.value.filter(ele => ele !== item) : [...props.value, item]);
    }
    return (
        <div className="">
            <div className="font-bold">Hotel Ratings</div>
            <div className="grid grid-cols-2 gap-2">
                {options.map((item) => {
                    const isSelected = props.value.includes(item);
                    const Icon = isSelected ? <FiCheck /> : <FiMinus />
                    return (
                        <div onClick={() => handleAction(item)} className="flex gap-2 hover:bg-slate-100 transition-all cursor-pointer active:scale-95 p-2 rounded-lg" key={item}>
                            <div className="">
                                <div className={`size-5 border ${isSelected ? 'border-primary text-white bg-primary' : 'border-gray-300 text-zinc-400'} rounded-sm flex items-center justify-center`}>
                                    {Icon}
                                </div>
                            </div>
                            <div className="">
                                <div className="font-bold text-sm">
                                    {item === 0 ? 'No' : item} stars
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
