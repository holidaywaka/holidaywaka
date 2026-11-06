
import { Drawer } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { visacountryProps } from 'global'
import { useState } from 'react'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tpop from '~/components/Table/Tpop'
import Tr from '~/components/Table/Tr'
import { humanDateTimeFormat, drawerStyle } from '~/components/utils'
import GetStatus from '~/components/admin/GetStatus'
import VisaCountryModal from '~/routes/admin/visa/visa-countries/visa-country-modal'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { visaCountryPropsRes } from '~/routes/admin/visa/types'


export function meta() {
  return [
    { title: `(0) Visa Countries` },
    { name: "description", content: "Visa Countries" }
  ];
}

const Headers = [
  "Country",
  "Status",
  "Date Created",
]

export default function FlightBookings() {
  const [opened, { open, close }] = useDisclosure(false)
  const [single, setSingle] = useState<visacountryProps>({})
  const [deleteText, setDeletetext] = useState({
    subtitle: `Are you sure you want to cancel this flight reservation? This action cannot be undone.`,
    title: 'Cancel Flight Reservation',
    status: true,
    actionText: "Cancel Reservation"
  })
  const emptytext = {
    emptyTitle: "No Visa Country yet",
    buttonText: "",
    emptySubtitle: "",
    searchContent: "No Flight Bookings match your search",
    icon: "/images/emptyflight.svg"
  }
  const { data, isLoading, refetch } = useFetchResponse<visaCountryPropsRes>({
    endpoint: NewApis.visa.admin_all,
    isSearch: true,
    header: "Visa Countries"
  })
  
  function pageAction() {
    refetch()
  }

  function HandleNewAction() {
    open()
    setSingle({})
  }

  function HandleViewing(item: visacountryProps) {
    open()
    setSingle(item)
    setDeletetext({
      ...deleteText, status: false
    })
  }


  return (
    <div>
      <Drawer opened={opened} onClose={close} offset={8} position='right' withCloseButton={false} styles={drawerStyle}>
        <VisaCountryModal
          close={close}
          title={single?.id ? "Service details" : ""}
          isDelete={null}
          data={single}
          readOnly={false}
          refetch={refetch}
        />
      </Drawer>
      <AHeader
        title="Visa Countries"
        subtitle="View and manage all visa countries"
      />
      <div className="w-[96%] mx-auto">
        <NavLinks options={["home", "visa-countries"]}
          total={data?.total || 0}
          header='Total Countries'
          title="New Country"
          onClick={HandleNewAction}
        />
        <div className="">
          <TableContainer
            totalCount={data?.total || 0}
            totalLength={data?.data?.length || 0}
            pageAction={pageAction}
            filters={['download', 'filter']}
            searchTitle='Search by Origin or discount type'
            empty={emptytext}
            dateRange={true}
            onClick={HandleNewAction}
            options={Headers}
            isLoading={isLoading}
          >
            {data?.data?.map((item: visacountryProps, index: number) => (
              <Tr
                actions={['more']}
                footer={index === data?.data?.length - 1 ? true : false}
                key={index}
                onView={() => HandleViewing(item)}
                actionChildren={<>
                  <Tpop onClick={() => HandleViewing(item)}>View</Tpop>
                </>}
              >
                <Td> {item.country}</Td>
                <Td> <GetStatus status={item.status || ''} /> </Td>
                <Td className=""> {humanDateTimeFormat(item.createdAt || '')} </Td>
              </Tr>
            ))}
          </TableContainer>
        </div>
      </div>
    </div >
  )
}
