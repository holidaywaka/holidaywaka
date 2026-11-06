import { Bank } from 'iconsax-reactjs'
import React from 'react'
import { FiCheck, FiLock } from 'react-icons/fi';
import { PAYMENT_METHODS } from '~/components/payment/enums';

type props = {
    sendData: (value: string) => void;
}
export default function PaymentOptions(props: props) {
    const [active, setActive] = React.useState('')

    function handleSelection(value: string) {
        setActive(value);
        props.sendData(value);
    }

    const PaymentOptionList = [
        {
            title: `Direct Bank Transfer`,
            content: `Pay by bank transfer with zero electronic fee charged`,
            tag: PAYMENT_METHODS.direct_bank_transfer,
            icon: Bank,
            img: null,
            isLive: true,
        },
        {
            title: `Pay with Unified Payment`,
            content: `Debit card, bank transfer, USSD or wallet, all in one flow`,
            tag: PAYMENT_METHODS.unified_payment_transfer,
            icon: null,
            img: "/images/up.png",
            isLive: true
        },
    ]

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-lg text-primary">Payment method</div>
                <div className="flex items-center gap-1 text-xs text-zinc-500"> <FiLock /> Secure checkout</div>
            </div>
            <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                {PaymentOptionList.map((item, index) => {
                    const selected = active === item.tag
                    return item.isLive && <button
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        key={index}
                        onClick={() => handleSelection(item.tag)}
                        className={`w-full text-left relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-primary bg-primary/3' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                    >
                        <div className="size-12 shrink-0 rounded-lg flex items-center justify-center bg-secondary/20 text-amber-700 overflow-hidden">
                            {item.icon && <item.icon className='size-7' />}
                            {item.img && <img src={item.img} alt="" className='size-10 object-contain' />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-primary">{item.title}</div>
                            <div className="text-sm text-zinc-500">{item.content}</div>
                        </div>
                        <div className={`size-6 shrink-0 rounded-full border-2 flex items-center justify-center text-xs transition-all ${selected ? 'bg-primary border-primary text-white' : 'border-slate-300 text-transparent'}`}>
                            <FiCheck />
                        </div>
                    </button>
                })}
            </div>
        </div>
    )
}
