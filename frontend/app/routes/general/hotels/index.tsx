import { FiCreditCard, FiGlobe, FiHeadphones, FiTag } from 'react-icons/fi'
import PageHero, { FeatureStrip } from '~/components/general/PageHero'
import HomeCard from '~/routes/general/home/components/home-card'
import { seo } from '~/services/seo'

export function meta() {
    return seo({
        title: "Hotels – Book Hotel Deals Worldwide",
        description: "Search and book hotels worldwide at great rates. Compare rooms, meal plans and cancellation policies, then pay securely with HolidayWaka.",
        path: "/hotels",
    })
}

const Features = [
    { Icon: FiGlobe, title: "Hotels worldwide", content: "From city stays to beach resorts, in thousands of destinations." },
    { Icon: FiTag, title: "Clear pricing", content: "Compare rooms, meal plans and cancellation terms before you book." },
    { Icon: FiCreditCard, title: "Pay your way", content: "Bank transfer, card, USSD or wallet, all handled securely." },
    { Icon: FiHeadphones, title: "Real support", content: "Our team is on hand before, during and after your stay." },
]

export default function index() {
  return (
    <div>
      <PageHero
        image="/images/bgs7.jpg"
        title="Find your perfect stay"
        subtitle="Search hotels worldwide, compare rooms side by side and book in minutes."
      >
        <HomeCard tag="hotels" />
      </PageHero>
      <FeatureStrip items={Features} />
    </div>
  )
}
