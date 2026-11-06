

import GlobalErrorScreen from '~/components/general/GlobalErrorScreen'
import { privatePage } from '~/services/seo'

export function meta() {
    return privatePage("Page Not Found")
}

export default function NotFound() {
  return (
    <div>
        <GlobalErrorScreen />
    </div>
  )
}
