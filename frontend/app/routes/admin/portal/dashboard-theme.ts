// Chart tokens for the admin dashboard and insights (validated categorical palette, light surface #ffffff).
// Colour follows the business line: a line keeps its colour on every chart, whatever is filtered.

export type BusinessLineKey = 'hotels' | 'packages' | 'visa' | 'transfers';

export const BUSINESS_LINE_ORDER: BusinessLineKey[] = ['hotels', 'packages', 'visa', 'transfers'];

export const LineColors: Record<BusinessLineKey, string> = {
    hotels: '#2a78d6',
    packages: '#eb6834',
    visa: '#1baf7a',
    transfers: '#eda100',
};

export const LineLabels: Record<BusinessLineKey, string> = {
    hotels: 'Hotels',
    packages: 'Holiday packages',
    visa: 'Visa',
    transfers: 'Airport transfers',
};

/** What a "request" is for each line, before any payment */
export const LineRequestLabels: Record<BusinessLineKey, string> = {
    hotels: 'rooms prebooked',
    packages: 'enquiries',
    visa: 'applications',
    transfers: 'orders',
};

export const lineColor = (line: string | null) => LineColors[line as BusinessLineKey] ?? '#8a8985';
export const lineLabel = (line: string | null) => LineLabels[line as BusinessLineKey] ?? line ?? 'Other';

// Margin is drawn in ink, never in a line colour, so it never reads as another business line
export const MARGIN_INK = '#002722';

// Status colours are reserved for state and always shown with an icon + label
export const StatusTones = {
    good: '#0ca30c',
    warning: '#fab219',
    serious: '#ec835a',
    critical: '#d03b3b',
    neutral: '#8a8985',
} as const;

export type StatusTone = keyof typeof StatusTones;

export const PaymentStatusMeta: Record<string, { label: string; tone: StatusTone }> = {
    PAID: { label: 'Paid', tone: 'good' },
    PART_PAID: { label: 'Part paid', tone: 'serious' },
    SUBMITTED: { label: 'Proof submitted', tone: 'warning' },
    PENDING: { label: 'Pending', tone: 'warning' },
    Declined: { label: 'Declined', tone: 'critical' },
};

export const paymentStatusMeta = (status: string) => PaymentStatusMeta[status] ?? { label: status, tone: 'neutral' as StatusTone };

export const PaymentMethodLabels: Record<string, string> = {
    DIRECT_BANK_TRANSFER: 'Bank transfer',
    UNIFIED_PAYMENT_TRANSFER: 'Card / online',
};

export const ChartInk = {
    text: '#52514e',
    muted: '#8a8985',
    grid: '#ececea',
    surface: '#ffffff',
};

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
const nairaCompact = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 });

export const formatNaira = (value: number) => naira.format(value || 0);
export const formatNairaCompact = (value: number) => nairaCompact.format(value || 0);
export const formatCount = (value: number) => compact.format(value || 0);
export const formatPercent = (value: number) => `${(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 1 })}%`;
