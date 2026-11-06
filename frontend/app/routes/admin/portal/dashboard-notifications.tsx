
import type { NotificationProps, navlinkProps } from "global"
import EmptyTable from "~/components/admin/EmptyTable"
import NavLinks from "~/components/admin/NavLinks"
import { humanDateTimeFormat } from "~/components/utils"
import useFetchResponse from "~/services/fetchResponse"
import { NewApis } from "~/services/new-apis"



const optionsLinks: navlinkProps[] = ['home', 'notifications']

const Headers = [
  "Title",
  "Content",
  "Date Created",
]

type DataProps = {
  data?: NotificationProps[]
  total?: number
}


export default function PortalNotify() {
  const { data, isLoading } = useFetchResponse<DataProps>({
    endpoint: NewApis.users.notifications,
    isSearch: true,
    limit: 10
  })

  if (isLoading) return (
    <div className="text-center">Loading...</div>
  )

  if (!isLoading && (data?.data?.length === 0)) return <EmptyTable
    links={optionsLinks}
    Headers={Headers}
    total={data.total || 0}
    label="Latest Notifications"
  />

  return (
    <div>
      {/* <NavLinks options={optionsLinks} header="" total={0} /> */}
      <div className="mb-8 bg-slate-100 py-5 px-5 flex flex-wrap items-center md:justify-between rounded-lg">
        <div className="">
          <div className="font-bold text-base">Latest Notifications ({data?.total || 0})</div>
        </div>
      </div>
      <div className="overflow-x-auto scrollsdown border-x border-slate-300">
        <table className="table w-full border border-slate-300">
          <thead>
            <tr className="border-b border-slate-300">
              {Headers.map((item, index) => (
                <td className="truncate capitalize text-sm font-semibold p-3 last:text-right" key={index}>{item}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((item, index) => (
              <tr
                className="border-b hover:bg-slate-100 transition-all text-sm border-slate-300" key={index}>
                <td className="truncate p-3"> {item.title}</td>
                <td className="truncate p-3"> {item.content}</td>
                <td className="truncate p-3 text-right"> {humanDateTimeFormat(item.createdAt || '')} </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
