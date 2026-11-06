import { Loader } from '@mantine/core'
import { useForm } from '@mantine/form'
import type { bankProps, TransactionProps } from 'global'
import React from 'react'
import { FaCopy } from 'react-icons/fa6'
import { useNavigate, useSearchParams } from 'react-router'
import SingleFileUpload from '~/components/admin/SingleFileUpload'
import Formbutton from '~/components/general/Formbutton'
import { useIsNavigating } from '~/components/general/NavigationProgress'
import { ClientNaira, CopyToClipboard, SiteName } from '~/components/utils'
import useFetchResponse from '~/services/fetchResponse'
import { getAlert } from '~/services/get-alert'
import { createResponse, NewApis } from '~/services/new-apis'
import { privatePage } from '~/services/seo'


export function meta() {
    return privatePage("Upload Payment Proof")
}

export default function UploadPayment() {
    const isNavigating = useIsNavigating()
    const [searchParams,] = useSearchParams()
    const navigate = useNavigate()
    const form = useForm({
        mode: "uncontrolled",
        initialValues: {
            image: {
                file: null,
                img: null
            }
        },
        validate: {
            image: value => !value ? 'Kindly upload proof of payment slip' : null
        }
    })

    async function HandleSubmission(values: typeof form.values) {
        try {
            const field = new FormData()
            field.append("transaction_id", String(searchParams.get("transaction_id")))
            field.append("transaction_type", String(searchParams.get("transaction_type")))
            if (values.image?.file) field.append("image", values.image.file)

            const response = await createResponse({
                endpoint: NewApis.transactions.upload_proof,
                method: "POST",
                type: "FILE",
                data: field
            })
            getAlert(response.message, 'success')
            navigate(`/upload-submission`)
        } catch (error) {
            getAlert((error as Error).message, 'error')
        }
    }

    const { data, isLoading, isError, error } = useFetchResponse<{ transaction: TransactionProps, account: bankProps }>({
        endpoint: `${NewApis.transactions.transaction}/${searchParams.get("transaction_id")}/${searchParams.get("transaction_type")}`
    })

    if (isError) return (
        <div className='min-h-screen py-10'>
            <div className="mx-auto bg-white px-5 py-10 rounded-xl max-w-3xl">
                <div className=""> <img src="/images/err.svg" alt="" className="h-80 w-full" /> </div>
                <div className="text-center font-bold text-xl">{error}</div>
            </div>
        </div>
    )

    if (isLoading) return (
        <div className='min-h-screen py-10'>
            <div className="mx-auto bg-white px-5 py-10 rounded-xl max-w-3xl flex flex-col items-center justify-center text-center gap-6">
                <Loader />
                <div className="text-center font-bold animate-pulse">Loading payment info, kindly hold on....</div>
            </div>
        </div>
    )
    return (
        <div className='min-h-screen py-10'>
            <div className="mx-auto bg-white p-5 rounded-xl max-w-3xl">
                <div>
                    <form onSubmit={form.onSubmit(HandleSubmission)} className="text-sm">
                        <div className="text-primary font-bold text-3xl text-center">{ClientNaira}{Number(data?.transaction?.charge?.amount)?.toLocaleString()}</div>
                        <div className="">Kindly make a transfer of the sum of <span className="text-blue-700 font-bold">{ClientNaira}{Number(data?.transaction?.charge?.amount)?.toLocaleString()}</span> into the designated official account </div>
                        <div className="my-5 bg-slate-100 p-3 rounded-md">
                            <div className="border-b border-slate-300 py-2">
                                <div className="">Account Name</div>
                                <div className="font-bold text-lg">{data?.account?.accountName}</div>
                            </div>
                            <div className="border-b border-slate-300 py-2">
                                <div className="">Account Number</div>
                                <div className="font-bold text-lg flex items-center gap-3 cursor-pointer w-fit" onClick={() => CopyToClipboard(data?.account?.accountNumber || '')}>{data?.account?.accountNumber} <FaCopy /> </div>
                            </div>
                            <div className="border-b border-slate-300 py-2">
                                <div className="">Bank Name</div>
                                <div className="font-bold text-lg">{data?.account?.bankName}</div>
                            </div>
                        </div>
                        <div className="text-xs mb-5 bg-amber-100/50 p-3 rounded-md border border-amber-300!"> <span className="font-bold">Disclaimer:</span> Kindly note as {SiteName} will not be held accountable for any payment made to the wrong account other than the account provided above </div>
                        <SingleFileUpload
                            image={form.values.image}
                            setImage={(val: any) => form.setFieldValue("image", val)}
                            removeImage={() => form.setFieldValue("image", { file: null, img: null })}
                            error={form.errors.image?.toString() || ''}
                            title="Upload Payment Screenshot"
                        />
                        <div className="mt-6">
                            <Formbutton title="Upload Payment Slip" loading={form.submitting || isNavigating} />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}


