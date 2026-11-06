

import { useDisclosure } from '@mantine/hooks'
import type { TransactionProps } from 'global'
import { useState } from 'react'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tpop from '~/components/Table/Tpop'
import Tr from '~/components/Table/Tr'
import { ClientNaira, humanDateTimeFormat, drawerStyle } from '~/components/utils'
import GetStatus from '~/components/admin/GetStatus'
import { Drawer } from '@mantine/core'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { transactionPropsRes } from '~/routes/general/types'
import TransactionsModal from '~/routes/admin/transactions/transactions/transactions-modal'


export function meta() {
  return [
    { title: `(0) Transactions` },
    { name: "description", content: "Transactions" }
  ];
}

const Headers = [
  "Type",
  "Amount",
  "Reference",
  "status",
  "payment status",
  "Payment Type",
  "Timeline",
  "Date Created",
]

export default function FlightBookings() {
  const [opened, { open, close }] = useDisclosure(false)
  const [single, setSingle] = useState<TransactionProps>({})
  const isSearch = ""
  const [deleteText, setDeletetext] = useState({
    subtitle: `Are you sure you want to cancel this flight reservation? This action cannot be undone.`,
    title: 'Cancel Flight Reservation',
    status: true,
    actionText: "Cancel Reservation"
  })
  const emptytext = {
    emptyTitle: "No Transactions yet",
    buttonText: "",
    emptySubtitle: "",
    searchContent: "No Flight Bookings match your search",
    icon: "/images/emptyflight.svg"
  }
  const { data, isLoading, refetch } = useFetchResponse<transactionPropsRes>({
    endpoint: NewApis.transactions.all,
    isSearch: true,
    header: "Transactions"
  })

  function pageAction() {
    refetch()
  }

  function HandleNewAction() {
    open()
    setSingle({})
  }

  function HandleViewing(item: TransactionProps) {
    open()
    setSingle(item)
    setDeletetext({
      ...deleteText, status: false
    })
  }


  return (
    <div>
      <Drawer
        opened={opened}
        onClose={close}
        title={`Transaction Details`}
        styles={drawerStyle}
        position='right'
      >
        <TransactionsModal
          data={single}
          onUpdated={() => { close(); refetch() }}
        />
      </Drawer>
      <AHeader
        title="Transactions"
        subtitle="View and manage all transactions"
      />
      <div className="w-[96%] mx-auto">
        <NavLinks options={["home", "transactions"]}
          header='Total Transactions'
          total={data?.total || 0}
        />
        <div className="">
          <TableContainer
            totalCount={data?.total ?? 0}
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
            {data?.data?.map((item: TransactionProps, index: number) => (
              <Tr
                actions={['more']}
                footer={index === data?.data?.length - 1 ? true : false}
                key={index}
                onView={() => HandleViewing(item)}
                actionChildren={<>
                  <Tpop onClick={() => HandleViewing(item)}>View</Tpop>
                </>}
              >
                <Td> {item.txType}</Td>
                <Td> {ClientNaira}{item.amount?.toLocaleString()} </Td>
                <Td> {item.txid}</Td>
                <Td> <GetStatus status={item.status || ''} /> </Td>
                <Td> <GetStatus status={item.paymentStatus || ''} /> </Td>
                <Td> {item.paymentType?.split("_")?.join(" ")}</Td>
                <Td> {Number(item.TransactionTimelines?.length || 0)}</Td>
                <Td className="p-3 text-right"> {humanDateTimeFormat(item.createdAt || '')} </Td>
              </Tr>
            ))}
          </TableContainer>
        </div>
      </div>
    </div >
  )
}
