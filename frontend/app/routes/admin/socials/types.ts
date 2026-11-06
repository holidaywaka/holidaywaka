import type { SocialsProps } from "global"

export type socialPropsRes = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    "data": SocialsProps[]
}
