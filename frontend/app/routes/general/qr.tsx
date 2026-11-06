import { QRCode } from 'react-qrcode'
import { privatePage } from '~/services/seo'

export function meta() {
    return privatePage("QR Code")
}

export default function qr() {
  return (
    <div className='bg-white min-h-dvh flex items-center justify-center'>
        <QRCode 
        value="https://holidaywaka.com" 
        color={{dark: "#002722", light: "#fff"}}
        width={700}
        quality={1}
        />
    </div>
  )
}
