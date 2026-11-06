
import { Drawer } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { BlogProps } from 'global'
import { useState } from 'react'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tpop from '~/components/Table/Tpop'
import Tr from '~/components/Table/Tr'
import { humanDateTimeFormat, drawerStyle } from '~/components/utils'
import GetStatus from '~/components/admin/GetStatus'
import BlogModal from '~/routes/admin/blogs/blog-modal'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { blogPropsRes } from '~/routes/admin/blogs/types'


export function meta() {
  return [
    { title: `(0) Blogs` },
    { name: "description", content: "Blogs" }
  ];
}

const Headers = [
  "title",
  "read",
  "Video Link",
  "status",
  "Date Created",
]

export default function FlightBookings() {
  const [opened, { open, close }] = useDisclosure(false)
  const [dels, setDels] = useDisclosure(false)
  const [single, setSingle] = useState<BlogProps | null>()
  const emptytext = {
    emptyTitle: "No Blog yet",
    buttonText: "",
    emptySubtitle: "",
    searchContent: "No Flight Bookings match your search",
    icon: "/images/emptyflight.svg"
  }
  const { data, isLoading, refetch } = useFetchResponse<blogPropsRes>({
    endpoint: NewApis.blogs.admin_all,
    isSearch: true,
    header: "Blogs"
  })

  function pageAction() {
    refetch()
  }

  function HandleNewAction() {
    open()
    setSingle(null)
  }

  function HandleViewing(item: BlogProps) {
    open()
    setSingle(item)
  }


  return (
    <div>
      <Drawer opened={opened} onClose={close} offset={8} position="right" withCloseButton={false} styles={drawerStyle}>
        <BlogModal
          close={close}
          title={single?.id ? "Blog details" : ""}
          data={single}
          refetch={refetch}
        />
      </Drawer>
      <AHeader
        title="Blogs"
        subtitle="View and manage all Blog posts"
      />
      <div className="w-[96%] mx-auto">
        <NavLinks
          header='Blogs'
          total={data?.total || 0}
          link="/admin-portal/blogs/new"
          title="New Blog"
          options={["home", "blog"]} />

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
            {data?.data?.map((item: BlogProps, index: number) => (
              <Tr
                actions={['more']}
                footer={index === data?.data?.length - 1 ? true : false}
                key={index}
                onView={() => HandleViewing(item)}
                actionChildren={<>
                  <Tpop onClick={() => HandleViewing(item)}>View</Tpop>
                </>}
              >
                <Td> {item.title?.slice(0, 30)}...</Td>
                <Td> {item.read} </Td>
                <Td> {item.url ? 'YES' : 'NO'} </Td>
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
