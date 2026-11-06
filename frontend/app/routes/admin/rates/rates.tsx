
import { Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import type { ratesProps } from 'global'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import AHeader from '~/components/admin/AHeader'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tr from '~/components/Table/Tr'
import { modalStyle } from '~/components/utils'
import Formbutton from '~/components/general/Formbutton'
import RateModal from '~/routes/admin/rates/rate-modal'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import Tpop from '~/components/Table/Tpop'


export function meta() {
    return [
        { title: `(0) Rates` },
        { name: "description", content: "Rates" }
    ];
}

const Headers = [
    "Currency Pairs",
    "Rate",
]

type rateQuoteProps = {
    quote?: string
    value?: string
    id?: string
}

export default function ratePage() {
    const [opened, { open, close }] = useDisclosure(false)
    const [searchParams,] = useSearchParams()
    const [single, setSingle] = useState<rateQuoteProps>({})
    const emptytext = {
        emptyTitle: "No Rates yet",
        buttonText: "",
        emptySubtitle: "",
        searchContent: "No Flight Bookings match your search",
        icon: "/images/emptyflight.svg"
    }

    const { data, isLoading, refetch } = useFetchResponse<ratesProps>({
        endpoint: NewApis.rates.rates,
        isSearch: true,
        header: "Rates"
    })

    function pageAction() {
        refetch()
    }

    function SingleViewAction(item: rateQuoteProps) {
        setSingle(item)
        return open()
    }

    function NewAction() {
        setSingle({})
        open()
    }


    return (
        <div>
            <Modal opened={opened} onClose={close} styles={modalStyle} withCloseButton={false}>
                <RateModal
                    close={close}
                    refetch={pageAction}
                    data={single}
                />
            </Modal>
            <AHeader
                title="Rates"
                subtitle="View all Exchange Rates"
            />
            <div className="w-[96%] mx-auto">
                <div className="mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className=""></div>
                        <div className=""></div>
                       {!data?.id && <div className=""> <Formbutton title="Add Rate" onClick={NewAction} /> </div>}
                    </div>
                </div>
                <div className="">
                    <TableContainer
                        totalCount={1}
                        totalLength={1}
                        pageAction={pageAction}
                        filters={['download', 'filter']}
                        searchTitle='Search by Origin or discount type'
                        empty={emptytext}
                        dateRange={true}
                        options={Headers}
                        isLoading={isLoading}
                    >
                        {!isLoading && data?.quotes?.map((item, index) => (
                            <Tr
                                actions={[]}
                                footer={index === Number(data?.quotes?.length) - 1 ? true : false}
                                key={index}
                                actionChildren={<>
                                <Tpop onClick={() => SingleViewAction({ ...item, id: String(data?.id) })}>View</Tpop>
                                </>}
                            >
                                <Td> {data?.source} - {item?.quote}</Td>
                                <Td> {Number(item?.value)?.toLocaleString()}</Td>
                            </Tr>
                        ))}
                    </TableContainer>
                </div>
            </div>
        </div >
    )
}
