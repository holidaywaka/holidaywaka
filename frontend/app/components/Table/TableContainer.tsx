import { FiDownloadCloud, FiX } from "react-icons/fi";
import { FiPlus } from 'react-icons/fi'

import React, { useCallback, useEffect, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import { ArrowLeft, Filter } from "iconsax-reactjs";
import { Drawer } from "@mantine/core";
import Table from "./Table";
import Thead from "./Thead";
import Tr from "./Tr";
import Th from "./Th";
import Tbody from "./Tbody";
import Skeleton from "react-loading-skeleton";
import Td from "./Td";
import TablePagination from "./TablePagination";
import { useSearchParams } from "react-router";
import { drawerStyle } from "~/components/utils";
import TableRightoptionComponent from "~/components/Table/TableRightoptionComponent";
import EmptyView from "~/components/Table/EmptyView";
import dayjs from "dayjs";


type emptyDataProps = {
    emptyTitle?: string
    buttonText?: string
    emptySubtitle?: string
    searchContent?: string
    icon?: string
}

type componentProps = {
    children: React.ReactNode
    filterChildren?: React.ReactNode
    searchTitle: string
    totalCount: number
    totalLength: number
    onClick?: () => void
    empty: emptyDataProps
    filters: string[]
    dateRange?: boolean
    statusRange?: boolean
    options: string[]
    back?: boolean
    statusText?: string
    isLoading: boolean
    pageAction: () => void
    filterAction?: {
        open: () => void
        close: () => void
    }
    filterView?: boolean
    rightOptions?: {
        title: string
        tag?: string
        type: string
        options?: {
            label: string
            value: string
        }[]
    }[]
}

const FilterOptions = [
    {
        title: 'download',
        Icon: FiDownloadCloud
    },
    {
        title: 'filter',
        Icon: Filter
    },
]


const searchDateKeys = ['start_date', 'end_date']

export default function TableContainer({ children, pageAction, back, filterChildren, isLoading, searchTitle, totalCount, totalLength, empty, options = [], onClick, filters, filterAction, filterView, rightOptions }: componentProps) {
    const [searchParams, setSearchParams] = useSearchParams()
    const startDate = searchParams.get(searchDateKeys[0]) ?? null
    const endDate = searchParams.get(searchDateKeys[1]) ?? null
    const searchText = searchParams.get('search') ?? ''
    const page = searchParams.get('page') ?? ''

    const [search, setSearch] = useState(searchText)

    const [value, setValue] = useState<[string | null, string | null]>([startDate, endDate]);

    function RemoveSearchParam(key: string) {
        searchParams.delete(key)
        const newSearch = new URLSearchParams(searchParams)
        setSearchParams(newSearch);
    }

    function RemoveallParams() {
        setSearchParams("?")
    }


    function HandleStatusSelection(item: string, tag: string) {
        if (item.toLowerCase() === 'all') {
            searchParams.delete(tag)
            const newSearch = new URLSearchParams(searchParams)
            return setSearchParams(newSearch);
        } else {
            searchParams.delete(tag)
            const newSearch = new URLSearchParams(searchParams)
            newSearch.append(tag, String(item))
            setSearchParams(newSearch);
        }
    }

    function HandleFilterSelection(item: 'download' | 'filter' | string) {
        if (item === "filter") {
            filterAction?.open()
        }
    }

    function HandleDateAction(value: [string | null, string | null]) {
        if (value.length > 1) {
            setValue(value);
            const regex = new RegExp(`(&?(${searchDateKeys.join("|")})=[^&]*)`, "g")
            const filtered = searchParams.toString().replace(regex, "").replace(/^&/, "")
            const newUrl = `${filtered}${filtered && value.some(v => v) ? '&' : ''}${value[0] ? `&${searchDateKeys[0]}=${dayjs(value[0]).format('YYYY-MM-DD')}` : ''}${value[1] ? `&${searchDateKeys[1]}=${dayjs(value[1]).format('YYYY-MM-DD')}` : ''}`

            setSearchParams(newUrl.replace(/^&/, ''))
        }
    }

    // Fix: Clean Debounce tracking both search text alterations AND current URL states safely
    useEffect(() => {
        // If the input is identical to what's already in the URL, skip setting state to prevent loops
        if (search === (searchParams.get('search') ?? '')) return;

        const timerId = setTimeout(() => {
            // 1. Create a fresh, safe clone of your current parameters to append onto
            const nextParams = new URLSearchParams(searchParams.toString());

            if (search && search.trim().length > 0) {
                nextParams.set('search', search.trim());
            } else {
                nextParams.delete('search');
            }

            // Always preserve pagination indexes context safely if applicable
            if (page) {
                nextParams.set('page', page);
            }

            // 2. Safely push updates without dropping dates, tags, or status filters
            setSearchParams(nextParams);
        }, 600); // 600ms is standard corporate standard for immediate feeling type-ahead search

        return () => {
            clearTimeout(timerId);
        };
    }, [search, searchParams, page, setSearchParams]);

    // Keep internal text state in sync ONLY if the URL changes externally (e.g. Cleared filters)
    useEffect(() => {
        setSearch(searchText);
    }, [searchText]);


    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
    }, [])
    return (
        <>
            <Drawer opened={filterView ?? false} offset={8} onClose={() => filterAction?.close()} position="right" withCloseButton={false} size="md" styles={drawerStyle}>
                <div className="">
                    <div className="flex items-center justify-between px-4 py-4">
                        <div className="font-bold">Advance Filter</div>
                        <div onClick={() => filterAction?.close()} className="cursor-pointer p-2 hover:bg-background transition-all"> <FiX /> </div>
                    </div>
                    {filterChildren}
                </div>
            </Drawer>
            <div className='bg-white rounded-xl p-3 mt-3 text-sm'>
                {back && <div
                    onClick={() => window.history.back()}
                    className="cursor-pointer size-fit text-primary font-semibold py-2 px-5 hover:scale-95 transition-all flex items-center gap-2 hover:bg-blue-100/30 rounded-lg"> <ArrowLeft /> Back</div>}
                <div className="grid grid-cols-1 md:grid-cols-7 items-center py-4 gap-4">
                    <div className="md:col-span-2">
                        <div className="">Search</div>
                        <div className="border border-gray-200 p-2 flex items-center rounded-lg">
                            <FiSearch className='text-gray-400 text-xl' />
                            <input
                                onChange={handleSearchChange}
                                value={search}
                                type="text"
                                className='input-no-border text-xs!'
                                placeholder={searchTitle} />
                        </div>
                    </div>
                    <div className="md:col-span-5">
                        <div className="flex flex-wrap flex-row items-center lg:justify-end gap-3">
                            {rightOptions?.map((item, index) => (
                                <TableRightoptionComponent
                                    value={value}
                                    key={index}
                                    item={item}
                                    HandleDateAction={HandleDateAction}
                                    HandleStatusSelectionAction={HandleStatusSelection}
                                />
                            ))}
                            <div className="self-end flex items-center gap-3">
                                {filters.map((item, index) => {
                                    const ele = FilterOptions.find(ele => ele.title === item)
                                    return (
                                        ele && <div
                                            onClick={() => HandleFilterSelection(item)}
                                            key={index} className="px-2 py-1.5 rounded-md cursor-pointer text-xl border border-gray-300 text-gray-400 active:scale-95 transition-all">
                                            <ele.Icon size={24} />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* show active filters */}
                {searchParams.size > 0 && <div className="border rounded-xl border-gray-200 p-3 mb-2 text-xs">
                    <div className="flex items-center justify-between gap-5 flex-wrap">
                        <div className="flex flex-wrap items-center gap-2 text-primary-dark">
                            <div className="">Active filters</div>
                            <div className=""> <div className="py-1 px-2 bg-background text-xs font-semibold rounded-full">{searchParams.size}</div> </div>
                        </div>
                        <div onClick={RemoveallParams} className="cursor-pointer active:scale-95 transition-all text-[#F59C75]">Clear all</div>
                    </div>
                    <div className="mt-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {searchParams?.toString()?.split("&")?.map((item, index) => {
                                const searchKey = item?.split("=")[0]
                                const searchValue = item?.split("=")[1]
                                const isCorrect = rightOptions?.find(ele => ele.tag === searchKey)?.options?.find(ele => ele.value === searchValue)?.label
                                if (!['action'].includes(searchKey)) return (
                                    <div
                                        onClick={() => RemoveSearchParam(searchKey)}
                                        className="flex items-center gap-2 py-1 px-2 rounded-md bg-[#F6F8FF] border border-gray-200 cursor-pointer active:scale-95 transition-all" key={index}>
                                        <div className="font-bold capitalize">{searchKey?.replace("_", " ")}:</div>
                                        <div className="text-gray-500">{isCorrect ?? searchValue}</div>
                                        <FiX />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>}

                {(!isLoading && totalCount > 0) && <div>

                    <Table>
                        <Thead>
                            <Tr header={true}>
                                {options.map((item: string, index: number) => (
                                    <Th key={index} item={item} />
                                ))}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {children}
                        </Tbody>
                    </Table>
                </div>}

                {(!isLoading && totalCount < 1 && !searchParams.toString()) ? <div>
                    <EmptyTable empty={empty} onClick={onClick} />
                </div> :
                    (!isLoading && (totalCount > 0 && totalLength < 1) && searchParams.toString()) &&
                    <NoSearchResult searchContent={empty.searchContent} />}

                {isLoading && <div>

                    <Table>
                        <Thead>
                            <Tr header={true}>
                                {options.map((item: string, index: number) => (
                                    <Th key={index} item={item} />
                                ))}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {new Array(10).fill(0).map((_, index) => (
                                <Tr key={index} isLoading={isLoading}>
                                    {options.map((_, i) => (
                                        <Td key={i}> <Skeleton height={30} /> </Td>
                                    ))}
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </div>}
                <TablePagination
                    total={totalCount}
                    pageAction={pageAction}
                />
            </div>
        </>
    )
}

type emptyProps = {
    empty: componentProps["empty"],
    onClick?: componentProps["onClick"]
}


function EmptyTable({ empty, onClick }: emptyProps) {
    const { emptyTitle } = empty
    return (
        <div>
            <div className="flex items-center flex-col justify-center text-center gap-2">
                <EmptyView title={String(emptyTitle)} />
            </div>
        </div>
    )
}

function NoSearchResult({ searchContent }: componentProps["empty"]) {
    return (
        <div>
            <div className="flex items-center flex-col justify-center text-center gap-2 py-20">
                <img src="/images/not-found.svg" alt="" className="" />
                <div className="text-lg">{searchContent}</div>
                <div className="text-sm">Try adjusting your filters or date range to see more results.</div>
            </div>
        </div>
    )
}