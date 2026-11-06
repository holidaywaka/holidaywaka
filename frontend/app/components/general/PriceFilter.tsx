

import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { ClientNaira } from '../utils';
import { useState } from 'react';

interface pricesTypes {
    minprice: number 
    maxprice: number 
}

type ComponentProps = {
    // handlePrice: (value: number[] | number) => void 
    // filterStatus: pricesTypes
    // setFilterStatus: any
    minprice: number 
    maxprice: number 
}

function valuetext(value: number) {
    return `${value}`;
}

export default function PriceFilter(props: ComponentProps) {
    const [content, setContent] = useState({
        min: props.minprice,
        max: props.maxprice
    })

    const handleChange = (event: Event, newValue: number | number[]) => {
        setContent({
            min: (newValue as number[])[0],
            max: (newValue as number[])[1],
        });
        // handlePrice(newValue);
    };

    return (
        <div className="">
            <Box sx={{ width: '100%' }}>
                <Slider
                    value={[content.min, content.max]}
                    onChange={handleChange}
                    valueLabelDisplay="auto"
                    getAriaValueText={valuetext}
                    max={props.maxprice}
                    min={props.minprice}
                />
            </Box>
            <div className="grid grid-cols-2 gap-3">
                <div className="">{ClientNaira}{props?.minprice?.toLocaleString()}</div>
                <div className="ml-auto w-fit">{ClientNaira}{props?.maxprice?.toLocaleString()}</div>
            </div>
        </div>
    );
}