
import { useDisclosure } from "@mantine/hooks";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router";
import ASidebar from "~/components/admin/ASidebar";
import LoginAccess from "~/components/admin/LoginAccess";
import Footer from "~/components/general/Footer";
import Header from "~/components/general/Header";
import Socials from "~/components/general/Socials";
import type { profilePropsRes } from "~/layouts/types";
import useFetchResponse from "~/services/fetchResponse";
import { NewApis } from "~/services/new-apis";
import { dispatchProfile } from "~/store/reducer";
import type { RootState } from "~/store/store";


export default function AdminLayout() {
  const [opened, { open, close, toggle }] = useDisclosure(false)
  const { profile } = useSelector((state: RootState) => state.data)

  const dispatch = useDispatch()

  const { isLoading } = useFetchResponse<profilePropsRes>({
    endpoint: NewApis.users.profile,
    onSuccess: (value) => {
      dispatch(dispatchProfile(value.data))
    }
  })


  if (isLoading) return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="text-center font-semibold">Loading Dashboard...</div>
    </div>
  )

  if (!isLoading && !profile?.email) return (
    <>
      <Header />
      <Socials />
      <LoginAccess />
      <Footer />
    </>
  )

  if (!isLoading && profile?.email) return (
    <>
      <>
        <div className='overflow-x-hidden!'>
          <div className="flex">
            <div className={`bg-white w-0 ${opened ? 'lg:w-20' : 'lg:w-62'} transition-all h-screen border-r-[3px] border-background`}>
              <ASidebar opened={opened} toggle={toggle} close={close} isMobile={false} />
            </div>
            <div className={`w-full text-sm lg:w-[100% - 15.5rem] pb-10 ml-auto overflow-x-hidden h-dvh overflow-y-auto mainBody scrolls scroll-smooth`}>
              <Outlet />
            </div>
          </div>
        </div>
      </>
    </>
  )
}
