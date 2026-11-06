

import TaxiLogo from "~/json/taxi.json"
import { ArrowSwapHorizontal, Minus } from 'iconsax-reactjs'
import React from 'react'
import { FiX } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import { Apis, Get } from "~/services/apis";
import { useSearchParams } from "react-router";
import type { singlePlaceProps } from "global";
import { PickupOptions } from "~/components/utils";
import Lottie from "react-lottie";
import Skeleton from "react-loading-skeleton";
import PickupModule from "~/routes/general/home/components/transfers/pickup-module";
import ChauffeurPickupModule from "~/routes/general/home/components/transfers/chauffeur-module";
import { TransferModeTabs } from "~/routes/general/home/components/transfers/place-field";
import DisplaySearchResultBody from "~/routes/general/home/components/transfers/display-search-component";
import { seo } from '~/services/seo';


export function meta() {
    return seo({
        title: "Airport Transfer Search Results",
        description: "Compare available airport transfer and chauffeur options for your trip.",
        noindex: true,
    })
}

export default function TransferSearch() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchParams,] = useSearchParams()
  const origin = searchParams.get("from")
  const transferType = searchParams.get("transferType")
  const destination = searchParams.get("to")
  const pickupUrl = searchParams.get("pickup")
  const [pickup, setPickup] = React.useState(pickupUrl ?? PickupOptions.TRANSFER)
  const isTransfer: boolean = pickup === PickupOptions.TRANSFER

  const pickupQuery = isTransfer ? `-${destination}-${pickup}` : `-${pickup}`


  const { data, isLoading } = useQuery({
    queryKey: [`fetch-transfer-search-info-${origin}${pickupQuery}`],
    queryFn: async () => {
      if (pickup === pickupUrl) {
        if (isTransfer) {
          const [from, to] = await Promise.all([
            Get(`${Apis.iway.single_place}/${origin}`),
            Get(`${Apis.iway.single_place}/${destination}`),
          ])

          const fromResult: singlePlaceProps = from
          const toResult: singlePlaceProps = to

          const details = {
            origin: {
              airportStart: (fromResult.address?.toLowerCase()?.includes("airport") || fromResult.formatted_address?.toLowerCase()?.includes("airport")) ? true : false,
              ...fromResult
            },
            destination: {
              airportStart: (toResult.address?.toLowerCase()?.includes("airport") || toResult.formatted_address?.toLowerCase()?.includes("airport")) ? true : false,
              ...toResult
            }
          }

          return details
        } else {
          const [from] = await Promise.all([
            Get(`${Apis.iway.single_place}/${origin}`),
          ])

          const fromResult: singlePlaceProps = from

          return {
            origin: fromResult, destination: null
          }
        }
      } else {
        return null
      }
    }
  })


  function HandleSelection(item: string) {
    setPickup(item)
  }

  if ((pickup === pickupUrl) && isLoading) return (
    <div>
      <div className="bg-primary">
        <div className="w-11/12 mx-auto grid grid-cols-3 gap-5 p-1">
          <Skeleton baseColor="#013f36" highlightColor="#027060" height="2rem" />
          <Skeleton baseColor="#013f36" highlightColor="#027060" height="2rem" />
          <Skeleton baseColor="#013f36" highlightColor="#027060" height="2rem" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-8 mx-auto my-7 w-11/12 max-w-300 gap-5">
        <div className="lg:col-span-2 rounded-lg sticky top-16 h-80 left-0 hidden lg:block">
          <Skeleton height="20rem" />
        </div>
        <div className="lg:col-span-6 h-fit">
          {new Array(5).fill(0).map((_, index) => (
            <Skeleton key={index} height="10rem" className="mb-2 rounded-lg!" />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="bg-primary">
        {!isOpen ? <div className={`w-11/12 mx-auto grid grid-cols-1 ${isTransfer ? 'lg:grid-cols-7' : 'md:grid-cols-7'} text-white text-sm`}>
          <div className={isTransfer ? `lg:col-span-4` : 'md:col-span-3'}>
            <div className="flex flex-wrap items-center gap-1 lg:gap-3 lg:border-r border-gray-500 relative">
              <div className="p-3.5">{data?.origin?.address}</div>
              {isTransfer && <>
                <div className=""> <ArrowSwapHorizontal size="16" /> </div>
                <div className="p-3.5">{data?.destination?.address} <Minus className="inline" /> ({transferType} Trip)</div>
              </>}
            </div>
          </div>
          <div className={isTransfer ? "lg:col-span-3" : "md:col-span-4"}>
            <div className="grid grid-cols-2">
              <div className="p-3.5 capitalize"> {pickup} </div>
              <div onClick={() => setIsOpen(true)} className="size-fit ml-auto border border-gray-500 py-2 px-4 rounded-lg mt-1 cursor-pointer active:scale-95 transition-all"> Modify </div>
            </div>
          </div>
        </div> :
          <div className="py-3 bg-primary">
            <div className="bg-white py-4 rounded-xl w-11/12 max-w-5xl md:px-10 z-10 relative mx-auto px-3">
              <div onClick={() => setIsOpen(false)} className="absolute top-2 right-2 size-fit cursor-pointer active:scale-95 transition-all text-2xl p-1 bg-slate-100 rounded-lg"> <FiX /> </div>

              <TransferModeTabs value={pickup} onChange={HandleSelection} />

              {isTransfer ? <PickupModule
                origin={data?.origin?.address || ''}
                origin_id={origin}
                transferType={String(transferType)}
                start_country={''}
                destination_id={destination}
                origin2={data?.origin?.formatted_address || data?.origin?.address || ''}
                destination={data?.destination?.address || ''}
                destination2={data?.destination?.formatted_address || data?.destination?.address || ''}
              /> :
                <ChauffeurPickupModule
                  origin={data?.origin?.address || ''}
                  origin_id={origin}
                  origin2={data?.origin?.formatted_address || ''}
                />}
            </div>
          </div>
        }
      </div>
      {(pickup === pickupUrl) ?
        <DisplaySearchResultBody
          start_lat={`${data?.origin?.lat}`}
          start_lon={`${data?.origin?.lng}`}
          finish_lat={`${data?.destination?.lat}`}
          finish_lon={`${data?.destination?.lng}`}
          origin={data?.origin || null}
          destination={data?.destination || null}
          transferType={String(transferType)}
          isTransfer={isTransfer}
        /> :
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
      }
    </div>
  )
}
