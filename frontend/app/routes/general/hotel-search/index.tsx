import React from 'react'
import dayjs from 'dayjs';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import HotelListings from '~/routes/general/hotel-search/partials/hotels-listings';
import { Clock, Filter, People, SearchNormal1 } from 'iconsax-reactjs';
import Formbutton from '~/components/general/Formbutton';
import HotelFilters from '~/routes/general/hotel-search/hotel-filters';
import { Drawer, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Skeleton from 'react-loading-skeleton';
import Hotels from '~/routes/general/home/components/hotels';
import { modalStyle } from '~/components/utils';
import { FiX } from 'react-icons/fi';
import { createResponse, NewApis } from '~/services/new-apis';
import ActiveFilters from '~/routes/general/hotel-search/hotel-filters/active-filters';
import { activeFilterCount, DEFAULT_SORT, HotelSortOptions, plural, readSearchFilters, readStay, searchPayload, staySummaryText, writeSearchFilters } from '~/routes/general/hotel-search/hotel-utils';
import type { HotelFilterReference, HotelSearchFilters, HotelSearchResponse, HotelSort, HotelStay } from '~/routes/general/hotel-search/types';
import { useViewerCountry } from '~/routes/general/hotel-search/use-viewer-country';
import { seo } from '~/services/seo';

export function meta() {
    return seo({
        title: "Hotel Search Results",
        description: "Compare available hotels, room rates and meal plans for your dates.",
        noindex: true,
    })
}

export default function index() {
  const [opened, { open, close }] = useDisclosure(false);
  const [filterModalOpened, { open: openFilterModal, close: closeFilterModal }] = useDisclosure(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const regionId = Number(searchParams.get('region'));
  const stay = React.useMemo(() => readStay(searchParams), [searchParams]);
  const filters = React.useMemo(() => readSearchFilters(searchParams), [searchParams]);
  const sort = (searchParams.get('sort') as HotelSort) || DEFAULT_SORT;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const isSearchable = regionId > 0 && stay !== null;
  const viewerCountry = useViewerCountry();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<HotelSearchResponse>({
    queryKey: ['hotel-search', regionId, stay, filters, sort, page, viewerCountry],
    queryFn: () => createResponse({
      endpoint: NewApis.hotels.search,
      method: 'POST',
      data: searchPayload(regionId, stay!, viewerCountry, filters, sort, page),
    }),
    enabled: isSearchable,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: reference } = useQuery<HotelFilterReference>({
    queryKey: ['hotel-filter-reference'],
    queryFn: () => createResponse({ endpoint: NewApis.hotels.filters }),
    staleTime: 60 * 60 * 1000,
  });

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams);
    mutate(params);
    setSearchParams(params);
  }

  function changeFilters(next: HotelSearchFilters) {
    updateParams((params) => {
      writeSearchFilters(params, next);
      params.delete('page');
    });
  }

  function changePage(next: number) {
    updateParams((params) => params.set('page', String(next)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const region = data?.search.region;
  const filterCount = activeFilterCount(filters);
  const filtersPanel = (
    <HotelFilters
      counts={data?.filters}
      reference={reference}
      value={filters}
      onChange={changeFilters}
      currency={data?.search.currency}
      nights={data?.search.nights}
    />
  );

  return (
    <div>
      <Drawer
        opened={filterModalOpened}
        onClose={closeFilterModal}
        styles={{ body: { padding: '0' } }}
        withCloseButton={false}
      >
        <div className="pb-10 relative pt-5">
          <div className="absolute top-3 right-2 cursor-pointer active:scale-95 transition-all text-3xl" onClick={closeFilterModal}> <FiX /> </div>
          <div className="px-3">
            {filtersPanel}
          </div>
        </div>
      </Drawer>
      <Modal
        opened={opened}
        onClose={close}
        withCloseButton={false}
        styles={modalStyle}
        size="lg"
        centered
      >
        <div className="p-3 md:p-4 lg:p-5">
          <div className="mb-3 relative">
            <div
              onClick={close}
              className="absolute top-0 right-0 cursor-pointer active:scale-95 transition-all text-3xl"> <FiX /> </div>
            <div className="text-xl">{region ? `Hotels available in ${region.name}` : 'Search hotels'}</div>
            {stay && <div className="text-xl">for {dayjs(stay.checkin).format('D MMM')} – {dayjs(stay.checkout).format('D MMM YYYY')}</div>}
          </div>
          <Hotels
            isHome={false}
            close={close}
            initialValues={{
              ...(stay ?? {}),
              ...(region ? { destination: { type: 'region', id: region.id, name: region.name, country_code: region.country_code } } : {}),
              stars: filters.stars,
              meals: filters.meals,
            }}
          />
        </div>
      </Modal>
      <div className="w-[95%] md:w-11/12 max-w-7xl mx-auto py-6 grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)] gap-5">
        <aside className="hidden md:block">
          <div className="sticky top-16 pb-20 overflow-y-auto h-[88dvh] space-y-3 pr-1 scrolls">
            <StaySummaryCard regionName={region?.name} stay={stay} onEdit={open} />
            {filtersPanel}
          </div>
        </aside>
        <main className="min-w-0 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/70 p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-zinc-900">
                {data
                  ? <>{region?.name}: {data.total_filtered.toLocaleString()} {data.total_filtered === 1 ? 'property' : 'properties'} available</>
                  : isSearchable ? 'Searching for the best rates...' : 'Start a new hotel search'}
              </h1>
              {stay && <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600">
                <span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-zinc-400" /> {dayjs(stay.checkin).format('ddd, D MMM YYYY')} — {dayjs(stay.checkout).format('ddd, D MMM YYYY')}</span>
                <span className="inline-flex items-center gap-1.5"><People className="size-4 text-zinc-400" /> {staySummaryText(stay)}</span>
                {data && data.total_filtered !== data.total_available && <span className="text-zinc-500">{data.total_available.toLocaleString()} before filters</span>}
              </div>}
            </div>
            <div className="flex items-center flex-wrap gap-2 w-full md:w-fit">
              <button
                type="button"
                onClick={openFilterModal}
                className="md:hidden inline-flex items-center gap-2 h-11 px-3 rounded-lg border border-gray-300 bg-white text-sm font-medium cursor-pointer active:scale-95 transition-all">
                <Filter className="size-4" />
                Filters{filterCount > 0 ? ` (${filterCount})` : ''}
              </button>
              {data && <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
                <span className="hidden sm:inline">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => updateParams((params) => { params.set('sort', e.target.value); params.delete('page'); })}
                  className="h-11 px-3 rounded-lg border border-gray-300 text-sm font-medium text-zinc-900 outline-0 bg-white cursor-pointer">
                  {HotelSortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>}
              <button
                type="button"
                onClick={open}
                className="md:hidden inline-flex items-center gap-2 h-11 px-3 rounded-lg bg-primary text-white text-sm font-medium cursor-pointer active:scale-95 transition-all">
                <SearchNormal1 className="size-4" /> Change search
              </button>
            </div>
          </div>

          <ActiveFilters value={filters} reference={reference} currency={data?.search.currency} onChange={changeFilters} />

          {!isSearchable && (
            <div className="bg-white p-8 rounded-xl text-center text-sm">
              <div className="mb-3">Choose a destination, your dates and guests to see available hotels.</div>
              <div className="w-fit mx-auto"><Formbutton title="Search Hotels" type="button" onClick={open} Icon={SearchNormal1} /></div>
            </div>
          )}

          {isSearchable && isLoading && (
            <div className="space-y-3">
              <div className="text-sm text-zinc-500">Checking live availability with our suppliers. This can take a few seconds.</div>
              {new Array(4).fill(0).map((_, index) => <Skeleton key={index} height={240} borderRadius={12} />)}
            </div>
          )}

          {isSearchable && isError && (
            <div className="bg-white p-8 rounded-xl text-center text-sm space-y-3">
              <div className="text-red-600">{(error as Error)?.message || 'We could not complete your search.'}</div>
              <div className="w-fit mx-auto"><Formbutton title="Try again" type="button" onClick={() => refetch()} /></div>
            </div>
          )}

          {data && data.hotels.length === 0 && (
            <div className="bg-white p-8 rounded-xl text-center text-sm">
              {data.total_available === 0
                ? 'No hotels are available for these dates. Try different dates or another destination.'
                : <div className="space-y-3">
                  <div>No properties match all of your filters. Remove one or clear them to see more results.</div>
                  <div className="w-fit mx-auto"><Formbutton title="Clear all filters" type="button" onClick={() => changeFilters({})} /></div>
                </div>}
            </div>
          )}

          <div className={`space-y-3 ${isFetching && !isLoading ? 'opacity-60 pointer-events-none' : ''} transition-opacity`}>
            {stay && data?.hotels.map((item) => (
              <HotelListings
                key={item.hid}
                hotel={item}
                stay={stay}
                nights={data.search.nights}
                reference={reference}
              />
            ))}
          </div>

          {data && data.total_pages > 1 && (
            <Pagination page={data.page} totalPages={data.total_pages} total={data.total_filtered} pageSize={data.page_size} onChange={changePage} />
          )}
        </main>
      </div>
    </div>
  )
}


function StaySummaryCard({ regionName, stay, onEdit }: { regionName?: string; stay: HotelStay | null; onEdit: () => void }) {
  return (
    <button type="button" onClick={onEdit} className="w-full text-left bg-white rounded-xl border border-slate-200/70 p-3 flex items-start gap-3 cursor-pointer hover:border-zinc-400 transition-colors">
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-semibold text-blue-700 truncate">{regionName ?? 'Choose a destination'}</div>
        {stay ? <>
          <div className="text-zinc-700">{dayjs(stay.checkin).format('D MMM YYYY')} — {dayjs(stay.checkout).format('D MMM YYYY')}</div>
          <div className="text-zinc-700">{staySummaryText(stay)}</div>
        </> : <div className="text-zinc-500">Select dates and guests</div>}
      </div>
      <span className="shrink-0 size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center" aria-label="Change search"><SearchNormal1 className="size-4" /></span>
    </button>
  )
}

/** Numbered pages with ellipses: 1 … 4 5 6 … 13 */
function Pagination({ page, totalPages, total, pageSize, onChange }: { page: number; totalPages: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])].filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const pageButton = 'min-w-10 h-10 px-3 rounded-lg text-sm font-semibold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 pt-2" aria-label="Results pages">
      <div className="text-sm text-zinc-500">Showing {from}–{to} of {plural(total, 'property')}</div>
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={`${pageButton} bg-white border border-slate-200 text-zinc-800 hover:border-zinc-400`}>Back</button>
        {pages.map((item, index) => (
          <React.Fragment key={item}>
            {index > 0 && item - pages[index - 1] > 1 && <span className="px-1 text-zinc-400">…</span>}
            <button
              type="button"
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onChange(item)}
              className={`${pageButton} ${item === page ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-zinc-800 hover:border-zinc-400'}`}>
              {item}
            </button>
          </React.Fragment>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={`${pageButton} bg-primary text-white hover:bg-primary/90`}>Next</button>
      </div>
    </nav>
  )
}
