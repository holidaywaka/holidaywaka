
import { useForm } from '@mantine/form'
import dayjs from 'dayjs'
import parse from "html-react-parser"
import React from 'react'
import { useNavigate } from 'react-router'
import Editor from '~/components/admin/Editor'
import FileUploader, { type imageProps } from '~/components/admin/FileUploader'
import Formbutton from '~/components/general/Formbutton'
import NewForminput from '~/components/general/NewForminput'
import { TripTypeOptions } from '~/components/utils'
import type { TripFormProps } from '~/routes/admin/packages/types'
import { getAlert } from '~/services/get-alert'
import { createResponse, NewApis } from '~/services/new-apis'

/** Mirrors the server rule: N working days (Mon-Fri) from tomorrow, then travel the next day */
function earliestTravel(days: number) {
  let date = dayjs().startOf('day')
  let added = 0
  while (added < days) {
    date = date.add(1, 'day')
    if (date.day() !== 0 && date.day() !== 6) added++
  }
  return date.add(1, 'day').format('ddd, D MMM YYYY')
}

/** List rows are keyed by id; length + 1 repeats an existing id once a middle row is removed */
function nextId(items: { id?: number }[]) {
  return Math.max(0, ...items.map(item => Number(item.id) || 0)) + 1
}

type props = {
  data: TripFormProps | null | undefined
  images: imageProps[]
}

export default function TripForm(props: props) {
  const navigate = useNavigate()
  const [screen, setScreen] = React.useState(1)
  // Controlled: the list sections, date pickers and image grid all render from form.values
  const form = useForm({
    initialValues: {
      title: props.data?.title ?? '',
      summary: props.data?.summary ?? '',
      tripType: props.data?.tripType ?? '',
      description: props.data?.description ?? '',
      startDate: props.data?.startDate ?? null,
      endDate: props.data?.endDate ?? null,
      inclusions: props.data?.inclusions ?? [
        { id: 1, content: '' }
      ],
      itineraries: props.data?.itineraries ?? [
        { id: 1, content: '' }
      ],
      destinations: props.data?.destinations ?? [
        { id: 1, country: '', city: '' }
      ],
      prices: props.data?.prices ?? [
        { id: 1, price: '', priceType: '' }
      ],
      images: props.data?.images ?? [],
      visaRequired: Boolean(props.data?.visaRequired),
      visaProcessingDays: props.data?.visaProcessingDays ?? 0,
    },
    validate: {
      visaProcessingDays: (value, values) => (screen === 1 && values.visaRequired && !(Number(value) > 0)) ? 'Enter how many working days the visa takes' : null,
      title: value => (screen === 1 && !value) ? 'Title is required' : null,
      startDate: value => (screen === 1 && !value) ? 'Start date is required' : null,
      endDate: (value, values) => {
        if (screen !== 1) return null
        if (!value) return 'End date is required'
        return values.startDate && dayjs(value).isBefore(dayjs(values.startDate), 'day') ? 'End date cannot be before the start date' : null
      },
      tripType: value => (screen === 1 && !value) ? 'Trip type is required' : null,
      description: value => (screen === 1 && !value) ? 'Description is required' : null,
      summary: value => (screen === 1 && !value) ? 'Summary is required' : null,
      inclusions: {
        content: value => (screen === 3 && !value) ? `Inclusion is required` : null,
      },
      itineraries: {
        content: value => (screen === 4 && !value) ? `Itinerary is required` : null,
      },
      destinations: {
        country: value => (screen === 5 && !value) ? `Country is required` : null,
        city: value => (screen === 5 && !value) ? `City is required` : null,
      },
      prices: {
        price: value => (screen === 2 && !value) ? `Pricing is required` : null,
        priceType: value => (screen === 2 && !value) ? `Pricing type is required` : null,
      },
      images: value => (screen === 6 && value.length < 1) ? 'Image is required' : null
    }
  })
  async function removeImage(value: string) {
    try {
      const response = await createResponse({
        endpoint: `${NewApis.trips.delete_media}/${props.data?.id}`,
        method: "POST",
        data: { url: value }
      });
      getAlert(response.message, 'success')
    } catch (error) {
      getAlert((error as Error).message, 'error')
    }
  }
  async function removeAllImages(values: string[]) {
    await Promise.all(values.map(removeImage))
  }
  function handleBack() {
    return setScreen(o => o - 1)
  }
  async function handleSubmission(values: typeof form.values) {
    try {
      if (screen < 7) return setScreen(o => o + 1)

      const data = {
        "destinations": values.destinations.map(ele => { return { country: ele.country, city: ele.city } }),
        "prices": values.prices.map(ele => { return { price: ele.price, priceType: ele.priceType } }),
        "itineraries": values.itineraries.map(ele => { return ele.content }),
        "inclusions": values.inclusions.map(ele => { return ele.content }),
        title: values.title,
        summary: values.summary,
        tripType: values.tripType,
        description: values.description,
        startDate: values.startDate,
        endDate: values.endDate,
        visaRequired: values.visaRequired,
        visaProcessingDays: values.visaRequired ? Number(values.visaProcessingDays) : 0,
      }

      const formdata = new FormData()
      formdata.append("data", JSON.stringify(data))
      form.values.images.forEach((file) => (file.file) && formdata.append("images", file.file))

      const isEdit = props.data?.id
      const response = await createResponse({
        endpoint: isEdit ? `${NewApis.trips.update}/${props.data?.id}` : NewApis.trips.create,
        data: formdata,
        method: isEdit ? "PUT" : "POST",
        type: "FILE"
      })
      getAlert(response.message, 'success')
      navigate("/admin-portal/packages/all-packages")
    } catch (error) {
      getAlert((error as Error).message, 'error')
    }
  }

  return (
    <div className='px-2 md:px-4 w-full max-w-3xl mx-auto'>
      <form onSubmit={form.onSubmit(handleSubmission)}>
        <div className='bg-white p-2 md:p-6'>
          <div className={screen === 1 ? '' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <NewForminput
                content="Title"
                error={form.errors.title?.toString() || ''}
                {...form.getInputProps("title")}
                key={form.key("title")}
              />
              <NewForminput
                content="Summary"
                error={form.errors.summary?.toString() || ''}
                {...form.getInputProps("summary")}
                key={form.key("summary")}
              />
              <NewForminput
                content="Trip Type"
                error={form.errors.tripType?.toString() || ''}
                {...form.getInputProps("tripType")}
                key={form.key("tripType")}
                formtype='select'
                options={Object.values(TripTypeOptions)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <NewForminput
                content="Start Date"
                formtype="date"
                minDate={dayjs().format("YYYY-MM-DD")}
                valueName="startDate"
                error={form.errors.startDate?.toString() || ''}
                valueText={form.values.startDate}
                onChange={(e: any) => form.setFieldValue("startDate", e)}
                setFieldValue={form.setFieldValue}
                dateTag='From'
              />
              <NewForminput
                content="End Date"
                formtype="date"
                minDate={form.values.startDate ?? dayjs().format("YYYY-MM-DD")}
                valueName="endDate"
                error={form.errors.endDate?.toString() || ''}
                valueText={form.values.endDate}
                onChange={(e: any) => form.setFieldValue("endDate", e)}
                setFieldValue={form.setFieldValue}
                dateTag='To'
              />
            </div>
            <div className="rounded-lg border border-slate-200 p-3 mb-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={form.values.visaRequired}
                  onChange={(event) => form.setFieldValue("visaRequired", event.target.checked)}
                />
                Travellers need a visa for this package
              </label>
              {form.values.visaRequired && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  <label className="block text-sm">
                    <span className="block mb-1 font-medium">Visa processing time (working days)</span>
                    <input
                      type="number"
                      min={1}
                      className={`w-full h-11 px-3 rounded-md border ${form.errors.visaProcessingDays ? 'border-red-400' : 'border-slate-300'} outline-none`}
                      value={Number(form.values.visaProcessingDays) || ''}
                      onChange={(event) => form.setFieldValue("visaProcessingDays", Number(event.target.value))}
                    />
                    {form.errors.visaProcessingDays && <span className="block text-xs text-red-600 mt-1">{form.errors.visaProcessingDays}</span>}
                  </label>
                  <div className="text-xs text-zinc-500 bg-slate-50 rounded-md p-2">
                    Customers can only travel the day after the visa is ready. Weekends are skipped: with {Number(form.values.visaProcessingDays) || 'N'} working days, someone booking today can travel from{' '}
                    <span className="font-semibold">{Number(form.values.visaProcessingDays) > 0 ? earliestTravel(Number(form.values.visaProcessingDays)) : '…'}</span>.
                  </div>
                </div>
              )}
            </div>
            <Editor
              title="Description"
              form={form.values.description}
              onChange={(value) => form.setFieldValue("description", value)}
              error={form.errors.description?.toString() || ''}
            />
            {/* <NewForminput
              content="Description"
              formtype='textarea'
              error={form.errors.description?.toString() || ''}
              {...form.getInputProps("description")}
              key={form.key("description")}
            /> */}
          </div>
          <div className="space-y-3">
            <fieldset className={`border border-gray-300 rounded-md ${screen === 2 ? '' : 'hidden'}`}>
              <legend className='ml-3'>Prices</legend>
              <div className="p-3">
                {form.values.prices.map((ele, idx) => {
                  const pricePath = `prices.${idx}.price`;
                  const pricetypePath = `prices.${idx}.priceType`;

                  return (
                    <div key={ele.id}>
                      {idx > 0 && (
                        <div
                          onClick={() => form.removeListItem("prices", idx)}
                          className="size-fit ml-auto bg-red-100/60 text-red-500 py-2 px-3 rounded-md cursor-pointer transition-all active:scale-95 text-xs"
                        >
                          Remove
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <NewForminput
                          content={`Price`}
                          type="number"
                          error={form.errors[pricePath]?.toString() || ''}
                          {...form.getInputProps(pricePath)}
                        />
                        <NewForminput
                          content={`Price Type`}
                          error={form.errors[pricetypePath]?.toString() || ''}
                          {...form.getInputProps(pricetypePath)}
                        />
                      </div>
                    </div>
                  );
                })}
                <div
                  onClick={() => form.insertListItem("prices", { id: nextId(form.values.prices), price: '', priceType: '' })}
                  className="size-fit ml-auto bg-slate-200 py-2 px-3 rounded-md cursor-pointer transition-all active:scale-95 text-xs"
                >
                  Add More
                </div>
              </div>
            </fieldset>
            <fieldset className={`border border-gray-300 rounded-md ${screen === 3 ? '' : 'hidden'}`}>
              <legend className='ml-3'>Inclusions</legend>
              <div className="p-3">
                {form.values.inclusions.map((ele, idx) => {
                  const fieldPath = `inclusions.${idx}.content`;
                  return (
                    <div key={ele.id}>
                      {idx > 0 && (
                        <div
                          onClick={() => form.removeListItem("inclusions", idx)}
                          className="size-fit ml-auto bg-red-100/60 text-red-500 py-2 px-3 rounded-md cursor-pointer transition-all active:scale-95 text-xs"
                        >
                          Remove
                        </div>
                      )}
                      <NewForminput
                        content={`No. ${idx + 1}`}
                        formtype='textarea'
                        error={form.errors[fieldPath]?.toString() || ''}
                        {...form.getInputProps(fieldPath)}
                      />
                    </div>
                  );
                })}
                <div
                  onClick={() => form.insertListItem("inclusions", { id: nextId(form.values.inclusions), content: '' })}
                  className="size-fit ml-auto bg-slate-200 py-2 px-3 rounded-md cursor-pointer transition-all active:scale-95 text-xs"
                >
                  Add More
                </div>
              </div>
            </fieldset>
            <fieldset className={`border border-gray-300 rounded-md ${screen === 4 ? '' : 'hidden'}`}>
              <legend className='ml-3'>Itineraries</legend>
              <div className="p-3">
                {form.values.itineraries.map((ele, idx) => {
                  const fieldPath = `itineraries.${idx}.content`;

                  return (
                    <div key={ele.id}>
                      {idx > 0 && (
                        <div
                          onClick={() => form.removeListItem("itineraries", idx)}
                          className="size-fit ml-auto bg-red-100/60 text-red-500 py-2 px-3 rounded-md cursor-pointer transition-all active:scale-95 text-xs"
                        >
                          Remove
                        </div>
                      )}
                      <NewForminput
                        content={`Day. ${idx + 1}`}
                        formtype='textarea'
                        error={form.errors[fieldPath]?.toString() || ''}
                        {...form.getInputProps(fieldPath)}
                      />
                    </div>
                  );
                })}
                <div
                  onClick={() => form.insertListItem("itineraries", { id: nextId(form.values.itineraries), content: '' })}
                  className="size-fit ml-auto bg-slate-200 py-2 px-3 rounded-md cursor-pointer transition-all active:scale-95 text-xs"
                >
                  Add More
                </div>
              </div>
            </fieldset>
            <fieldset className={`border border-gray-300 rounded-md ${screen === 5 ? '' : 'hidden'}`}>
              <legend className='ml-3'>Destinations</legend>
              <div className="p-3">
                {form.values.destinations.map((ele, idx) => {
                  const countryPath = `destinations.${idx}.country`;
                  const cityPath = `destinations.${idx}.city`;

                  return (
                    <div key={ele.id}>
                      {idx > 0 && (
                        <div
                          onClick={() => form.removeListItem("destinations", idx)}
                          className="size-fit ml-auto bg-red-100/60 text-red-500 py-2 px-3 rounded-md cursor-pointer transition-all active:scale-95 text-xs"
                        >
                          Remove
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <NewForminput
                          content={`Country`}
                          error={form.errors[countryPath]?.toString() || ''}
                          {...form.getInputProps(countryPath)}
                        />
                        <NewForminput
                          content={`City`}
                          error={form.errors[cityPath]?.toString() || ''}
                          {...form.getInputProps(cityPath)}
                        />
                      </div>
                    </div>
                  );
                })}
                <div
                  onClick={() => form.insertListItem("destinations", { id: nextId(form.values.destinations), country: '', city: '' })}
                  className="size-fit ml-auto bg-slate-200 py-2 px-3 rounded-md cursor-pointer transition-all active:scale-95 text-xs"
                >
                  Add More
                </div>
              </div>
            </fieldset>

            <div className={screen === 6 ? '' : 'hidden'}>
              <FileUploader
                images={form.values.images}
                setImages={(val) => form.setFieldValue("images", val)}
                error={form.errors['images']?.toString() || ''}
                title={"Images"}
                removeImage={removeImage}
                removeAllImages={removeAllImages}
              />
            </div>
            <div className={screen === 7 ? '' : 'hidden'}>
              <div className="">
                {new Array(Object.keys(form.values).map((item, index) => {
                  const getValue = Object.values(form.values)[index]
                  const isArray = Array.isArray(getValue)
                  const value = getValue
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-2 py-2 border-b border-gray-300 last:border-0" key={index}>
                      <div className="capitalize md:col-span-2 text-gray-500">{item}</div>
                      {!isArray ? <div className="md:col-span-5 md:text-right wrap-break-word">{parse(String(value))}</div> : <>
                        <div className="md:col-span-5 wrap-break-word">
                          {Number((value as unknown[])?.length) > 0 && getValue?.map((ele, idx) => {
                            const keys = Object.keys(ele)
                            const Values = Object.values(ele)
                            return (
                              <div className="grid grid-cols-2 gap-2 py-1.5" key={idx}>
                                <div className="">
                                  {keys.map((eleKey, eleIdx) => {
                                    if (eleKey !== "id" && !['file', 'img'].includes(eleKey?.toLowerCase())) return (
                                      <div className="capitalize" key={eleIdx}>{eleKey}</div>
                                    )
                                  })}
                                </div>
                                <div className="">
                                  {Values?.map((eleKey, eleIdx) => {
                                    const display = (eleKey?.toString()?.toLowerCase()?.startsWith("blob") || eleKey?.toString()?.toLowerCase()?.startsWith("https://")) ? <div className="size-fit ml-auto"> <img src={String(eleKey)} className='size-20 object-cover' /> </div> : String(eleKey)

                                    if (eleIdx > 0 && typeof eleKey !== "object") return (
                                      <div className="capitalize text-right" key={eleIdx}>{display}</div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>}
                    </div>
                  )
                }))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 w-full max-w-xl mx-auto mt-5 mb-10">
          {screen > 1 ? <Formbutton type="button" title={'Back'} onClick={handleBack} bg='bg-slate-300' /> : <div></div>}
          <Formbutton loading={form.submitting} title={screen < 7 ? 'Continue' : 'Submit'} />
        </div>
      </form>
    </div>
  )
}
