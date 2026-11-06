

import type { newslettersProps } from 'global'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tr from '~/components/Table/Tr'
import { humanDateTimeFormat } from '~/components/utils'
import type { newslettersPropsRes } from '~/routes/admin/subscriptions/types'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'


export function meta() {
  return [
    { title: `(0) Subcriptions` },
    { name: "description", content: "Subcriptions" }
  ];
}

const Headers = [
  "Email",
  "Date Subscribed",
]

export default function FlightBookings() {
  const emptytext = {
    emptyTitle: "No Subscriptions yet",
    buttonText: "",
    emptySubtitle: "",
    searchContent: "No Flight Bookings match your search",
    icon: "/images/emptyflight.svg"
  }

  const { data, isLoading, refetch } = useFetchResponse<newslettersPropsRes>({
    endpoint: NewApis.newsletters.newsletters,
    isSearch: true,
    header: "Newsletters"
  })

  function pageAction() {
    refetch()
  }


  return (
    <div>
      <AHeader
        title="Subscriptions"
        subtitle="See all NewsLetter Subscriptions"
      />
      <div className="w-[96%] mx-auto">
        <NavLinks
          options={["home", "newsLetter-subscriptions"]}
          header="Subcriptions"
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
            options={Headers}
            isLoading={isLoading}
          >
            {data?.data?.map((item: newslettersProps, index: number) => (
              <Tr
                actions={['more']}
                footer={index === data?.data?.length - 1 ? true : false}
                key={index}
              >
                <Td className="truncate p-3"> {item.email}</Td>
                <Td className="truncate p-3 text-right"> {humanDateTimeFormat(item.createdAt || '')} </Td>
              </Tr>
            ))}
          </TableContainer>
        </div>
      </div>
    </div >
  )
}
