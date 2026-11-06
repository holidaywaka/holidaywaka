
import { useState } from "react"
import { Fade } from "react-awesome-reveal";
import msgImage from "/images/message.png"
import { SocialsOptions } from "../utils";
import type { SocialsProps } from "global";
import useFetchResponse from "~/services/fetchResponse";
import { NewApis } from "~/services/new-apis";
import type { socialPropsRes } from "~/routes/admin/socials/types";
import { useDispatch } from "react-redux";
import { dispatchSocials } from "~/store/reducer";

export default function Socials() {
    const [views, setViews] = useState(false);
    const dispatch = useDispatch();

    const { data, isLoading } = useFetchResponse<socialPropsRes>({
        endpoint: NewApis.socials.socials,
        onSuccess: (values) => {
            dispatch(dispatchSocials(values.data))
        }
    })

    if (isLoading) return <div></div>

    function handleCloseViews() {
        setViews(e => !e)
    }
    return (
        <div className='fixed bottom-3 left-2 z-10'>
            <div className="flex flex-col items-center gap-2">
                {views && <>
                    {data?.data?.map((item: SocialsProps, index: number) => {
                        const singles = SocialsOptions.find(ele => ele.tag === item.tag)
                        const seconds = (parseInt(((index + 1) - SocialsOptions.length)?.toString()?.replace('-', '')) + 1) * 10
                        return (
                            <Fade key={index} delay={seconds}>
                                <div className={`${singles?.styles}`}>
                                    <a rel="noreferer" target="_blank" href={item.link}>{singles && <singles.Icon />} </a>
                                </div>
                            </Fade>
                        )
                    })}
                </>}
                <div
                    onClick={handleCloseViews}
                    className="cursor-pointer mt-10 bg-slate-200 rounded-full p-1 animate-bounce border-2 border-white shadow-2xl shadow-slate-800"> <img className="size-10 lg:size-12" src={msgImage} /> </div>
            </div>
        </div>
    )
}
