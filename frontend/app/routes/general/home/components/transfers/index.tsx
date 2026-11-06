
import React from 'react'
import { PickupOptions, TransferOptionType } from '~/components/utils'
import ChauffeurPickupModule from '~/routes/general/home/components/transfers/chauffeur-module'
import PickupModule from '~/routes/general/home/components/transfers/pickup-module'
import { TransferModeTabs } from '~/routes/general/home/components/transfers/place-field'

export default function Transfers() {
  const [pickup, setPickup] = React.useState(PickupOptions.TRANSFER)

  return (
    <div>
      <TransferModeTabs value={pickup} onChange={setPickup} />
      {pickup === PickupOptions.TRANSFER && <PickupModule
        origin=""
        origin2=""
        destination=""
        destination2=""
        start_country=""
        transferType={TransferOptionType.single.title}
        origin_id={null}
        destination_id={null}
      />}
      {pickup === PickupOptions.CHAUFFEUR && <ChauffeurPickupModule
        origin=""
        origin2=""
        origin_id={null}
      />}
    </div>
  )
}
