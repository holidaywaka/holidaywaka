import { Box, LoadingOverlay } from '@mantine/core';
import React from 'react'
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { PAYMENT_METHODS } from '~/components/payment/enums';
import { BackToTop, SiteName } from '~/components/utils';
import type { fieldProps, formProps } from '~/routes/general/visa/types';
import ScreenOneComponent from '~/routes/general/visa/visa-first-screen'
import ScreenTwoComponent from '~/routes/general/visa/visa-second-screen';
import VisaThirdScreen from '~/routes/general/visa/visa-third-screen';
import { getAlert } from '~/services/get-alert';
import { createResponse, NewApis } from '~/services/new-apis';
import type { RootState } from '~/store/store';

export default function VisaProcess() {
    const navigate = useNavigate();
    const { geoLocation, socials } = useSelector((state: RootState) => state.data)
    const [screen, setScreen] = React.useState(1)
    const [fields, setFields] = React.useState<fieldProps>();
    const [loading, setLoading] = React.useState(false);
    const [forms, setForms] = React.useState<formProps>()

    function next(values: fieldProps) {
        setScreen(o => o + 1);
        setFields(values)
        BackToTop()
    }

    function back() {
        setScreen(o => o - 1)
        BackToTop()
    }

    async function submitData(values: formProps) {
        setForms(values);
        if (fields?.paymentType === "enquiry") {
            await finalSubmission("", values)
        } else {
            setScreen(o => o + 1)
        }
        BackToTop()
    }

    async function ThirdAction(value: string, voucherCode?: string) {
        await finalSubmission(value, forms, voucherCode)
        BackToTop()
    }

    async function finalSubmission(value: string, values: formProps | undefined, voucherCode?: string) {
        try {

            const formdata = {
                ...values,
                currency: geoLocation.abbreviation,
                voucher_code: voucherCode,
                visa: {
                    country: fields?.country,
                    paymentType: fields?.paymentType,
                    payment_method: value,
                    price: fields?.price,
                    requirement: fields?.requirement,
                    visaType: fields?.visaType,
                    fee: fields?.fee,
                    amount: fields?.paymentType === "appointment" ? fields.fee : fields?.price,
                },
                status: 'pending'
            }

            setLoading(true)
            const response = await createResponse({
                endpoint: NewApis.visa.create_enquiry,
                data: formdata,
                method: "POST"
            })

            if (response.isEnquiry) {
                const textMessage = `?text=${encodeURIComponent(`
                    Hello ${SiteName} Team!,
                    My name is ${values?.firstName} ${values?.lastName}
                    I'm interested in your ${fields?.country} ${fields?.visaType}

                     - My Email: ${values?.email}
                     - My Phone Number: ${values?.phone}
                     - Nationality: ${values?.nationality}
                     - Expected Travel Date: ${values?.travelDate}
                     - ${values?.hasPassport ? `My Passport No.: ${values?.passportNumber}` : 'I do not have a passport'}
                     ${Number(values?.message?.trim()?.length) > 0 ?`- Message: ${values?.message}` : ''}
                    `)}`
                const getUrl = socials.find(ele => ele.tag === "WHATSAPP")?.link

                const url = `${getUrl}${textMessage}`
                return window.location.href = String(url)
            }
            if (formdata.visa?.payment_method === PAYMENT_METHODS.direct_bank_transfer) {
                return navigate(`/upload-payment/${response.attachment}`);
            }

            if (formdata.visa?.payment_method === PAYMENT_METHODS.unified_payment_transfer) {
                return window.location.href = response.url
            }
        } catch (error) {
            setLoading(false)
            getAlert((error as Error).message, 'error')
        }
    }
    return (
        <div>
            <div className='px-4 md:px-10 py-10 max-w-3xl mx-auto'>
                <Box pos="relative">
                    <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                    {screen === 1 && <ScreenOneComponent
                        sendData={next}
                    />}
                    {screen === 2 && <ScreenTwoComponent
                        submitData={submitData}
                        fields={fields}
                        back={back}
                        isLoading={loading}
                    />}
                    {screen === 3 && <VisaThirdScreen
                        data={fields}
                        sendData={ThirdAction}
                    />}
                </Box>
            </div>
        </div>
    )
}
