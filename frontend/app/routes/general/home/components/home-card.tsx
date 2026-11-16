import React from 'react'
import { MdOutlineAirportShuttle, MdOutlineBeachAccess, MdOutlineHotel } from 'react-icons/md'
import { isProductionSite } from '~/components/utils'
import Hotels from '~/routes/general/home/components/hotels';
import Transfers from '~/routes/general/home/components/transfers';
import PackagesSearch from '~/routes/general/home/components/packages-search';

type ServiceKey = 'hotels' | 'transfers' | 'packages'

// Widget order: hotel, transfer, holiday packages
const SERVICES: { key: ServiceKey; label: string; short: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'hotels', label: 'Hotels', short: 'Hotels', Icon: MdOutlineHotel },
  { key: 'transfers', label: 'Transfers', short: 'Transfers', Icon: MdOutlineAirportShuttle },
  { key: 'packages', label: 'Holiday packages', short: 'Packages', Icon: MdOutlineBeachAccess },
]

type props = {
  tag: 'home' | 'transfers' | 'hotels';
}

export default function HomeCard(props: props) {
  // Hotels are not live on holidaywaka.com yet: hidden there
  const services = isProductionSite() ? SERVICES.filter((item) => item.key !== 'hotels') : SERVICES
  // Internal state only: switching services never touches the URL
  const [selected, setSelected] = React.useState<ServiceKey>(services[0].key)
  const service = services.some((item) => item.key === selected) ? selected : services[0].key
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  function select(key: ServiceKey) {
    setSelected(key)
  }

  // Arrow keys move between tabs (WAI-ARIA tabs pattern)
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + services.length) % services.length
    select(services[next].key)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="-mt-30 z-10 mx-auto w-[95%] relative">
      {props.tag === 'home' && (
        <div role="tablist" aria-label="What would you like to book?" className="grid grid-flow-col auto-cols-fr items-end gap-1.5 px-1 md:flex md:px-4">
          {services.map((item, index) => {
            const active = service === item.key
            return (
              <button
                key={item.key}
                ref={(element) => { tabRefs.current[index] = element }}
                role="tab"
                id={`service-tab-${item.key}`}
                aria-selected={active}
                aria-controls="service-panel"
                tabIndex={active ? 0 : -1}
                type="button"
                onClick={() => select(item.key)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={`relative min-w-0 inline-flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 rounded-t-xl px-2 md:px-5 cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-inset
                  ${active
                    ? 'h-16 md:h-14 bg-white text-primary font-bold shadow-[0_-6px_16px_-8px_rgba(0,0,0,0.25)]'
                    : 'h-14 md:h-12 mb-1 rounded-b-xl bg-primary/55 text-white/85 font-medium backdrop-blur-md border border-white/20 hover:bg-primary/75 hover:text-white'}`}
              >
                {/* Sand bar marks the selected service */}
                <span aria-hidden className={`absolute top-0 left-3 right-3 h-[3px] rounded-b-full bg-secondary transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
                <item.Icon className={`size-5 ${active ? 'text-primary' : 'text-secondary'}`} />
                <span className="text-xs sm:text-sm md:text-base whitespace-nowrap">
                  <span className="md:hidden">{item.short}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
      <div
        id="service-panel"
        role={props.tag === 'home' ? 'tabpanel' : undefined}
        aria-labelledby={props.tag === 'home' ? `service-tab-${service}` : undefined}
        className="bg-white py-4 px-3 md:px-5 relative rounded-xl"
      >
        <DisplayService tag={props.tag} service={service} />
      </div>
    </div>
  )
}

type DisplayServiceProps = {
  tag: props["tag"]
  service: ServiceKey
}
function DisplayService(props: DisplayServiceProps) {
  if (props.tag === "hotels") return <Hotels isHome={true} />
  if (props.tag === "transfers") return <Transfers />
  return (
    <>
      {props.service === "hotels" && <Hotels isHome={true} />}
      {props.service === "transfers" && <Transfers />}
      {props.service === "packages" && <PackagesSearch />}
    </>
  );
}
