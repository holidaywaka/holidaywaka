// Small builders that keep the per-route OpenAPI files short and consistent.

export const ref = (name) => ({ $ref: `#/components/schemas/${name}` })

const jsonContent = (schema) => ({ content: { "application/json": { schema } } })

export const object = (properties, required = [], description) => ({
    type: "object",
    ...(description ? { description } : {}),
    properties,
    ...(required.length ? { required } : {}),
})

export const str = (description, extra = {}) => ({ type: "string", ...(description ? { description } : {}), ...extra })
export const num = (description, extra = {}) => ({ type: "number", ...(description ? { description } : {}), ...extra })
export const int = (description, extra = {}) => ({ type: "integer", ...(description ? { description } : {}), ...extra })
export const bool = (description) => ({ type: "boolean", ...(description ? { description } : {}) })
export const arr = (items, description) => ({ type: "array", items, ...(description ? { description } : {}) })
export const date = (description) => str(description, { format: "date", example: "2027-02-22" })
export const uuid = (description) => str(description, { format: "uuid" })
export const anyObject = (description) => ({ type: "object", additionalProperties: true, ...(description ? { description } : {}) })

export const jsonBody = (properties, required = [], description) => ({
    required: true,
    ...(description ? { description } : {}),
    ...jsonContent(object(properties, required)),
})

export const multipartBody = (properties, required = []) => ({
    required: true,
    content: { "multipart/form-data": { schema: object(properties, required) } },
})

export const file = (description) => ({ type: "string", format: "binary", description })

export const pathParam = (name, description, schema = { type: "string" }) => ({ name, in: "path", required: true, description, schema })
export const queryParam = (name, description, schema = { type: "string" }, required = false) => ({ name, in: "query", required, description, schema })

export const paginationParams = [
    queryParam("p", "Page number (1-based)", { type: "integer", minimum: 1 }),
    queryParam("page_size", "Items per page (max 100)", { type: "integer", minimum: 1, maximum: 100 }),
    queryParam("search", "Free-text search"),
]

export const ok = (description = "Success", schema = ref("Message")) => ({ description, ...jsonContent(schema) })

const errorResponses = {
    400: { description: "Validation error", ...jsonContent(ref("ValidationError")) },
    404: { description: "Not found", ...jsonContent(ref("Message")) },
    500: { description: "Server error", ...jsonContent(ref("ServerError")) },
}
const adminErrorResponses = {
    403: { description: "Not signed in, or not an admin", ...jsonContent(ref("Message")) },
}

/**
 * Builds one operation.
 * @param {{ tag: string, summary: string, description?: string, admin?: boolean, params?: any[], body?: any, responses?: Record<string, any> }} spec
 */
export const op = ({ tag, summary, description, admin = false, params, body, responses = {} }) => ({
    tags: [tag],
    summary,
    ...(description ? { description } : {}),
    ...(admin ? { security: [{ cookieAuth: [] }] } : { security: [] }),
    ...(params?.length ? { parameters: params } : {}),
    ...(body ? { requestBody: body } : {}),
    responses: {
        // Default success response unless the operation documents its own 2xx
        ...(Object.keys(responses).some((code) => code.startsWith("2")) ? {} : { 200: ok() }),
        ...responses,
        ...errorResponses,
        ...(admin ? adminErrorResponses : {}),
    },
})
