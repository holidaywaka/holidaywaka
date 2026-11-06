import type { BlogProps } from "global"

export type blogPropsRes = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    "data": BlogProps[]
}
