

import { Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import AHeader from '~/components/admin/AHeader'
import NavLinks from '~/components/admin/NavLinks'
import TableContainer from '~/components/Table/TableContainer'
import Td from '~/components/Table/Td'
import Tpop from '~/components/Table/Tpop'
import Tr from '~/components/Table/Tr'
import { humanDateTimeFormat, modalStyle } from '~/components/utils'
import GetStatus from '~/components/admin/GetStatus'
import useFetchResponse from '~/services/fetchResponse'
import { NewApis } from '~/services/new-apis'
import type { docsProps, docsPropsRes } from '~/routes/admin/docs/types'
import DocsModal from '~/routes/admin/docs/docs-modal'


export function meta() {
    return [
        { title: `(0) Docs` },
        { name: "description", content: "Docs" }
    ];
}

const Headers = [
    "Tag",
    "status",
    "Date Created",
]

export default function docs() {
    const navigate = useNavigate()
    const [opened, { open, close }] = useDisclosure(false)
    const [single, setSingle] = useState<{data: docsProps | null, tag: 'view' | 'delete'}>({
        data: null,
        tag: "view"
    })
    const emptytext = {
        emptyTitle: "No Docs yet",
        buttonText: "",
        emptySubtitle: "",
        searchContent: "No Flight Bookings match your search",
        icon: "/images/emptyflight.svg"
    }

    const { data, isLoading, refetch } = useFetchResponse<docsPropsRes>({
        endpoint: NewApis.docs.admin_all,
        isSearch: true,
        header: "Docs"
    })

    function pageAction() {
        refetch()
    }

    function HandleViewing(item: docsProps, tag: "view" | "delete") {
        setSingle({ data: item, tag })
        open()
    }


    return (
        <div>
            <Modal onClose={close} opened={opened} styles={modalStyle} title={single.data?.tag}>
                <DocsModal
                    refetch={refetch}
                    close={close}
                    data={single.data}
                    tag={single.tag}
                />
            </Modal>
            <AHeader
                title="Docs"
                subtitle="View and manage all Docs"
            />
            <div className="w-[96%] mx-auto">
                <NavLinks options={["home", "docs"]}
                    header='Total Docs'
                    total={data?.total || 0}
                    link="/admin-portal/docs/new"
                    title="New Docs"
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
                        {data?.data?.map((item, index) => (
                            <Tr
                                actions={['more']}
                                footer={index === data?.data?.length - 1 ? true : false}
                                key={index}
                                actionChildren={<>
                                    <Tpop onClick={() => HandleViewing(item, "view")}>View</Tpop>
                                    <Tpop onClick={() => navigate(`/admin-portal/docs/edit/${item.id}`)}>Edit Docs</Tpop>
                                    <div className="border-t border-red-200 text-red-600 pt-2 mt-2">
                                        <Tpop onClick={() => HandleViewing(item, "delete")}>Delete</Tpop>
                                    </div>
                                </>}
                            >
                                <Td> {item.tag}</Td>
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
