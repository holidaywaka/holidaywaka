
import TaxiLogo from "~/json/taxi.json"
import Lottie from "react-lottie";

export default function NoPickup() {
    return (
        <div className="p-5 bg-white">
            <div className="w-11/12 mx-auto">
                <Lottie
                    options={{
                        animationData: TaxiLogo,
                        loop: true,
                    }}
                    height={"20rem"}
                />
                <div className="text-center text-zinc-600 mt-5 mb-2"> <b>Hi,</b> When ever you are ready!, we are waiting!..</div>
            </div>
        </div>
    )
}
