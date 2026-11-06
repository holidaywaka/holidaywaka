
import { AddSquare, ArrowDown2, MinusSquare } from 'iconsax-reactjs'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { useDispatch } from 'react-redux'
import { FiX } from 'react-icons/fi'
import { BackToTop, SideLinks, SideLinks2 } from '../utils'
import { dispatchTopSidebar } from '~/store/reducer'
import Linked from '../general/Linked'
import { Burger, HoverCard } from '@mantine/core'
import Imaged from '../general/Imaged'

type componentProps = {
  isMobile?: boolean
  opened: boolean
  toggle: () => void
  close: () => void
}

export default function ASidebar({ opened, toggle, close, isMobile }: componentProps) {
  return (
    <div className={`relative! ${isMobile ? '' : 'hidden lg:block'}`}>
      {!isMobile && <div
        onClick={toggle}
        className="absolute top-2 right-1 z-50 cursor-pointer size-fit"> <Burger opened={opened} size="19" /> </div>}

      {!isMobile ? <div className="flex items-center gap-2 p-2">
        <div className="size-8"> <Imaged src="/images/user.png" height='2rem' rounded={true} /> </div>
        {!opened && <div className="">Admin</div>}
      </div> :
        <div className="flex items-center justify-between border-b border-gray-300 px-4 py-1">
          <div className="flex items-center gap-2 p-2">
            <div className='size-8'><Imaged src="/images/user.png" height='2rem' rounded={true} /></div>
            {!opened && <div className="">Admin</div>}
          </div>
          <div onClick={toggle} className="cursor-pointer p-2 hover:bg-background transition-all"> <FiX /> </div>
        </div>}
      <div className=" h-[90dvh] b-10 px-2 overflow-y-auto overflow-x-hidden scrolls scroll-smooth">
        {!opened ? <OpenSideBar
          opened={opened}
          toggle={toggle}
          close={close}
        /> : <CloseSideBar
          opened={opened}
          toggle={toggle}
          close={close}
        />}
      </div>
    </div>
  )
}

function OpenSideBar({ opened, toggle, close }: componentProps) {
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  // detect the main section that matches the current pathname
  const defaultMain =
    SideLinks.find((el) =>
      el.sub.some((item) => pathname.includes(item.key))
    )?.title || ""; // empty string = nothing open if no match

  const [main, setMain] = useState(defaultMain);
  const [isActive, setIsActive] = useState(pathname);

  useEffect(() => {
    // sync active key + main section on path change
    setIsActive(pathname);
    const parent = SideLinks.find((el) =>
      el.sub.some((item) => pathname.includes(item.key))
    );
    if (parent) setMain(parent.title);
  }, [pathname]);

  function HandleActivekey(key: string) {
    setIsActive(key);
    dispatch(dispatchTopSidebar(false));
    close();
  }

  function HandleMainAction(item: string) {
    if (main !== item) return setMain(item);
    setMain(""); // collapse if same item is clicked
  }

  return (
    <>
      {SideLinks.map((el, i) => {
        const isOpen = el.title === main;

        return (
          <div className="" key={i}>
            {/* Main dropdown header */}
            <div
              onClick={() => {
                HandleMainAction(el.title);
                BackToTop();
              }}
              className="px-2 py-3 flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="text-sm font-semibold">{el.title}</div>
              <div className="size-fit">
                {isOpen ? <MinusSquare size="19" /> : <AddSquare size="19" />}
              </div>
            </div>

            {/* Dropdown body */}
            <div
              className={`text-sm! flex flex-col gap-1 overflow-hidden px-2 ${isOpen ? "h-auto" : "h-0"
                }`}
            >
              {el.sub.map((item, index) => {
                const isSelected = isActive.includes(item.key);

                return item.links.length < 1 ? (
                  <Linked
                    onClick={() => {
                      HandleActivekey(item.key);
                      BackToTop();
                    }}
                    to={`${item.key}`}
                    className={`hover:bg-primary ${isSelected ? "bg-primary" : ""
                      } group transition-all rounded-lg`}
                    key={index}
                  >
                    <div
                      className={`flex items-center gap-2 text-gray-600 group-hover:text-white py-2 px-3 ${isSelected ? "text-white" : ""
                        }`}
                    >
                      <item.Icon size="16" />
                      {!opened && <div>{item.title}</div>}
                    </div>
                  </Linked>
                ) : (
                  <div key={index}>
                    {/* Sub dropdown header */}
                    <div
                      onClick={() => HandleActivekey(item.key)}
                      className={`hover:bg-primary ${isSelected ? "bg-primary" : ""
                        } group transition-all rounded-lg cursor-pointer flex items-center justify-between`}
                    >
                      <div
                        className={`flex items-center gap-2 text-gray-600 group-hover:text-white py-2 px-3 ${isSelected ? "text-white" : ""
                          }`}
                      >
                        <item.Icon size="16" />
                        {!opened && <div>{item.title}</div>}
                      </div>
                      {!opened && (
                        <div
                          className={`group-hover:text-white transition-all mr-2 ${isSelected ? "text-white -rotate-180" : ""
                            }`}
                        >
                          <ArrowDown2 size="17" />
                        </div>
                      )}
                    </div>

                    {/* Sub dropdown body */}
                    {!opened && (
                      <div
                        className={`${isSelected ? "h-auto" : "h-0"} overflow-hidden`}
                      >
                        <div className="flex flex-col py-2">
                          {item.links.map((ele, i) => {
                            const subUrl = `${item.key}/${ele.url}`;
                            return (
                              <Linked
                                onClick={() => BackToTop()}
                                to={`${subUrl}`}
                                key={i}
                                className={`py-2 pl-12 hover:text-primary truncate ${pathname.includes(subUrl)
                                  ? "text-primary"
                                  : ""
                                  }`}
                              >
                                {ele.title}
                              </Linked>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}


function CloseSideBar({ opened, toggle, close }: componentProps) {
  const { pathname } = useLocation()
  const [isActive, setIsActive] = useState(pathname ?? SideLinks2[0].key)
  const dispatch = useDispatch()

  function HandleActivekey(key: string) {
    setIsActive(key)
    dispatch(dispatchTopSidebar(false))
    close()
  }

  return (
    <div className="flex flex-col items-center pt-1 space-y-1 pb-16">
      {SideLinks2.map((item, index) => {
        const isSelected = isActive.includes(item.key)
        return (
          <HoverCard shadow="md" key={index} position="right">
            <HoverCard.Target>
              <div>
                <Linked
                  onClick={() => { HandleActivekey(item.key); BackToTop() }}
                  to={`${item.key}`}
                  className={`hover:bg-primary ${isSelected ? 'bg-primary' : 'group'} size-fit transition-all rounded-lg`}>
                  <div className={`flex items-center gap-2 text-gray-600  group-hover:text-white group-hover:bg-primary rounded-lg py-2 px-3 ${isSelected ? 'text-white bg-primary' : ''}`}>
                    <div><item.Icon size="18" /></div>
                    {!opened && <div className="">{item.title}</div>}
                  </div>
                </Linked>
              </div>
            </HoverCard.Target>
            <HoverCard.Dropdown styles={{dropdown: {border: 0}}}>
              <div className="text-sm">{item.title}</div>
            </HoverCard.Dropdown>
          </HoverCard>
        )
      })}
    </div>
  )
}