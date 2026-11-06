import { jsonBody, ok, op, paginationParams, ref, str } from "../helpers.js"

const tag = "Users"

export default {
    "/users/add-admin": {
        post: op({
            tag, summary: "Create an admin account",
            body: jsonBody({ firstName: str(), lastName: str(), email: str(null, { format: "email" }), password: str(null, { format: "password" }) }, ["firstName", "lastName", "email", "password"]),
            responses: { 201: ok("Admin account created") },
        }),
    },
    "/users/login": {
        post: op({
            tag, summary: "Sign in",
            description: "On success sets the `access_token` HTTP-only cookie used by admin endpoints.",
            body: jsonBody({ email: str(null, { format: "email" }), password: str(null, { format: "password" }) }, ["email", "password"]),
        }),
    },
    "/users/verify-email": {
        post: op({
            tag, summary: "Verify an email address with an OTP",
            body: jsonBody({ tag: str("Verification purpose", { enum: ["REGISTRATION", "FORGOT-PASSWORD"] }), email: str(null, { format: "email" }), otp: str("One-time code") }, ["tag", "email", "otp"]),
        }),
    },
    "/users/forgot-password": {
        post: op({ tag, summary: "Send a password reset code", body: jsonBody({ email: str(null, { format: "email" }) }, ["email"]) }),
    },
    "/users/resend": {
        post: op({ tag, summary: "Resend the one-time code", body: jsonBody({ email: str(null, { format: "email" }) }, ["email"]) }),
    },
    "/users/reset-password": {
        post: op({
            tag, summary: "Reset password",
            body: jsonBody({ email: str(null, { format: "email" }), password: str(null, { format: "password" }), confirmPassword: str(null, { format: "password" }) }, ["email", "password", "confirmPassword"]),
        }),
    },
    "/users": {
        get: op({ tag, admin: true, summary: "Current signed-in user", responses: { 200: ok("Signed-in user", ref("AnyObject")) } }),
    },
    "/users/logout": {
        post: op({ tag, admin: true, summary: "Sign out (clears the session cookie)" }),
    },
    "/users/notifications": {
        get: op({ tag, admin: true, summary: "My notifications", params: paginationParams, responses: { 200: ok("Paginated notifications", ref("Paginated")) } }),
    },
    "/users/password": {
        put: op({
            tag, admin: true, summary: "Change password",
            body: jsonBody({ currentPassword: str(null, { format: "password" }), newPassword: str(null, { format: "password" }), confirmPassword: str(null, { format: "password" }) }, ["currentPassword", "newPassword", "confirmPassword"]),
        }),
    },
}
