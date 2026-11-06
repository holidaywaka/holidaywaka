

import { Drawer, Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { TripProps } from 'global'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tpop from '~/components/Table/Tpop'
import Tr from '~/components/Table/Tr'
import { humanDateFormat, humanDateTimeFormat, modalStyle, drawerStyle, TripTypeOptions } from '~/components/utils'
import GetStatus from '~/components/admin/GetStatus'
import TripModal from '~/routes/admin/packages/trip-modal'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { packagePropsRes } from '~/routes/admin/packages/types'
import TripStatusModal from '~/routes/admin/packages/trip-status-modal'
import dayjs from 'dayjs'


export function meta() {
  return [
    { title: `(0) Packages` },
    { name: "description", content: "Packages" }
  ];
}

const Headers = [
  "title",
  "Trip Type",
  "Duration",
  "status",
  "Date Created",
]

export default function packages() {
  const navigate = useNavigate()
  const [opened, { open, close }] = useDisclosure(false)
  const [dels, setDels] = useDisclosure(false)
  const [searchParams,] = useSearchParams()
  const p = searchParams.get("p")
  const [single, setSingle] = useState<TripProps | null>()
  const emptytext = {
    emptyTitle: "No Package yet",
    buttonText: "",
    emptySubtitle: "",
    searchContent: "No Flight Bookings match your search",
    icon: "/images/emptyflight.svg"
  }

  const { data, isLoading, refetch } = useFetchResponse<packagePropsRes>({
    endpoint: NewApis.trips.admin_all,
    isSearch: true,
    header: "Packages"
  })

  function pageAction() {
    refetch()
  }

  function HandleViewing(item: TripProps, tag: "view" | "update") {
    setSingle(item)
    if (tag === "view") {
      open()
    } else {
      setDels.open()
    }
  }


  return (
    <div>
      <Modal onClose={setDels.close} opened={dels} styles={modalStyle} withCloseButton={false}>
        <TripStatusModal
          refetch={refetch}
          close={setDels.close}
          data={single}
        />
      </Modal>
      <Drawer opened={opened} onClose={close} offset={8} position="right" withCloseButton={false} styles={drawerStyle}>
        <TripModal
          close={close}
          title={single?.id ? "Package details" : ""}
          data={single}
          readOnly={false}
          refetch={refetch}
        />
      </Drawer>
      <AHeader
        title="Packages"
        subtitle="View and manage all Packages"
      />
      <div className="w-[96%] mx-auto">
        <NavLinks options={["home", "packages"]}
          header='Total Packages'
          total={data?.total || 0}
          link="/admin-portal/packages/new"
          title="New Package"
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
            options={Headers}
            isLoading={isLoading}
          >
            {data?.data?.map((item, index) => (
              <Tr
                actions={['more']}
                footer={index === data?.data?.length - 1 ? true : false}
                key={index}
                actionChildren={<>
                  <Tpop onClick={() => HandleViewing(item, "view")}>View</Tpop>
                  <Tpop onClick={() => navigate(`/admin-portal/packages/edit/${item.slug}/${item.id}`)}>Edit Package</Tpop>
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <Tpop onClick={() => HandleViewing(item, "update")}>{item.status === 'true' ? 'Deactivate' : 'Re-Activate'}</Tpop>
                  </div>
                </>}
              >
                <Td> {item.title}</Td>
                <Td> {item.tripType} </Td>
                <Td> {item.tripType === TripTypeOptions.group ? <div>{humanDateFormat(item.startDate || '----')} - {humanDateFormat(item.endDate || '----')}</div> : <div>{dayjs(item.startDate).format("MMMM YYYY")} - {dayjs(item.endDate).format("MMMM YYYY")}</div>} </Td>
                <Td> <GetStatus status={item.status || ''} /> </Td>

                <Td className="p-3 text-right"> {humanDateTimeFormat(item.createdAt || '')} </Td>
              </Tr>
            ))}
          </TableContainer>
        </div>
      </div>
    </div >
  )
}
