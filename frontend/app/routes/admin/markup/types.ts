import type { markupProps } from "global";

export type markupPropsRes = {
    "total": number;
    "totalPages": number;
    "p": number;
    "page_size": number;
    "nextPage": number;
    "prevPage": number;
    "message": string
    "data": markupProps[],
    "services": string[]
}