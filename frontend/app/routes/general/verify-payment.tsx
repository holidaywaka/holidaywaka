import React from 'react';
import type { TransactionProps } from 'global';
import { useQuery } from '@tanstack/react-query';
import Lottie from 'react-lottie';
import { Link, useNavigate, useParams } from 'react-router';
import Formbutton from '~/components/general/Formbutton';
import GatewayDetails from '~/components/payment/gateway-details';
import LoadingIndicator from '~/components/general/LoadingIndicator';
import { ClientTransactionStatusOptions } from '~/components/utils';
import SuccessLogo from "~/json/Success.json"
import { createResponse, NewApis } from '~/services/new-apis';
import { privatePage } from '~/services/seo';

type verifyResponse = {
    transaction: TransactionProps;
    payment: { state: string; status: string | null; reason: string | null } | null;
    booking?: { id: string; reference: string; status: string };
}

const MAX_CHECKS = 24 // ~2 minutes at 5s

export function meta() {
    return privatePage("Verifying Payment")
}

export default function verify_payment() {
    const navigate = useNavigate()
    const { id, txType } = useParams();
    const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useQuery<verifyResponse>({
        queryKey: ['verify-payment', id, txType],
        queryFn: () => createResponse({ endpoint: `${NewApis.transactions.verify_transaction}/${id}/${txType}` }),
        // Unified Payment can take a moment to settle after the customer returns from its checkout page
        refetchInterval: (query) => {
            const status = query.state.data?.transaction?.paymentStatus
            const settled = status === ClientTransactionStatusOptions.paid || status === ClientTransactionStatusOptions.declined
            return settled || query.state.dataUpdateCount >= MAX_CHECKS ? false : 5000
        },
        retry: false,
    })

    if (isLoading) return <LoadingIndicator />

    const status = data?.transaction?.paymentStatus
    const booking = data?.booking

    if (isError) return (
        <div className='min-h-screen py-10 w-11/12 mx-auto max-w-xl text-center space-y-4'>
            <div className="font-extrabold text-xl">We couldn't find this payment</div>
            <div className="text-zinc-600">{(error as Error)?.message}</div>
            <Formbutton title="Back to home" onClick={() => navigate('/')} />
        </div>
    )

    if (status === ClientTransactionStatusOptions.declined) return (
        <div className='min-h-screen py-10 w-11/12 mx-auto max-w-xl text-center'>
            <div className="">
                <img src="/images/cancel.svg" alt="" className="size-30 mx-auto" />
            </div>
            <div className="font-extrabold text-xl mt-7 text-red-600">Payment Declined</div>
            <div className="mt-3 text-center">
                Your payment was not successful{data?.transaction?.declineReason ? `: ${data.transaction.declineReason}` : ''}. Nothing has been confirmed yet.
                If you were debited, the amount will be reversed by your bank. We've emailed you the details.
            </div>
            <div className="mt-6"><GatewayDetails record={data?.transaction?.gatewayResponse} /></div>
            <div className="mt-10">
                <Formbutton title="Back to home" onClick={() => navigate('/')} />
            </div>
        </div>
    )

    if (status === ClientTransactionStatusOptions.paid) return (
        <div className='min-h-screen py-10 w-11/12 mx-auto max-w-xl text-center'>
            <Lottie
                options={{
                    animationData: SuccessLogo,
                    loop: true,
                }}
                height={"10rem"}
            />
            <div className="font-extrabold text-xl mt-7">Payment Successful</div>
            <div className="mt-3 text-center">
                {booking
                    ? 'Your payment has been received. We are confirming your room with the hotel now — follow the progress on your booking page.'
                    : 'Your payment has been received and processed securely. Please check your mail for the confirmed invoice. Our team will contact you shortly.'}
            </div>
            <div className="mt-6 space-y-1 text-left">
                <div className="flex justify-between text-sm"><span className="text-zinc-500">Payment reference</span><span className="font-semibold">{data?.transaction?.txid}</span></div>
                <GatewayDetails record={data?.transaction?.gatewayResponse} title="Receipt" />
            </div>
            <div className="mt-10 space-y-3">
                {booking && <Link to={`/hotel-booking/${booking.id}`} className="flex h-12 items-center justify-center rounded-lg bg-primary text-white font-semibold">View booking {booking.reference}</Link>}
                <Formbutton title="Back to home" onClick={() => navigate('/')} />
            </div>
        </div>
    )

    // Stop the spinner once the automatic checks are exhausted (~2 minutes)
    const [startedAt] = React.useState(() => Date.now())
    const gaveUp = dataUpdatedAt - startedAt > MAX_CHECKS * 5000
    return (
        <div className='min-h-screen py-10 w-11/12 mx-auto max-w-xl text-center'>
            {!gaveUp && <div className="loading-wave mx-auto w-fit">
                <div className="loading-bar"></div>
                <div className="loading-bar"></div>
                <div className="loading-bar"></div>
                <div className="loading-bar"></div>
            </div>}
            <div className="font-extrabold text-xl mt-7">{gaveUp ? 'Payment still processing' : 'Confirming your payment...'}</div>
            <div className="mt-3 text-center text-zinc-600">
                {gaveUp
                    ? "Your bank hasn't confirmed the payment yet. You don't need to pay again: we'll email you as soon as it is confirmed."
                    : 'This page updates automatically. Please keep it open for a moment.'}
                {data?.payment?.reason && <div className="mt-2 text-sm">{data.payment.reason}</div>}
            </div>
            <div className="mt-10 space-y-3">
                {gaveUp && <Formbutton title={isFetching ? 'Checking...' : 'Check again'} onClick={() => refetch()} />}
                {booking && <Link to={`/hotel-booking/${booking.id}`} className="block text-blue-700 hover:underline">View booking {booking.reference}</Link>}
            </div>
        </div>
    )
}
