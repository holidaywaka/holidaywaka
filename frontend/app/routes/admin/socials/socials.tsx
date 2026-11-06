
import { Drawer, Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { SocialsProps } from 'global'
import { useState } from 'react'
import AHeader from '~/components/admin/AHeader'
import SocialsModal from "~/routes/admin/socials/social-modal"
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tpop from '~/components/Table/Tpop'
import Tr from '~/components/Table/Tr'
import { humanDateTimeFormat, modalStyle, drawerStyle } from '~/components/utils'
import GetStatus from '~/components/admin/GetStatus'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { socialPropsRes } from '~/routes/admin/socials/types'


export function meta() {
  return [
    { title: `(0) Social Mediums` },
    { name: "description", content: "Socials" }
  ];
}

const Headers = [
  "Title",
  "Content",
  "Status",
  "Date Created",
]

export default function FlightBookings() {
  const [opened, { open, close }] = useDisclosure(false)
  const [dels, setDels] = useDisclosure(false)
  const [reads, setReads] = useState(false)
  const [single, setSingle] = useState<SocialsProps>({})
  const [deleteText, setDeletetext] = useState({
    subtitle: `Are you sure you want to cancel this flight reservation? This action cannot be undone.`,
    title: 'Cancel Flight Reservation',
    status: true,
    actionText: "Cancel Reservation"
  })
  const emptytext = {
    emptyTitle: "No Socials yet",
    buttonText: "",
    emptySubtitle: "",
    searchContent: "No Flight Bookings match your search",
    icon: "/images/emptyflight.svg"
  }

  const { data, isLoading, refetch } = useFetchResponse<socialPropsRes>({
    endpoint: NewApis.socials.admin_all,
    isSearch: true,
    header: "Social Mediums"
  })
  function pageAction() {
    refetch()
  }

  function HandleNewAction() {
    open()
    setSingle({})
  }

  function HandleViewing(item: SocialsProps) {
    open()
    setSingle(item)
    setDeletetext({
      ...deleteText, status: false
    })
  }


  return (
    <div>
      <Modal opened={dels} onClose={setDels.close} centered withCloseButton={false}
        size={deleteText.status ? '' : 'xl'} styles={modalStyle} >
        <SocialsModal
          close={() => { setDels.close(); setReads(false) }}
          isDelete={deleteText}
          data={single}
          readOnly={reads}
          refetch={refetch}
        />
      </Modal>
      <Drawer opened={opened} onClose={close} position='right' withCloseButton={false} styles={drawerStyle}>
        <SocialsModal
          close={() => { close(); setReads(false) }}
          title={single?.id ? "Media details" : ""}
          isDelete={null}
          data={single}
          readOnly={false}
          refetch={refetch}
        />
      </Drawer>
      <AHeader
        title="Socials"
        subtitle="See all Social mediums"
      />
      <div className="w-[96%] mx-auto">
        <NavLinks
          options={["home", "social"]}
          header='Socials'
          total={data?.total || 0}
          title="Add Social Contact"
          onClick={HandleNewAction}
        />
        <div className="">
          <TableContainer
            totalCount={data?.total ?? 0}
            totalLength={data?.data?.length ?? 0}
            pageAction={pageAction}
            filters={['download', 'filter']}
            searchTitle='Search by Origin or discount type'
            empty={emptytext}
            dateRange={true}
            onClick={HandleNewAction}
            options={Headers}
            isLoading={isLoading}
          >
            {data?.data?.map((item: SocialsProps, index: number) => (
              <Tr
                actions={['more']}
                footer={index === data?.data?.length - 1 ? true : false}
                key={index}
                onView={() => HandleViewing(item)}
                actionChildren={<>
                  <Tpop onClick={() => HandleViewing(item)}>View</Tpop>
                </>}
              >
                <Td className="truncate p-3"> {item.tag}</Td>
                <Td className="truncate p-3"> {item.link} </Td>
                <Td className="truncate p-3">  <GetStatus status={item.status || ''} /> </Td>
                <Td className="truncate p-3 text-right"> {humanDateTimeFormat(item.createdAt || '')} </Td>
              </Tr>
            ))}
          </TableContainer>
        </div>
      </div>
    </div >
  )
}
