
import { type RouteConfig, index, route, layout, prefix } from "@react-router/dev/routes";

export default [
        route("/qr", "routes/general/qr.tsx"),
    layout("layouts/form-layout.tsx", [
        route("/login", "routes/forms/login.tsx"),
        route("/forgot-password", "routes/forms/forgot-password.tsx"),
        route("/reset-password", "routes/forms/reset-password.tsx"),
        route("/verify-email/:tag", "routes/forms/verify-email.tsx"),
    ]),
    layout("layouts/overall-layout.tsx", [
        layout("layouts/visitors-layout.tsx", [
            layout("layouts/home-layout.tsx", [
                index("routes/general/home/landing.tsx"),
            ]),
            route("/*", "routes/general/not-found.tsx"),
            route("upload-payment", "routes/general/upload-payment.tsx"),
            route("upload-submission", "routes/general/upload-submission.tsx"),

            layout("layouts/GeneralLayout.tsx", [
                route("transfer-search", "routes/general/transfer-search/transfer-search.tsx"),
                route("hotels", "routes/general/hotels/index.tsx"),
                route("transfers", "routes/general/transfers.tsx"),
                route("visa", "routes/general/visa/visa.tsx"),
                route("hotel-search", "routes/general/hotel-search/index.tsx"),
                route("hotel-page", "routes/general/hotel-page/index.tsx"),
                route("hotel-checkout/:id", "routes/general/hotel-checkout/index.tsx"),
                route("hotel-booking/:id", "routes/general/hotel-booking/index.tsx"),
                ...prefix("packages", [
                    route("", "routes/general/packages/packages.tsx"),
                    route("/:slug/:id", "routes/general/packages/single-package.tsx"),
                    route("/:id/checkout", "routes/general/packages/checkout-package.tsx"),
                ]),
                route("blogs", "routes/general/blogs.tsx"),
                route("blogs/:slug/:id", "routes/general/singleblog.tsx"),
                route("get-in-touch", "routes/general/get-in-touch.tsx"),
                route("docs/:tag", "routes/general/docs.tsx"),
                route("verify-payment/:id/:txType", "routes/general/verify-payment.tsx"),
            ]),
        ]),

        layout("layouts/AdminLayout.tsx", [
            ...prefix("admin-portal", [
                route("home", "routes/admin/portal/portal.tsx"),
                route("analytics", "routes/admin/analytics.tsx"),
                route("markup", "routes/admin/markup/markup.tsx"),
                route("my-password", "routes/admin/password/password.tsx"),
                route("notifications", "routes/admin/notifications/notifications.tsx"),
                route("admin-profile", "routes/admin/admin-profile.tsx"),
                route("business-account", "routes/admin/business-account/business-account.tsx"),
                route("rates", "routes/admin/rates/rates.tsx"),
                ...prefix("marketing", [
                    route("contacts", "routes/admin/contacts/contacts.tsx"),
                    route("admin-socials", "routes/admin/socials/socials.tsx"),
                    route("subscriptions", "routes/admin/subscriptions/subscriptions.tsx"),
                ]),
                ...prefix("hotels", [
                    route("bookings", "routes/admin/hotels/hotel-bookings.tsx"),
                    route("content", "routes/admin/hotels/hotel-content.tsx"),
                ]),
                route("vouchers", "routes/admin/vouchers/vouchers.tsx"),
                ...prefix("transfers", [
                    route("all-transfers", "routes/admin/all-transfers.tsx"),
                ]),
                ...prefix("visa", [
                    route("visa-enquiries", "routes/admin/visa/visa-enquiries/visa-enquiries.tsx"),
                    route("visa-countries", "routes/admin/visa/visa-countries/visa-countries.tsx"),
                ]),
                ...prefix("docs", [
                    route("", "routes/admin/docs/docs.tsx"),
                    route("new", "routes/admin/docs/new-docs.tsx"),
                    route("edit/:id", "routes/admin/docs/edit-docs.tsx"),
                ]),
                ...prefix("packages", [
                    route("all-packages", "routes/admin/packages/packages.tsx"),
                    route("trip-enquiries", "routes/admin/packages/trip-enquiries.tsx"),
                    route("new", "routes/admin/packages/new-package.tsx"),
                    route("edit/:slug/:id", "routes/admin/packages/edit-package.tsx"),
                ]),
                ...prefix("transactions", [
                    route("", "routes/admin/transactions/transactions/transactions.tsx"),
                    route(":id/timeline", "routes/admin/transactions/timelines.tsx"),
                ]),
                ...prefix("blogs", [
                    route("all-blogs", "routes/admin/blogs/blogs.tsx"),
                    route("new", "routes/admin/blogs/new-blog.tsx"),
                    route("edit/:id", "routes/admin/blogs/edit-blog.tsx"),
                ]),
            ])
        ])
    ])
] satisfies RouteConfig;
