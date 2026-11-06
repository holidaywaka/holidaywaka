
export type docsProps = {
    id: string;
    tag: string;
    content: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export type docsPropsRes = {
    "total": number
    "totalPages": number
    "p": number
    "page_size": number
    "nextPage": number
    "prevPage": number
    "message": string
    "data": docsProps[]
}

export const ClientDocsListings = {
  terms_and_conditions: "Terms and Conditions",
  privacy_policy: "Privacy Policy",
  refund_policy: "Refund Policy",
}