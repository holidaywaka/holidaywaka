
import { FiCalendar } from "react-icons/fi";

import { PasswordInput, PinInput, Select, TagsInput, Textarea, TextInput } from '@mantine/core'
import type { ForminputProps } from 'global'
import React, { forwardRef } from 'react'
import CurrencyOptions from './CurrencyOptions'
import PhoneSelector from './PhoneSelector'
import { dateFormat, monthFormat } from '../utils'
import { DatePickerInput, DateTimePicker, MonthPickerInput } from '@mantine/dates';
import { ArrowDown, ArrowDown2 } from 'iconsax-reactjs'



const NewForminput = forwardRef<HTMLInputElement | HTMLTextAreaElement | null, ForminputProps>(
    ({ picker = "date", options, placeholder, tagNames, currencyValue, dateTag = "From", formtype = "input", content, setup, type = "text", valueText, valueName, setFieldValue, minDate, maxDate, defaultDate, readOnly = false, searchable = false, children, error, inputStyles, ...props }, ref) => {

        const [displayValue, setDisplayValue] = React.useState(
            valueText ? valueText.toLocaleString() : ""
        );

        const [displayValue2, setDisplayValue2] = React.useState(
            valueText ? valueText : ""
        );

        const formStyle = {
            input: {
                padding: "1.5rem 1rem",
                borderRadius: '0.6rem',
                background: readOnly ? "#F2F2F2" : "",
                ...inputStyles
            }
        }

        // 👇 keep displayValue in sync when valueText changes externally
        React.useEffect(() => {
            const stringValue = valueText === null || valueText === undefined ? "" : String(valueText);
            const numericValue = Number(stringValue);
            const isEmptyOrInvalid = stringValue.trim() === "" || Number.isNaN(numericValue);

            setDisplayValue(isEmptyOrInvalid ? "" : numericValue.toLocaleString());
            setDisplayValue2(isEmptyOrInvalid ? "" : stringValue);
        }, [valueText]);


        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value.replace(/,/g, ""); // remove commas
            if (!/^\d*$/.test(raw)) return; // only digits allowed

            const num = raw ? Number(raw) : null;
            setDisplayValue(raw ? Number(raw).toLocaleString() : "");

            // keep real number in form state
            setFieldValue(valueName, raw ? num : "");
        };

        const handleCardNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            let value = event.target.value.replace(/\D/g, ''); // Remove all non-digit characters
            value = value.substring(0, 16); // Limit to 16 digits
            const formattedValue = value.match(/.{1,4}/g)?.join('-') || value; // Insert hyphens every 4 digits

            setDisplayValue(value ? formattedValue : "");
            setFieldValue(valueName, formattedValue)
        };
        const handleCvv = (event: React.ChangeEvent<HTMLInputElement>) => {
            let value = event.target.value.replace(/\D/g, ''); // Remove all non-digit characters
            value = value.substring(0, 3); // Limit to 3 digits

            setDisplayValue(value ? value : "");
            setFieldValue(valueName, value)
        };
        const handleExp = (event: React.ChangeEvent<HTMLInputElement>) => {
            let value = event.target.value.replace(/\D/g, ''); // Remove all non-digit characters
            value = value.substring(0, 4); // Limit to 4 digits
            const formattedVal = value.match(/.{1,2}/g)?.join(`/`) || value

            setDisplayValue(value ? formattedVal : "");
            setFieldValue(valueName, formattedVal)
        };


        return (
            <div className='mb-4'>
                {formtype === "url" && <div className="relative!">
                    <div className="absolute top-9 text-sm left-1 border-r-2 border-gray-400/60 z-10 py-1 pl-1 pr-2">https://</div>
                    <TextInput
                        {...props}
                        ref={ref as React.Ref<HTMLInputElement>}
                        label={content}
                        readOnly={readOnly}
                        placeholder={placeholder}
                        error={error}
                        styles={{
                            input: {
                                padding: "1.5rem 1rem 1.5rem 4rem",
                                borderRadius: '0.6rem',
                                background: readOnly ? "#F2F2F2" : ""
                            }
                        }}
                    />
                </div>}
                {formtype === "number" && <div className="">
                    <TextInput
                        {...props}
                        ref={ref as React.Ref<HTMLInputElement>}
                        value={displayValue}
                        onChange={handleChange}
                        readOnly={readOnly}
                        label={content}
                        placeholder={placeholder}
                        error={error}
                        styles={formStyle}
                    />
                </div>}
                {formtype === "cvv" && <div className="">
                    <TextInput
                        {...props}
                        ref={ref as React.Ref<HTMLInputElement>}
                        value={displayValue2}
                        onChange={handleCvv}
                        readOnly={readOnly}
                        label={content}
                        placeholder={placeholder}
                        error={error}
                        styles={formStyle}
                    />
                </div>}
                {formtype === "card" && <div className="">
                    <TextInput
                        {...props}
                        ref={ref as React.Ref<HTMLInputElement>}
                        value={displayValue2}
                        onChange={handleCardNumberChange}
                        readOnly={readOnly}
                        label={content}
                        placeholder={placeholder}
                        error={error}
                        styles={formStyle}
                    />
                </div>}
                {formtype === "exp" && <div className="">
                    <TextInput
                        {...props}
                        ref={ref as React.Ref<HTMLInputElement>}
                        value={displayValue2}
                        onChange={handleExp}
                        readOnly={readOnly}
                        label={content}
                        placeholder={placeholder}
                        error={error}
                        styles={formStyle}
                    />
                </div>}
                {formtype === "input" && <div className="">
                    <TextInput
                        {...props}
                        ref={ref as React.Ref<HTMLInputElement>}
                        type={type}
                        readOnly={readOnly}
                        label={content}
                        placeholder={placeholder}
                        error={error}
                        styles={formStyle}
                    />
                </div>}
                {formtype === "tags" && <div className="">
                    <TagsInput
                        value={tagNames}
                        onChange={setFieldValue}
                        label={content}
                        readOnly={readOnly}
                        // {...props}
                        ref={ref as React.Ref<HTMLInputElement>}
                        placeholder="Press Enter to add tag"
                        error={error}
                        data={options}
                        styles={formStyle}
                    />
                </div>}
                {formtype === "select" && <div className="">
                    <Select
                        label={content}
                        readOnly={readOnly}
                        {...props}
                        ref={ref as React.Ref<HTMLInputElement>}
                        placeholder="-- Select --"
                        error={error}
                        maxDropdownHeight={200}
                        data={options}
                        searchable={searchable}
                        styles={formStyle}
                    />
                </div>}
                {formtype === "textarea" && <div className="">
                    <Textarea
                        label={content}
                        {...props}
                        readOnly={readOnly}
                        error={error}
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        placeholder={placeholder}
                        styles={formStyle}
                    />
                </div>}
                {formtype === "password" && <div className="">
                    <PasswordInput
                        label={content}
                        {...props}
                        readOnly={readOnly}
                        error={error}
                        ref={ref as React.Ref<HTMLInputElement>}
                        placeholder={placeholder}
                        styles={formStyle}
                    />
                </div>}
                {formtype === 'otp' && <>
                    <div className="text-sm font-medium">{content}</div>
                    <div>
                        <PinInput
                            {...props}
                            size="xl"
                            length={6}
                            error={error ? true : false}
                            ref={ref as React.Ref<HTMLInputElement>}
                        />
                    </div>
                    {error && <div className='text-red-700 absolute -bottom-[1.2rem] left-0 text-sm mb-1'>{error}</div>}
                </>}
                {formtype === 'currency' && <>
                    <div className="text-sm font-medium">{content}</div>
                    <div className={`-w-full border bg-white rounded-md ${error ? 'border-red-700!' : 'border-slate-400!'} flex items-center gap-1`}>
                        <div className='w-1/5'>
                            <CurrencyOptions
                                defaultValue={currencyValue ?? "USD"}
                                setup={setup}
                            />
                        </div>
                        <div className="w-full">
                            <input type="number" {...props} ref={ref as React.Ref<HTMLInputElement>} className='w-full outline-none p-3' />
                        </div>
                    </div>
                    {error && <div className='text-red-700 absolute -bottom-[1.2rem] left-0 text-sm mb-1'>{error}</div>}
                </>}
                {formtype === 'phone' && <div className="relative!">
                    <div className="text-sm font-medium">{content}</div>
                    <div className={`relative w-full border bg-white h-12 mt-1.5 rounded-lg ${error ? 'border-red-700!' : 'border-slate-300!'} flex items-center gap-1`}>
                        <div className='w-1/5'>
                            <div className="absolute top-3.5 left-9 z-10"> <ArrowDown2 size="18" /> </div>
                            <PhoneSelector
                                setup={setup ?? (() => { })}
                                defaultValue='+234'
                            />
                        </div>
                        <div className="w-full">
                            <TextInput
                                {...props}
                                ref={ref as React.Ref<HTMLInputElement>}
                                type={"number"}
                                readOnly={readOnly}
                                placeholder={placeholder}
                                // error={error}
                                styles={{
                                    input: {
                                        border: 0,
                                        background: readOnly ? "#F2F2F2" : ""
                                    }
                                }}
                            />
                        </div>
                    </div>
                    {error && <div className='text-red-400 absolute -bottom-[1.3rem] left-0 text-xs mb-1'>{error}</div>}
                </div>}
                {formtype === 'date' &&
                    <div className='relative'>
                        <div className="text-sm font-medium mt-1">{content}</div>
                        <div className="relative mt-1.5">
                            {picker === "date" && <DatePickerInput
                                {...props}
                                value={valueText ?? null}
                                minDate={minDate}
                                maxDate={maxDate}
                                defaultDate={defaultDate}
                                styles={{
                                    input: {
                                        paddingLeft: !dateTag ? "" : dateTag === "To" ? "1.5rem" : "2.5rem",
                                        borderRadius: '0.6rem',
                                        fontSize: '0.8rem',
                                        width: '100%', border: error ? "1px solid oklch(50.5% 0.213 27.518)" : "1px solid lightgray", height: "2.8rem",
                                        background: readOnly ? "#F2F2F2" : ""
                                    }
                                }}
                                allowDeselect
                            />}
                            {picker === "month" && <MonthPickerInput
                                {...props}
                                value={valueText ?? null}
                                minDate={minDate}
                                maxDate={maxDate}
                                defaultDate={defaultDate}
                                styles={{
                                    input: {
                                        paddingLeft: !dateTag ? "" : dateTag === "To" ? "1.5rem" : "2.5rem",
                                        borderRadius: '0.6rem',
                                        fontSize: '0.8rem',
                                        width: '100%', border: error ? "1px solid oklch(50.5% 0.213 27.518)" : "1px solid lightgray", height: "2.8rem",
                                        background: readOnly ? "#F2F2F2" : ""
                                    }
                                }}
                                allowDeselect
                            />}
                            <div className="absolute top-3.5 left-1.5 text-gray-400 text-xs"> {dateTag} </div>
                            <div className="absolute top-3 right-1 text-gray-400"><FiCalendar size="18" /> </div>
                        </div>
                        {error && <div className='text-red-400 absolute -bottom-[1.2rem] left-0 text-sm mb-1'>{error}</div>}
                    </div>}
                {formtype === 'datetime' &&
                    <div className='relative'>
                        <div className="text-sm font-medium mt-1">{content}</div>
                        <div className="relative mt-1.5">
                            {picker === "date" && <DateTimePicker
                                {...props}
                                value={valueText ?? null}
                                minDate={minDate}
                                maxDate={maxDate}
                                defaultDate={defaultDate}
                                timePickerProps={{
                                    withDropdown: true,
                                    popoverProps: { withinPortal: false },
                                    format: '24h',
                                }}
                                styles={{
                                    input: {
                                        paddingLeft: !dateTag ? "" : dateTag === "To" ? "1.5rem" : "2.5rem",
                                        borderRadius: '0.6rem',
                                        fontSize: '0.8rem',
                                        width: '100%', border: error ? "1px solid oklch(50.5% 0.213 27.518)" : "1px solid lightgray", height: "2.8rem",
                                        background: readOnly ? "#F2F2F2" : ""
                                    }
                                }}
                            />}
                            {picker === "month" && <MonthPickerInput
                                {...props}
                                value={valueText ?? null}
                                minDate={minDate}
                                maxDate={maxDate}
                                defaultDate={defaultDate}
                                styles={{
                                    input: {
                                        paddingLeft: !dateTag ? "" : dateTag === "To" ? "1.5rem" : "2.5rem",
                                        borderRadius: '0.6rem',
                                        fontSize: '0.8rem',
                                        width: '100%', border: error ? "1px solid oklch(50.5% 0.213 27.518)" : "1px solid lightgray", height: "2.8rem",
                                        background: readOnly ? "#F2F2F2" : ""
                                    }
                                }}
                                allowDeselect
                            />}
                            <div className="absolute top-3.5 left-1.5 text-gray-400 text-xs"> {dateTag} </div>
                            <div className="absolute top-3 right-1 text-gray-400"><FiCalendar size="18" /> </div>
                        </div>
                        {error && <div className='text-red-400 absolute -bottom-[1.2rem] left-0 text-sm mb-1'>{error}</div>}
                    </div>}
            </div>
        )
    })

export default NewForminput