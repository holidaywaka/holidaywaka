

import { Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { TripEnquiryProps, navlinkProps } from 'global'
import { useState } from 'react'
import EmptyTable from '~/components/admin/EmptyTable'
import GetStatus from '~/components/admin/GetStatus'
import TripEnquiryModal from '~/components/admin/TripEnquiryModal'
import TablePagination from '~/components/Table/TablePagination'
import { ClientNaira, humanDateFormat, humanDateTimeFormat } from '~/components/utils'
import type { packagePropsRes } from '~/routes/admin/portal/types'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'

const optionsLinks: navlinkProps[] = ['home', 'package-enquiries']

const Headers = [
    "Trip Type",
    "Fullname",
    `Amount (${ClientNaira})`,
    "Travel Date",
    "Status",
    "Payment Status",
    "Date Created",
]

type DataProps = {
    data?: TripEnquiryProps[]
    total?: number
}


export default function PortalPackage() {
    const [opened, { open, close }] = useDisclosure(false)
    const [single, setSingle] = useState({})

    const {data, isLoading, refetch} = useFetchResponse<packagePropsRes>({
        endpoint: NewApis.trips.all_enquiry,
        isSearch: true,
        limit: 10
    })

    function pageAction() {
        refetch()
    }


    function OpenModal(values: TripEnquiryProps) {
        setSingle(values)
        open()
    }


    if (isLoading) return (
        <div className="text-center">Loading...</div>
    )
    
      if (!isLoading && (data?.data?.length === 0)) return <EmptyTable
      links={optionsLinks}
        Headers={Headers}
        total={data?.total || 0}
        label="All trip enquiries"
      />
      
    return (
        <div>
            <Modal withCloseButton={false} opened={opened} onClose={close}>
                <TripEnquiryModal data={single} close={close} refetch={refetch} />
            </Modal>
            <div className="mb-8 bg-slate-100 py-5 px-5 flex flex-wrap items-center md:justify-between rounded-lg">
                <div className="">
                    <div className="font-bold text-xl">All Enquiries ({data?.total})</div>
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
                                onClick={() => OpenModal(item)}
                                className="border-b cursor-pointer hover:bg-slate-100 transition-all text-sm border-slate-300" key={index}>
                                <td className="truncate p-3"> {item.tripType}</td>
                                <td className="truncate p-3"> {item?.travelers?.[0]?.firstName}</td>
                                <td className="truncate p-3"> {item?.Transactions?.amount?.toLocaleString()}</td>
                                <td className="truncate p-3"> {humanDateFormat(item?.travelDate || '')} </td>
                                <td className={`truncate p-3`}> <GetStatus status={item?.status || ''} /> </td>
                                <td className={`truncate p-3`}> <GetStatus status={item?.Transactions?.paymentStatus || ''} /> </td>
                                <td className="truncate p-3 text-right"> {humanDateTimeFormat(item.createdAt || '')} </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <TablePagination 
            total={Number(data?.total || 0)}
            pageAction={pageAction}
            />
        </div>
    )
}
