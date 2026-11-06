import type { TransactionProps } from "global"

export type transactionPropsRes = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    "data": TransactionProps[]
}