
import { Outlet } from 'react-router'
import Footer from '~/components/general/Footer'
import Header from '~/components/general/Header'
import Socials from '~/components/general/Socials'

export default function GeneralLayout() {
    return (
        <div>
            <Header />
            <Outlet />
            <Socials />
            <Footer />
        </div>
    )
}
