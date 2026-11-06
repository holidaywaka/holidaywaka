import type { IconType } from "react-icons"
import { BsTaxiFrontFill, BsWifi } from "react-icons/bs"
import { FaBaby, FaSquareParking } from "react-icons/fa6"
import { GiMeal } from "react-icons/gi"
import { TbAirConditioning, TbMassage } from "react-icons/tb"
import {
    MdAccessible, MdBalcony, MdBathtub, MdBeachAccess, MdBusinessCenter, MdCoffee, MdDownhillSkiing, MdElectricCar,
    MdFitnessCenter, MdHotTub, MdKitchen, MdLandscape, MdLocalLaundryService, MdPets, MdPool, MdSmokingRooms,
    MdAir, MdAirportShuttle, MdBed, MdBlinds, MdCheckroom, MdChildFriendly, MdCleaningServices, MdCoffeeMaker, MdDesk,
    MdDryCleaning, MdHealthAndSafety, MdHeatPump, MdIron, MdLocalBar, MdLocalCafe, MdLocalParking, MdLock, MdLuggage,
    MdMicrowave, MdNightShelter, MdPhone, MdRestaurant, MdRoomService, MdShower, MdSpa, MdTranslate, MdTv, MdWater, MdWc, MdWifi,
} from "react-icons/md"

// Keys are ETG serp_filter values (see GET /hotels/filters)
export const hotelSerpFilters = [
    {
        title: 'has_internet',
        icon: BsWifi
    },
    {
        title: 'has_airport_transfer',
        icon: BsTaxiFrontFill
    },
    {
        title: 'has_parking',
        icon: FaSquareParking
    },
    {
        title: 'has_kids',
        icon: FaBaby
    },
    {
        title: 'has_meal',
        icon: GiMeal
    },
    {
        title: 'air_conditioning',
        icon: TbAirConditioning
    },
    {
        title: 'has_spa',
        icon: TbMassage
    },
]

/** Icon for every ETG serp_filter value, used by the amenities filter */
export const serpFilterIcons: Record<string, IconType> = {
    ...Object.fromEntries(hotelSerpFilters.map((item) => [item.title, item.icon])),
    has_breakfast: MdCoffee,
    has_washer: MdLocalLaundryService,
    has_pool: MdPool,
    has_fitness: MdFitnessCenter,
    has_disabled_support: MdAccessible,
    has_business: MdBusinessCenter,
    has_ski: MdDownhillSkiing,
    has_skiing: MdDownhillSkiing,
    beach: MdBeachAccess,
    has_pets: MdPets,
    has_jacuzzi: MdHotTub,
    private_bathroom: MdBathtub,
    kitchen: MdKitchen,
    balcony: MdBalcony,
    with_view: MdLandscape,
    has_smoking: MdSmokingRooms,
    has_ecar_charger: MdElectricCar,
}

/** ETG property kinds as stored on hotel content; unknown kinds fall back to humanizeSlug */
export const hotelKindLabels: Record<string, string> = {
    hotel: 'Hotel',
    apartment: 'Apartment',
    apart_hotel: 'Apart-hotel',
    mini_hotel: 'Mini-hotel',
    bnb: 'Bed and breakfast',
    resort: 'Resort',
    cottage: 'Cottages and houses',
    boutique: 'Boutique and design hotel',
    guesthouse: 'Guesthouse',
    hostel: 'Hostel',
    villa_and_bungalows: 'Villas and bungalows',
    camping: 'Camping',
    glamping: 'Glamping',
    sanatorium: 'Sanatorium',
    castle: 'Castle',
    farm: 'Farm',
    unspecified: 'Other',
}

/** ETG room_amenities slugs -> icon, for the amenity chips on each room group */
export const roomAmenityIcons: Record<string, IconType> = {
    'private-bathroom': MdBathtub,
    'shared-bathroom': MdWc,
    'bath': MdBathtub,
    'shower': MdShower,
    'toiletries': MdCleaningServices,
    'towels': MdDryCleaning,
    'bathrobe': MdDryCleaning,
    'hairdryer': MdAir,
    'safe': MdLock,
    'telephone': MdPhone,
    'tv': MdTv,
    'air-conditioning': TbAirConditioning,
    'heating': MdHeatPump,
    'wi-fi': MdWifi,
    'high-speed-internet-access': MdWifi,
    'desk': MdDesk,
    'iron': MdIron,
    'fridge': MdKitchen,
    'mini-bar': MdLocalBar,
    'tea-or-coffee': MdCoffeeMaker,
    'coffee': MdCoffeeMaker,
    'tea': MdLocalCafe,
    'water': MdWater,
    'kitchen': MdKitchen,
    'kitchen-stuff': MdRestaurant,
    'microwave': MdMicrowave,
    'dining-area': MdRestaurant,
    'washing-machine': MdLocalLaundryService,
    'balcony': MdBalcony,
    'patio': MdBalcony,
    'with-view': MdLandscape,
    'soundproofing': MdNightShelter,
    'blackout-blinds': MdBlinds,
    'wardrobe': MdCheckroom,
    'pets-allowed': MdPets,
    'hypoallergenic': MdHealthAndSafety,
    'fan': MdAir,
}

/** ETG amenity_groups group_name -> icon */
export const amenityGroupIcons: Record<string, IconType> = {
    'General': MdRoomService,
    'Rooms': MdBed,
    'Accessibility': MdAccessible,
    'Services and amenities': MdRoomService,
    'Meals': MdRestaurant,
    'Internet': MdWifi,
    'Transfer': MdAirportShuttle,
    'Languages Spoken': MdTranslate,
    'Tourist services': MdLuggage,
    'Business': MdBusinessCenter,
    'Sports': MdFitnessCenter,
    'Beauty and wellness': MdSpa,
    'Pets': MdPets,
    'Health and Safety Measures': MdHealthAndSafety,
    'Parking': MdLocalParking,
    'Pool and beach': MdPool,
    'Kids': MdChildFriendly,
    'Winter sports': MdDownhillSkiing,
}

/** ETG payment_methods values */
export const paymentMethodLabels: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    american_express: 'American Express',
    amex: 'American Express',
    jcb: 'JCB',
    diners_club: 'Diners Club',
    discover: 'Discover',
    unionpay: 'UnionPay',
    maestro: 'Maestro',
    mir: 'Mir',
    cash: 'Cash',
    bank_transfer: 'Bank transfer',
}
