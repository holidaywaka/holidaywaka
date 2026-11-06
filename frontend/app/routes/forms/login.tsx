

import LoginAccess from '~/components/admin/LoginAccess'
import { privatePage } from '~/services/seo'

export function meta() {
    return privatePage("Login")
}

export default function LoginPage() {
  return (
    <div>
      <LoginAccess redirect={true} />
    </div>
  )
}
