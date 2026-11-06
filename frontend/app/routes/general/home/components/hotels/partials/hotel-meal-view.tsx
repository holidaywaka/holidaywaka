import { FiCheck, FiMinus } from "react-icons/fi";
import { HotelMealLabels } from "~/routes/general/hotel-search/hotel-utils";
import type { HotelMealCategory } from "~/routes/general/hotel-search/types";

const meal_types: HotelMealCategory[] = ["no_meal", "breakfast", "half_board", "full_board", "all_inclusive"];

type props = {
    value: string[];
    onChange: (value: string[]) => void;
}

export default function HotelMealView(props: props) {
    function handleAction(item: string) {
        props.onChange(props.value.includes(item) ? props.value.filter(ele => ele !== item) : [...props.value, item]);
    }
    return (
        <div>
            <div className="font-bold">Meal Types</div>
            <div className="grid grid-cols-2 md:grid-cols-3">
                {meal_types.map((item) => {
                    const isSelected = props.value.includes(item);
                    const Icon = isSelected ? <FiCheck /> : <FiMinus />
                    return (
                        <div onClick={() => handleAction(item)} className="flex gap-2 hover:bg-slate-100 transition-all cursor-pointer active:scale-95 p-2 rounded-lg" key={item}>
                            <div className="">
                                <div className={`size-6 border ${isSelected ? 'border-primary text-white bg-primary' : 'border-gray-300 text-zinc-400'} rounded-sm flex items-center justify-center`}>
                                    {Icon}
                                </div>
                            </div>
                            <div className="">
                                <div className="font-bold text-sm">{HotelMealLabels[item].short}</div>
                                <div className="text-xs text-zinc-400">{HotelMealLabels[item].label}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
