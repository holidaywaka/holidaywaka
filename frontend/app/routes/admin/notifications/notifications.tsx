

import type { NotificationProps } from 'global'
import { useSearchParams } from 'react-router'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tr from '~/components/Table/Tr'
import { humanDateTimeFormat } from '~/components/utils'
import type { notificationPropsRes } from '~/routes/admin/notifications/types'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'


export function meta() {
  return [
    { title: `(0) Notifications` },
    { name: "description", content: "Notifications" }
  ];
}

const Headers = [
  "Title",
  "Content",
  "Date Created",
]

export default function FlightBookings() {
  const [searchParams,] = useSearchParams()
  const p = searchParams.get("p")
  const isSearch = ""
  const emptytext = {
    emptyTitle: "No Notifications yet",
    buttonText: "",
    emptySubtitle: "",
    searchContent: "No Flight Bookings match your search",
    icon: "/images/emptyflight.svg"
  }
  const { data, isLoading, refetch } = useFetchResponse<notificationPropsRes>({
    endpoint: NewApis.users.notifications,
    isSearch: true,
    header: "Notifications"
  })

  function pageAction() {
    refetch()
  }

  return (
    <div>
      <AHeader
        title="Notifications"
        subtitle="View all Notifications"
      />
      <div className="w-[96%] mx-auto">
        <NavLinks
          options={["home", "notifications"]}
          header="Notifications"
          total={data?.total || 0}
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
            {data?.data?.map((item: NotificationProps, index: number) => (
              <Tr
                actions={['more']}
                footer={index === data?.data?.length - 1 ? true : false}
                key={index}
              >
                <Td> {item.title}</Td>
                <Td> {item.content}</Td>
                <Td className="p-3 text-right"> {humanDateTimeFormat(item.createdAt || '')} </Td>
              </Tr>
            ))}
          </TableContainer>
        </div>
      </div>
    </div >
  )
}
