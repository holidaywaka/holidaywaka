import { file, jsonBody, multipartBody, ok, op, paginationParams, pathParam, queryParam, ref, str } from "../helpers.js"

// Site content and settings: bank details, contacts, newsletters, socials, blogs, legal docs

const idParam = pathParam("id", "Record id", { type: "string", format: "uuid" })
const statusParam = queryParam("status", "Filter by status", { type: "string", enum: ["true", "false"] })

export default {
    // ------------------------------------------------------------------ Bank
    "/bank": {
        get: op({ tag: "Bank", summary: "Company bank account details (for bank-transfer payments)", responses: { 200: ok("Bank details", ref("AnyObject")) } }),
        post: op({
            tag: "Bank", admin: true, summary: "Add bank account details",
            body: jsonBody({ accountName: str(), accountNumber: str(), bankName: str() }, ["accountName", "accountNumber", "bankName"]),
            responses: { 201: ok("Created") },
        }),
    },
    "/bank/{id}": {
        post: op({
            tag: "Bank", admin: true, summary: "Update bank account details", params: [idParam],
            body: jsonBody({ accountName: str(), accountNumber: str(), bankName: str() }),
        }),
    },

    // ------------------------------------------------------------------ Contacts
    "/contacts": {
        post: op({
            tag: "Contacts", summary: "Submit a contact enquiry",
            body: jsonBody({ name: str(), contact: str("Email address or phone number"), message: str() }, ["name", "contact", "message"]),
            responses: { 201: ok("Enquiry received") },
        }),
        get: op({ tag: "Contacts", admin: true, summary: "List contact enquiries", params: paginationParams, responses: { 200: ok("Paginated enquiries", ref("Paginated")) } }),
    },

    // ------------------------------------------------------------------ Newsletters
    "/newsletters": {
        post: op({ tag: "Newsletters", summary: "Subscribe to the newsletter", body: jsonBody({ email: str(null, { format: "email" }) }, ["email"]), responses: { 201: ok("Subscribed") } }),
        get: op({ tag: "Newsletters", admin: true, summary: "List subscribers", params: paginationParams, responses: { 200: ok("Paginated subscribers", ref("Paginated")) } }),
    },

    // ------------------------------------------------------------------ Socials
    "/socials": {
        get: op({ tag: "Socials", summary: "Active social media links", params: [...paginationParams, statusParam], responses: { 200: ok("Paginated links", ref("Paginated")) } }),
        post: op({ tag: "Socials", admin: true, summary: "Add a social link", body: jsonBody({ link: str(null, { format: "uri" }), tag: str("Platform, e.g. FACEBOOK") }, ["link", "tag"]), responses: { 201: ok("Created") } }),
    },
    "/socials/all": {
        get: op({ tag: "Socials", admin: true, summary: "All social links (admin)", params: [...paginationParams, statusParam], responses: { 200: ok("Paginated links", ref("Paginated")) } }),
    },
    "/socials/{id}": {
        put: op({ tag: "Socials", admin: true, summary: "Update a social link", params: [idParam], body: jsonBody({ link: str(), tag: str(), status: str(null, { enum: ["true", "false"] }) }) }),
        delete: op({ tag: "Socials", admin: true, summary: "Delete a social link", params: [idParam] }),
    },

    // ------------------------------------------------------------------ Blogs
    "/blogs": {
        get: op({ tag: "Blogs", summary: "Published blog posts", params: [...paginationParams, statusParam], responses: { 200: ok("Paginated posts", ref("Paginated")) } }),
    },
    "/blogs/{id}": {
        get: op({ tag: "Blogs", summary: "Single blog post", params: [idParam], responses: { 200: ok("Blog post", ref("AnyObject")) } }),
    },
    "/blogs/admin/all": {
        get: op({ tag: "Blogs", admin: true, summary: "All blog posts (admin)", params: [...paginationParams, statusParam], responses: { 200: ok("Paginated posts", ref("Paginated")) } }),
    },
    "/blogs/create": {
        post: op({
            tag: "Blogs", admin: true, summary: "Create a blog post",
            body: multipartBody({ title: str(), read: str("Reading time, e.g. \"5 min\""), content: str("HTML content"), media: file("Cover image") }, ["title", "read", "content", "media"]),
            responses: { 201: ok("Created") },
        }),
    },
    "/blogs/update": {
        put: op({
            tag: "Blogs", admin: true, summary: "Update a blog post",
            body: multipartBody({ id: str(null, { format: "uuid" }), title: str(), read: str(), content: str(), status: str(null, { enum: ["true", "false"] }), media: file("New cover image (optional)") }, ["id"]),
        }),
    },
    "/blogs/delete/{id}": {
        delete: op({ tag: "Blogs", admin: true, summary: "Delete a blog post", params: [idParam] }),
    },

    // ------------------------------------------------------------------ Legal docs
    "/docs": {
        get: op({ tag: "Docs", summary: "Published site documents (terms, privacy, refund policy)", params: [...paginationParams, statusParam], responses: { 200: ok("Paginated documents", ref("Paginated")) } }),
    },
    "/docs/tag/{tag}": {
        get: op({ tag: "Docs", summary: "Document by tag", params: [pathParam("tag", "Document tag", { type: "string", enum: ["terms_and_conditions", "privacy_policy", "refund_policy"] })], responses: { 200: ok("Document", ref("AnyObject")) } }),
        delete: op({ tag: "Docs", admin: true, summary: "Delete a document", params: [pathParam("tag", "Document tag")] }),
    },
    "/docs/manage": {
        post: op({ tag: "Docs", admin: true, summary: "Create or update a document", body: jsonBody({ tag: str("Document tag"), content: str("HTML content") }, ["tag", "content"]) }),
    },
    "/docs/all": {
        get: op({ tag: "Docs", admin: true, summary: "All documents (admin)", params: [...paginationParams, statusParam], responses: { 200: ok("Paginated documents", ref("Paginated")) } }),
    },
}
