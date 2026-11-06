import type { BusinessLineKey } from './dashboard-theme';

export type DashboardRange = '7d' | '30d' | '90d' | '12m';

export type DashboardKpi = {
    value: number;
    previous: number;
    /** % change vs the previous equal period; null when there is nothing to compare against */
    change: number | null;
}

export type BusinessLineMetrics = {
    key: BusinessLineKey;
    label: string;
    revenue: DashboardKpi;
    /** Markup share of what customers paid, VAT excluded */
    margin: DashboardKpi;
    margin_rate: number;
    /** Some paid transactions predate markup recording; their margin uses the current markup */
    margin_estimated: boolean;
    vat: number;
    paid_bookings: DashboardKpi;
    average_booking_value: number;
    awaiting: { value: number; count: number };
    conversion_rate: number;
    requests: number;
    revenue_share: number;
    margin_share: number;
    current_markup: { value: number; vat: number };
}

export type DashboardResponse = {
    range: { key: DashboardRange; label: string; start: string; end: string; bucket: 'day' | 'week' | 'month' };
    currency: 'NGN';
    kpis: {
        revenue: DashboardKpi;
        gross_margin: DashboardKpi & { rate: number; estimated: boolean };
        paid_bookings: DashboardKpi;
        average_booking_value: DashboardKpi;
        conversion_rate: DashboardKpi;
        awaiting_payment: DashboardKpi & { count: number };
        new_enquiries: DashboardKpi;
        new_subscribers: DashboardKpi;
        new_contacts: DashboardKpi;
    };
    business_lines: BusinessLineMetrics[];
    revenue_series: { buckets: string[]; series: { line: BusinessLineKey; revenue: number[]; margin: number[] }[] };
    bookings_series: { buckets: string[]; created: number[]; paid: number[] };
    payment_status: { status: string; count: number; value: number }[];
    payment_methods: { method: string; count: number; revenue: number; share: number }[];
    top_packages: { trip_id: string; title: string; enquiries: number; paid: number; revenue: number; margin: number }[];
    hotels: {
        synced: number;
        pending_content: number;
        regions: number;
        prebooks: DashboardKpi;
        last_sync: { scope: string; status: 'running' | 'success' | 'failed'; startedAt: string; finishedAt: string | null; error: string | null } | null;
    };
    recent_transactions: { id: string; txid: string; line: BusinessLineKey | null; status: string; method: string; amount: number; margin: number; created_at: string }[];
}

export type InsightTone = 'positive' | 'negative' | 'info';

export type InsightsResponse = {
    range: { key: DashboardRange; label: string; start: string; end: string; bucket: 'week' | 'month' };
    currency: 'NGN';
    totals: { revenue: number; margin: number; margin_rate: number; margin_estimated: boolean };
    takeaways: { tone: InsightTone; text: string }[];
    trends: {
        buckets: string[];
        lines: {
            line: BusinessLineKey; label: string;
            revenue: number[]; margin: number[];
            total_revenue: number; total_margin: number; margin_rate: number;
            revenue_change: number | null; revenue_share: number; margin_share: number;
        }[];
    };
    funnels: { line: BusinessLineKey; label: string; overall_rate: number; steps: { label: string; count: number; rate_from_previous: number | null }[] }[];
    lead_time: { buckets: { label: string; count: number }[]; median_days: number | null; by_line: { line: BusinessLineKey; median_days: number | null }[]; sample: number };
    seasonality: { months: string[]; series: { line: BusinessLineKey; values: number[] }[] };
    request_weekdays: { label: string; count: number }[];
    destinations: Record<'packages' | 'visa' | 'hotels', { name: string; requests: number; revenue: number }[]>;
    customers: {
        unique_customers: number;
        paying_customers: number;
        repeat_customers: number;
        repeat_rate: number;
        average_spend: number;
        average_group_size: number | null;
        trip_types: { type: string; count: number; share: number }[];
        top_customers: { name: string; email: string; requests: number; paid_bookings: number; spend: number; margin: number }[];
    };
    hotels: { prebooks: number; prebook_value: number; average_prebook_value: number; average_nights: number | null; price_change_rate: number; hotel_bookings: number };
}
