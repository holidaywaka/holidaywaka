import type { NotificationProps } from "global"

export type notificationPropsRes = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    "data": NotificationProps[]
}