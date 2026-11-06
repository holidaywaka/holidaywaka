

import type { TimelineProps, TransactionProps } from 'global'
import { useParams, useSearchParams } from 'react-router'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tr from '~/components/Table/Tr'
import { ClientNaira, humanDateTimeFormat } from '~/components/utils'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'


export function meta() {
  return [
    { title: `(0) Timelines` },
    { name: "description", content: "Timelines" }
  ];
}

const Headers = [
  "Paid",
  "Balance",
  "Date Paid",
  "Date Created",
]


export default function FlightBookings() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const emptytext = {
    emptyTitle: "No Timeline yet",
    buttonText: "",
    emptySubtitle: "Timelines are created through only when there is a transaction",
    searchContent: "No Flight Bookings match your search",
    icon: "/images/emptyflight.svg"
  }
  const { data, isLoading, refetch } = useFetchResponse<TransactionProps>({
    endpoint: `${NewApis.transactions.all_timelines}/${id}/all`,
    isSearch: true,
    searchParams: searchParams,
    header: "Timelines"
  })

  const total = data?.TransactionTimelines?.length ?? 0


  function pageAction() {
    refetch()
  }

  return (
    <div>
      <AHeader
        title="Timelines"
        subtitle="View all timelines"
      />
      <div className="w-[96%] mx-auto">
        <NavLinks options={["home", "transactions"]}
          total={total}
          header='Total Timeline'
        />
        <div className="">
          <TableContainer
            totalCount={total}
            totalLength={total}
            pageAction={pageAction}
            filters={['download', 'filter']}
            searchTitle='Search by Origin or discount type'
            empty={emptytext}
            dateRange={true}
            options={Headers}
            isLoading={isLoading}
          >
            {data?.TransactionTimelines?.map((item: TimelineProps, index: number) => (
              <Tr
                actions={['more']}
                footer={index === total - 1 ? true : false}
                key={index}
              >
                <Td> {ClientNaira}{item.paid?.toLocaleString()} </Td>
                <Td> {ClientNaira}{item.balance?.toLocaleString()} </Td>
                <Td className="p-3"> {humanDateTimeFormat(item.datePaid || '')} </Td>
                <Td className="p-3"> {humanDateTimeFormat(item.createdAt || '')} </Td>
              </Tr>
            ))}
          </TableContainer>
        </div>
      </div>
    </div >
  )
}
