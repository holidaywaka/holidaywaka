

import { Box, LoadingOverlay } from '@mantine/core'
import type { PackageEnquiryProps, tripInfoProps, TripProps } from 'global'
import React from 'react'
import { useNavigate } from 'react-router'
import { PAYMENT_METHODS } from '~/components/payment/enums'
import { BackToTop } from '~/components/utils'
import StageOne from '~/routes/general/packages/form/stage-1'
import StageTwo from '~/routes/general/packages/form/stage-2'
import StageThree from '~/routes/general/packages/form/stage-3'
import { getAlert } from '~/services/get-alert'
import { createResponse, NewApis } from '~/services/new-apis'


type componentProps = {
    singleData: TripProps | undefined
}


export default function PackageReservationForm(props: componentProps) {
    const [screen, setScreen] = React.useState(1)
    const [fields, setFields] = React.useState<tripInfoProps>();
    const [loading, setLoading] = React.useState(false)
    const navigate = useNavigate();

    function firstAction(values: PackageEnquiryProps) {
        const details = {
            package: props.singleData,
            form: values,
            totalPayment: 0,
        }
        setFields(details);
        setScreen(2)
        BackToTop()
    }

    function back() {
        setScreen(o => o - 1);
        BackToTop()
    }

    function secondAction(values: tripInfoProps) {
        setFields(values);
        setScreen(o => o + 1);
        BackToTop()
    }


    async function thirdAction(value: string, voucherCode?: string) {
        // Prices are resolved on the server from each traveller's price type
        const formFields = {
            ...fields?.form,
            symbol: fields?.package?.symbol,
            currency: fields?.package?.currency,
            travelers: fields?.form.travelers,
            tripType: fields?.package?.tripType,
            tripId: fields?.package?.id,
            payment_method: value,
            voucher_code: voucherCode,
        }

        try {
            setLoading(true)
            const response = await createResponse({
                endpoint: NewApis.trips.enquiry,
                data: formFields,
                method: "POST"
            })
            console.log(response);
            if (formFields.payment_method === PAYMENT_METHODS.direct_bank_transfer) {
                return navigate(`/upload-payment/${response.attachment}`);
            }

            if (formFields.payment_method === PAYMENT_METHODS.unified_payment_transfer) {
                return window.location.href = response.url
            }
        } catch (error) {
            setLoading(false)
            getAlert(`${(error as Error).message}`, 'error')
        }
    }


    if (screen === 1) return <StageOne
        singleData={props.singleData}
        fields={fields?.form}
        sendData={firstAction}
    />

    if (screen === 2) return <StageTwo
        singleData={props.singleData}
        back={back}
        fields={fields}
        sendData={secondAction}
    />

    if (screen === 3) return (
        <Box pos="relative">
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <StageThree
                fields={fields}
                sendData={thirdAction}
            />
        </Box>
    )

}
