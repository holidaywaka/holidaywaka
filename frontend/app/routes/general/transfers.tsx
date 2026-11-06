
import { FiClock, FiMapPin, FiShield, FiUserCheck } from 'react-icons/fi'
import PageTrips from '~/components/pageComponent/PageTrips'
import PageHero, { FeatureStrip } from '~/components/general/PageHero'
import HomeCard from '~/routes/general/home/components/home-card'
import { seo } from '~/services/seo'

export function meta() {
    return seo({
        title: "Airport Transfers & Chauffeur Rides",
        description: "Book reliable airport transfers and hourly chauffeur rides with fixed prices, meet-and-greet and professional drivers worldwide.",
        path: "/transfers",
    })
}

const Features = [
    { Icon: FiShield, title: "Fixed prices", content: "The fare you see is the fare you pay. No surge, no surprises." },
    { Icon: FiUserCheck, title: "Meet & greet", content: "Your driver waits at arrivals with a name sign." },
    { Icon: FiClock, title: "Hourly chauffeurs", content: "Keep a car and driver for as many hours as you need." },
    { Icon: FiMapPin, title: "Door to door", content: "Airport, hotel, office or home, wherever you're headed." },
]

export default function transfers() {
    return (
        <div>
            <PageHero
                image="/images/bg8.jpg"
                position="center top"
                title="Airport Transfers"
                subtitle="Reliable rides from airport to doorstep, plus hourly chauffeurs when you need them."
            >
                <HomeCard tag="transfers" />
            </PageHero>
            <FeatureStrip items={Features} />
            <PageTrips />
        </div>
    )
}
