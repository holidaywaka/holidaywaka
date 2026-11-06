import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { geoLocationProps, SocialsProps, visacountryProps } from 'global'

export interface CounterState {
  profile: {
    id?: string
    image?: string
    email?: string
    firstName?: string
    lastName?: string
  },
  visaCountries: visacountryProps[],
  visaOptions: { label: string, value: string }[]
  perPage: number
  isTopSidebar: boolean
  isSidebar: boolean
  geoLocation: geoLocationProps
  pagination: {
    limit: number
    page: number
  },
  socials: SocialsProps[]
}

const initialState: CounterState = {
  profile: {},
  visaCountries: [],
  visaOptions: [],
  isTopSidebar: false,
  isSidebar: false,
  perPage: 20,
  geoLocation: {},
  pagination: {
    limit: 20,
    page: 1
  },
  socials: []
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    dispatchPagination: (state, action: PayloadAction<{limit: number, page: number}>) => {
      state.pagination = action.payload
    },
    dispatchProfile: (state, action: PayloadAction<CounterState['profile']>) => {
      state.profile = action.payload
    },
    dispatchVisaCountries: (state, action: PayloadAction<CounterState["visaCountries"]>) => {
      state.visaCountries = action.payload
    },
    dispatchVisaOptions: (state, action: PayloadAction<CounterState["visaOptions"]>) => {
      state.visaOptions = action.payload
    },
    dispatchPerPage: (state, action: PayloadAction<number>) => {
      state.perPage = action.payload
    },
    dispatchTopSidebar: (state, action: PayloadAction<boolean>) => {
      state.isTopSidebar = action.payload
    },
    dispatchSidebar: (state, action: PayloadAction<boolean>) => {
      state.isSidebar = action.payload
    },
    dispatchSocials: (state, action: PayloadAction<CounterState["socials"]>) => {
      state.socials = action.payload
    },
    dispatchGeoLocation: (state, action: PayloadAction<CounterState["geoLocation"]>) => {
      state.geoLocation = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const { dispatchProfile, dispatchSocials, dispatchPagination, dispatchVisaCountries, dispatchSidebar, dispatchGeoLocation, dispatchTopSidebar, dispatchVisaOptions, dispatchPerPage } = counterSlice.actions

export default counterSlice.reducer