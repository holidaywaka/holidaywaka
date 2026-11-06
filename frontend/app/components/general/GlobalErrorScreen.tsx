

import Footer from "./Footer"
import Header from "./Header"
import err from "/images/err.svg"

type componentprops = {
  extra?: boolean
}

export default function GlobalErrorScreen({ extra = true }: componentprops) {

  return (
    <>
      {extra ? <Header /> : ''}
      <div className="w-11/12 mx-auto my-10">
        <div className="h-[60dvh] bg-contain bg-center bg-no-repeat" style={{ background: `url(${err})center/contain no-repeat` }}></div>
        <div className="text-center">Unable to Load Resources from the Server at the moment</div>
      </div>
      {extra ? <Footer /> : ''}
    </>
  )
}
