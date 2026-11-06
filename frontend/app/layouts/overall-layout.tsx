import { Outlet } from "react-router";
import 'react-quill-new/dist/quill.snow.css';
import 'react-loading-skeleton/dist/skeleton.css'

export default function OverallLayout() {
    return (
        <>
            <Outlet />
        </>
    )
}
