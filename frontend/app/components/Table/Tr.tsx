import { BsThreeDotsVertical } from "react-icons/bs";
import { Edit2, Eye, Trash } from 'iconsax-reactjs'
import Skeleton from "react-loading-skeleton";
import { Popover } from "@mantine/core";
import React from "react";

type componentProps = {
  children: React.ReactNode
  actionChildren?: React.ReactNode
  onView?: () => void
  deleteAction?: () => void
  viewAction?: () => void
  editAction?: () => void
  moreAction?: () => void
  header?: boolean
  footer?: boolean
  actions?: string[]
  isLoading?: boolean
}


export default function Tr({ children, onView, actionChildren, isLoading, deleteAction, editAction, moreAction, actions = [], viewAction, header = false, footer = false }: componentProps) {
  const [active, setActive] = React.useState(false)
  const [opened, setOpened] = React.useState(false);

  function HandleMoreActionToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setOpened((o) => !o)
  }

  function HandleMoreAction() {
    console.log("seen")
  }

  const ActionButtons = [
    { Icon: Trash, title: 'delete', action: deleteAction, color: 'text-red-600' },
    { Icon: Eye, title: 'view', action: viewAction, color: '' },
    { Icon: Edit2, title: 'edit', action: editAction, color: '' },
    { Icon: BsThreeDotsVertical, title: 'more', action: HandleMoreAction, color: '' },
  ]

  function HandleRowBoxClick() {
    setActive(o => !o)
  }

  function HandleTableRowClick(e: React.MouseEvent) {
    // onView?.()
    // e.stopPropagation()
    setOpened((o) => !o)
  }
  return (
    <>
      <Popover opened={opened} onChange={setOpened}>
        <Popover.Target>
          <tr
            onClick={HandleTableRowClick}
            className={`${header ? 'bg-background' : ''} transition-all cursor-pointer hover:bg-gray-100/60`}>
            <td className={`p-3 ${header ? 'rounded-tl-xl border-y' : 'border-b'} ${footer ? 'rounded-bl-xl border-y' : 'border-b'} border-gray-200 border-l`}>
              <div onClick={HandleRowBoxClick} className={`size-5 rounded-sm border-2 hover:scale-105 transition-all hover:border-primary cursor-pointer ${active ? 'bg-primary border-primary' : 'border-[#CDCDCD]'}`}></div>
            </td>
            {children}
            {header && <td className={`p-3 ${header ? 'rounded-tr-xl border-y' : 'border-b'} border-gray-200 border-r`}>
              {actions.length > 0 ? 'Actions' : ''}
            </td>}
            {!header && <td className={`p-3 ${header ? 'rounded-tr-xl border-y' : 'border-b'} ${footer ? 'rounded-br-xl border-y' : 'border-b'} border-gray-200 border-r`}>
              {isLoading && <div> <Skeleton height={30} /> </div>}
            </td>}
          </tr>
        </Popover.Target>

        <Popover.Dropdown styles={{ dropdown: { padding: "0.5rem" } }}>
          <div onClick={() => setOpened(false)}>
            {actionChildren}
          </div>
        </Popover.Dropdown>
      </Popover>
    </>
  )
}

