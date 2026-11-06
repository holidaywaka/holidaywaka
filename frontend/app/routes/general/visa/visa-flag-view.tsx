import { ApiCountries, ApiCountryFlags } from '~/components/general/ApiCountries';


type props = {
    country: String;
}
export default function VisaFlagView(props: props) {
    const countryName = ApiCountries.find(ele => ele.name?.toLowerCase().includes(String(props.country)?.toLowerCase()));
    const flag = !countryName?.code ? null : ApiCountryFlags.find(ele => ele.name?.toLowerCase() === countryName?.code?.toLowerCase())


    return (
        <div className="font-semibold flex items-center gap-3">
            {flag && <img src={flag.data} alt="" className="size-6" />}
            <span>{props.country}</span>
        </div>
    )
}
