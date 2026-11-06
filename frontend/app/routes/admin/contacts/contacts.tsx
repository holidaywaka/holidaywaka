

import { Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { ContactProps } from 'global'
import { useState } from 'react'
import AHeader from '~/components/admin/AHeader'
import ContactModal from '~/components/admin/modals/ContactModal'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tpop from '~/components/Table/Tpop'
import Tr from '~/components/Table/Tr'
import { humanDateTimeFormat, modalStyle } from '~/components/utils'
import type { contactPropsRes } from '~/routes/admin/contacts/types'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'


export function meta() {
  return [
    { title: `(0) Contacts` },
    { name: "description", content: "Contacts" }
  ];
}

const Headers = [
  "Name",
  "Contact",
  "Message",
  "Date Created",
]

export default function FlightBookings() {
  const [opened, { open, close }] = useDisclosure(false)
  const [dels, setDels] = useDisclosure(false)
  const [reads, setReads] = useState(false)
  const [single, setSingle] = useState<ContactProps>({})
  const [deleteText, setDeletetext] = useState({
    subtitle: `Are you sure you want to cancel this flight reservation? This action cannot be undone.`,
    title: 'Cancel Flight Reservation',
    status: true,
    actionText: "Cancel Reservation"
  })
  const emptytext = {
    emptyTitle: "No Contacts yet",
    buttonText: "",
    emptySubtitle: "",
    searchContent: "No Flight Bookings match your search",
    icon: "/images/emptyflight.svg"
  }

  const { data, isLoading, refetch } = useFetchResponse<contactPropsRes>({
    endpoint: NewApis.contacts.contacts,
    isSearch: true,
    header: "Contacts"
  })

  function pageAction() {
    refetch()
  }

  function HandleNewAction() {
    open()
    setSingle({})
  }

  function HandleViewing(item: ContactProps) {
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
        <ContactModal
          close={() => { setDels.close(); setReads(false) }}
          isDelete={deleteText}
          data={single}
          readOnly={reads}
          refetch={refetch}
        />
      </Modal>
      <Modal opened={opened} onClose={close} centered withCloseButton={false} styles={modalStyle}>
        <ContactModal
          close={() => { close(); setReads(false) }}
          title={single?.id ? "Contact details" : ""}
          isDelete={null}
          data={single}
          readOnly={false}
          refetch={refetch}
        />
      </Modal>
      <AHeader
        title="Contacts"
        subtitle="See all contact enquiries"
      />
      <div className="w-[96%] mx-auto">
        <NavLinks
          options={["home", "contacts"]}
          header='Contacts'
          total={data?.total || 0}
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
            {data?.data?.map((item: ContactProps, index: number) => (
              <Tr
                actions={['more']}
                footer={index === data?.data?.length - 1 ? true : false}
                key={index}
                onView={() => HandleViewing(item)}
                actionChildren={<>
                  <Tpop onClick={() => HandleViewing(item)}>View</Tpop>
                </>}
              >
                <Td className="truncate p-3"> {item.name}</Td>
                <Td className="truncate p-3"> {item.contact} </Td>
                <Td className="truncate p-3"> {item.message?.slice(0, 20)}... </Td>
                <Td className="truncate p-3 text-right"> {humanDateTimeFormat(item.createdAt || '')} </Td>
              </Tr>
            ))}
          </TableContainer>
        </div>
      </div>
    </div >
  )
}
