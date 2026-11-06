


import img from "/images/empty.svg"
export default function EmptyList() {
    return (
        <div>
            <div className="w-11/12 mx-auto my-10">
                <div className="h-[40dvh] !bg-contain !bg-center !bg-no-repeat" style={{ background: `url(${img})` }}></div>
                <div className="text-center">No Resources found yet!.</div>
            </div>
        </div>
    )
}
