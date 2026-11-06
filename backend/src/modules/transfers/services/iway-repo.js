import dotenv from "dotenv"
import { convertSecondsToHours } from "../../../config/utilities.js"

dotenv.config()


let IMAGE_URL = process.env.IWAY_IMAGES_URL


function formatTransportNodeResponse(data) {
    const details = []
    data.map(ele => {
        return details.push({
            address: ele.formatted_address,
            lat: ele.geometry.location.lat,
            lng: ele.geometry.location.lng,
            description: ele.description,
            place_id: ele.place_id,
            country: ele.country,
            iata: ele.iata,
            city: ele.city,
        })
    })

    return details
}

function formatFindPlaceResponse(data) {
    const details = []
    data.map(ele => {
        return details.push({
            description: ele.description,
            place_id: ele.place_id,
            reference: ele.reference,
            address: ele.structured_formatting.main_text,
            sub_name: ele.structured_formatting.secondary_text,
        })
    })
    return details
}

function formatFindSinglePlaceResponse(ele) {
    return {
        address: ele?.name || ele?.sub_name,
        lat: ele?.geometry?.location?.lat,
        lng: ele?.geometry?.location?.lng,
        viewpor_northeast_lat: ele?.geometry?.viewport?.northeast?.lat,
        viewpor_northeast_lat: ele?.geometry?.viewport?.northeast?.lat,
        viewpor_southwest_lng: ele?.geometry?.viewport?.southwest?.lng,
        viewpor_southwest_lng: ele?.geometry?.viewport?.southwest?.lng,
        place_id: ele?.place_id,
        formatted_address: ele?.formatted_address,
        address_components: ele?.address_components,
    }
}


function formatOfferPricingTransferResponse(data) {
    const details = []
    data.map(ele => {
        return details.push({
            pickup_type: 'transfer',
            travel_time: ele.travel_time,
            delivery_distance: ele.delivery_distance,
            distance: ele.distance,
            price_uid: ele.price_uid,
            price_id: ele.price_id,
            price_rub: ele.price_rub,
            alternative_price: ele.alternative_price,
            currency: ele.currency,
            service_id: ele.service_id,
            minimum_duration: ele.minimum_duration,
            minimum_duration_text: `${convertSecondsToHours(ele.minimum_duration)}hr${convertSecondsToHours(ele.minimum_duration) === 1 ? '' : 's'}`,
            minimum_duration_count: convertSecondsToHours(ele.minimum_duration),
            car_id: ele.car_class?.car_class_id,
            car_title: ele.car_class?.title,
            car_model: ele.car_class?.models.join(', '),
            car_photo: `${IMAGE_URL}/${ele.car_class?.photo}`,
            car_capacity: ele.car_class?.capacity,
            car_luggage_capacity: ele.car_class?.luggage_capacity,
            car_deleted: ele.car_class?.deleted,
            meeting_with_table: ele.car_class?.meeting_with_table,
            allowable_subaddress: ele.allowable_subaddress,
            price_subaddress_rub: ele.price_subaddress_rub,
            alternative_price_subaddress: ele.alternative_price_subaddress,
            cancellation_time: ele.cancellation_time,
            payed_road: ele.payed_road,
            blackout_date: ele.blackout_date,
            allowable_time: ele.allowable_time,
            is_fast_ride: ele.is_fast_ride,
            is_special: ele.is_special,
            flexible_tariff_agreement: ele.flexible_tariff_agreement,
            flexible_tariff: ele.flexible_tariff,
            is_fast_booking: ele.is_fast_booking,
            reward: ele.reward,
            class_services: ele.class_services,
            service_provider: {
                title: ele.service_provider.title,
                rating: ele.service_provider.rating,
                logo: ele.service_provider.logo,
            },
            start_place: {
                place_id: ele.start_place.place_id,
                zone_code: ele.start_time_zone_code,
                title: ele.start_place.title,
                type_title: ele.start_place.type_title,
                terminal: ele.start_place.terminal.join(', '),
            },
            finish_place: {
                place_id: ele.finish_place.place_id,
                zone_code: ele.finish_time_zone_code,
                title: ele.finish_place.title,
                type_title: ele.finish_place.type_title,
                terminal: ele.finish_place.terminal.join(', '),
            },
            additional_services: ele.additional_services,
            additional_services_revert: ele.additional_services_revert,
        })
    })

    return details
}

function formatOfferPricingChauffeurResponse(data) {
    const details = []
    data.map(ele => {
        return details.push({
            pickup_type: 'chauffeur',
            service_id: ele.service_id,
            price_id: ele.price_id,
            alternative_price: ele.price,
            price_per_hour: ele.price_per_hour,
            allowable_time: ele.allowable_time,
            cancellation_time: ele.cancellation_time,
            currency: ele.currency,
            reward: ele.reward,
            blackout_date: ele.blackout_date,
            class_services: ele.class_services,
            car_id: ele.car_class?.car_class_id,
            car_title: ele.car_class?.title,
            car_model: ele.car_class?.models.join(', '),
            car_photo: `${IMAGE_URL}/${ele.car_class?.photo}`,
            car_capacity: ele.car_class?.capacity,
            car_luggage_capacity: ele.car_class?.luggage_capacity,
            car_deleted: ele.car_class?.deleted,
            meeting_with_table: ele.car_class?.meeting_with_table,
            service_provider: {
                title: ele.service_provider.title,
                rating: ele.service_provider.rating,
                logo: ele.service_provider.logo,
            },
            delivery_costs: ele.cost_details.delivery_costs,
            minimum_duration: ele.minimum_duration,
            minimum_duration_text: `${convertSecondsToHours(ele.minimum_duration)}hr${convertSecondsToHours(ele.minimum_duration) === 1 ? '' : 's'}`,
            minimum_duration_count: convertSecondsToHours(ele.minimum_duration),
            delivery_distance: ele.cost_details.delivery_distance,
            car_preparation_price: ele.car_preparation_price,
            start_place: {
                place_id: ele.start_place.place_id,
                zone_code: ele.start_time_zone_code,
                title: ele.start_place.title,
                type_title: ele.start_place.type_title,
                terminal: ele.start_place.terminal.join(', '),
            },
        })
    })
    return details
}


const payableStatusOptions = [
    { title: 0, value: 'Unpaid' },
    { title: 1, value: 'Paid' },
    { title: 5, value: 'Canceled' },
]

const mainStatusOptions = [
    { title: 0, value: `Pending` },
    { title: 1, value: `Processing` },
    { title: 2, value: `Confirmed` },
    { title: 3, value: `Completed` },
    { title: 4, value: `Canceled without penalty` },
    { title: 5, value: `Canceled with penalty` },
    { title: 7, value: `Modified` },
]

const exOrderStatusOptions = [
    { title: 0, value: `Confirmed` },
    { title: 40, value: `Not completed with penalty` },
    { title: 41, value: `Not completed ` },
    { title: 42, value: `Completed with price adjusted` },
    { title: 43, value: `Completed without price change` },
    { title: 44, value: `Canceled without  price change` },
    { title: 45, value: `Canceled with penalty` },
]

const serviceIdOptions = [
    { title: 1, value: `transfer` },
    { title: 2, value: `chauffeur service` },
]

const fareTollOptions = [
    { title: 1, value: `No approval required` },
    { title: 2, value: `Requires approval` },
    { title: 3, value: `Prohibited` },
]

function formatTransferOrder(values) {
    const result = values.map((data) => {
        const payableStatus = payableStatusOptions.find(ele => ele.title === data.payable_status)?.value || payableStatusOptions[0].value

        const mainStatus = mainStatusOptions.find(ele => ele.title === data.status)?.value || mainStatusOptions[0].value

        const exOrderStatus = exOrderStatusOptions.find(ele => ele.title === data.ex_order_status)?.value || exOrderStatusOptions[0].value

        const fareToll = fareTollOptions.find(ele => ele.title === data.fare_on_toll_road)?.value || fareTollOptions[0].value

        const serviceId = serviceIdOptions.find(ele => ele.title === data.service_id)?.value || serviceIdOptions[0].value

        const passengers = data.passengers.map(ele => {
            return {
                name: ele.name,
                email: ele.email,
                phone: ele.phone,
            }
        })

        const additionalServices = data.additional_services.map(ele => {
            return {
                additional_service_list_id: ele.additional_service_list_id,
                type: ele.type,
                category: ele.category,
                price: ele.price,
                service_provider_id: ele.service_provider_id,
            }
        })

        const origin = {
            title: data.start_place?.title,
            type: data?.start_place?.type_title,
            city: data?.start_place?.city,
            city_id: data?.start_place?.city_id,
            terminal_number: data?.start_place?.terminal_number,
            train_carriage_number: data?.start_place?.train_carriage_number,
            timezone: data?.start_place?.timezone,
            flight_number: data?.arrival_number,
            address: data?.location_address_object?.address,
            lat: data?.location_address_object?.geo_data?.geometry?.location?.lat,
            lng: data?.location_address_object?.geo_data?.geometry?.location?.lng,
            place_id: data?.location_address_object?.geo_data?.place_id,
        }

        const destination = {
            title: data?.finish_place?.title,
            type: data?.finish_place?.type_title,
            city: data?.finish_place?.city,
            city_id: data?.finish_place?.city_id,
            terminal_number: data?.finish_place?.terminal_number,
            train_carriage_number: data?.finish_place?.train_carriage_number,
            timezone: data?.finish_place?.timezone,
            flight_number: data?.departure_number,
            address: data?.destination_address_object?.address,
            lat: data?.destination_address_object?.geo_data?.geometry?.location?.lat,
            lng: data?.destination_address_object?.geo_data?.geometry?.location?.lng,
            place_id: data?.destination_address_object?.geo_data?.place_id,
        }

        return {
            duration: data?.duration,
            flexible_tariff: data?.flexible_tariff ? 'true' : 'false',
            is_fast_ride: data?.is_fast_ride ? 'true' : 'false',
            flexible_tariff_agreement: data?.flexible_tariff_agreement ? 'true' : 'false',
            date_change: data?.date_change,
            date: data?.date,
            date_arrival: data?.date_arrival,
            user_id: data?.user_id,
            order_id: data?.order_id,
            order_type: data?.order_type,
            transaction: data?.transaction,
            payable_status: payableStatus,
            status: mainStatus,
            ex_order_status: exOrderStatus,
            service_id: serviceId,
            bookingCode: data?.booker_number,
            allowable_booking_time: `${data?.allowable_time} Hours`,
            cancellation_time: `${data?.cancellation_time} Hours`,
            currency: data?.currency,
            price_id: data?.price?.price_id,
            price: data?.price?.price,
            car_title: data?.car_data?.title,
            car_capacity: data?.car_data?.capacity,
            car_models: data?.car_data?.models,
            car_photo: `${IMAGE_URL}/${data?.car_data?.photo}`,
            car_class_id: data?.car_data?.car_class_id,
            passengers: passengers,
            total_adults: data?.adults_amount,
            total_children: data?.children_amount,
            coordinator_name: data?.coordinator?.name,
            coordinator_phone: data?.coordinator?.phone,
            additional_services: additionalServices,
            service_provider: data?.service_provider?.title,
            cancellation_time_without_penalty: data?.cancellation_time_without_penalty,
            fare_on_toll_road: fareToll,
            origin: origin,
            destination: destination,
        }
    })

    return result
}


export {
    formatTransportNodeResponse,
    formatFindPlaceResponse,
    formatOfferPricingTransferResponse,
    formatFindSinglePlaceResponse,
    formatTransferOrder,
    formatOfferPricingChauffeurResponse,
}

