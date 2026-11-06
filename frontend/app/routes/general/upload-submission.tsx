import React from 'react'
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router';
import Formbutton from '~/components/general/Formbutton';
import SuccessLogo from "~/json/Success.json"
import { privatePage } from '~/services/seo';

export function meta() {
    return privatePage("Payment Proof Submitted")
}

export default function UploadSubmission() {
    const navigate = useNavigate()
    return (
        <div className='min-h-screen py-10 w-11/12 mx-auto max-w-xl text-center'>
            <Lottie
                options={{
                    animationData: SuccessLogo,
                    loop: true,
                }}
                height={"10rem"}
            />
            <div className="font-extrabold text-xl mt-7">Submission well received</div>
            <div className="mt-3 text-center">While your request is still under review for a follow up, you can try out other services we offer that better suits your need..</div>
            <div className="mt-10">
                <Formbutton title="Back to home" onClick={() => navigate('/')} />
            </div>
        </div>
    )
}
