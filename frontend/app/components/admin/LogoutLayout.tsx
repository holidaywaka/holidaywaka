
import React from 'react'
import { useNavigate } from 'react-router';
import { Logout } from 'iconsax-reactjs';
import { FiX } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import type { RootState } from '~/store/store';
import { ProcessingText } from '../utils';
import Formbutton from '../general/Formbutton';
import { getAlert } from '~/services/get-alert';
import { createResponse, NewApis } from '~/services/new-apis';

type componentProps = {
    close: () => void
}

export default function LogoutLayout({ close }: componentProps) {
    const [loading, setLoading] = React.useState(false)
    const { profile } = useSelector((state: RootState) => state.data)
    const navigate = useNavigate();

    async function action() {
        setLoading(true);
        try {
            const response = await createResponse({
                endpoint: NewApis.users.logout,
                method: "POST",
            })
            getAlert(response.message, 'success');
            close()
            navigate('/login')
        } catch (error) {
            getAlert((error as Error).message, 'error')
        }finally {
            setLoading(false);
        }
    }
    return (
        <div>
            <div className="flex items-center justify-between px-4 py-4">
                <div className="p-2 border border-red-300 rounded-md text-red-600 bg-red-100/50"> <Logout /> </div>
                <div onClick={close} className="cursor-pointer p-2 hover:bg-background transition-all"> <FiX /> </div>
            </div>
            <div className="px-4">
                <div className="font-bold text-black">Logout</div>
                <div className="text-sm"> <span className="font-bold text-black">Hi {profile.firstName}</span> Are you sure you want to <span className="text-red-600">Logout?</span> </div>
            </div>
            <div className="mt-10 pt-4 border-t border-gray-300">
                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-7 gap-5">
                    <div className="md:col-span-3 order-2 md:order-1"><Formbutton title="Cancel" bg="border border-gray-300" onClick={() => loading ? getAlert(ProcessingText, "info") : close()} /></div>
                    <div className="md:col-span-4 order-1 md:order-2"><Formbutton loading={loading} title="Yes, Logout" bg="bg-red-600 text-white" onClick={action} /></div>
                </div>
            </div>
        </div>
    )
}
