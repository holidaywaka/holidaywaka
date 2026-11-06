import { useSearchParams } from 'react-router'
import Hotels from '~/routes/general/home/components/hotels';
import Transfers from '~/routes/general/home/components/transfers';


const listings = [
  {
    img: `/images/hotel.png`,
    title: `hotels`
  },
  {
    img: `/images/airport-taxi.png`,
    title: `transfers`
  },
]

type props = {
  tag: 'home' | 'transfers' | 'hotels';
}

export default function HomeCard(props: props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const service = searchParams.get('service') ?? listings[0].title;

  const hostname = window.location.hostname;
  const isProd = hostname === "holidaywaka.com" || hostname === "www.holidaywaka.com";

  function handleActive(title: string) {
    const search = new URLSearchParams(searchParams);
    search.delete("service");
    search.append("service", title)
    setSearchParams(search);
  }
  

  return (
    <div className="-mt-30 z-10 mx-auto w-[95%] relative">
      {props.tag === 'home' && <div className={`${isProd ? 'hidden' : ''}`}>
        <div className="flex items-center gap-2 ml-3">
          {listings.map((item, index) => (
            <div
              onClick={() => handleActive(item.title)}
              className={`cursor-pointer w-22 active:scale-95 transition-all p-1.5 flex items-center flex-col gap-1 text-sm ${service === item.title ? 'bg-white mt-3 rounded-t-md font-semibold' : 'bg-white mb-1 rounded-md'}`} key={index}>
              <img src={item.img} alt={item.title} className={`${index === 0 ? 'size-8' : 'size-7'} object-cover rounded-md`} />
              <div className="capitalize">{item.title}</div>
            </div>
          ))}
        </div>
      </div>}
      <div className='bg-white py-4 px-3 rounded-xl md:px-5 relative'>
        <DisplayService tag={props.tag} service={service} />
      </div>
    </div>
  )
}

type DisplayServiceProps = {
  tag: props["tag"]
  service: string
}
function DisplayService(props: DisplayServiceProps) {
  if (props.tag === "hotels") return <Hotels isHome={true} />
  if (props.tag === "transfers") return <Transfers />
  return (
    <>
      {props.service === "hotels" && <Hotels isHome={true} />}
      {props.service === "transfers" && <Transfers />}
    </>
  );

}