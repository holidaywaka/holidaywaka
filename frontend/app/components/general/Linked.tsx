

import { Link } from 'react-router'


type componentProps = {
    to: string 
    target?: '_self' | '_blank' | '_parent' | '_top'
    children: React.ReactNode
    onClick?: () => void
    Icon?: any
    position?: 'left' | 'right'
    className?: string
}

export default function Linked({to, target="_self", children, onClick, Icon, position, className}: componentProps) {
  return (
    <Link target={target} to={`${to}`} className={className} onClick={onClick} prefetch="viewport">{Icon ? position === "left" ? <Icon /> : '' : ''}{children}{Icon ? position === "right" ? <Icon /> : '' : ''}</Link>
  )
}
