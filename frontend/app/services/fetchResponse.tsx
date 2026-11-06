import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { getAlert } from '~/services/get-alert';
import { createResponse, type createResponseProps } from '~/services/new-apis';
import { dispatchPagination } from '~/store/reducer';

type ApiResponse<T> = T


type Props<T> = {
    limit?: number;
    endpoint: string;
    onSuccess?: (data: ApiResponse<T>) => void;
    header?: string;
    isSearch?: boolean;
    query?: {
        [key: string]: string
    }
    fetchData?: boolean
    origin?: string | null;
    searchParams?: URLSearchParams;
    dataMethod?: createResponseProps["method"];
    dataBody?: any
};


export default function useFetchResponse<T>({
    limit = 20,
    endpoint,
    isSearch = false,
    query = {},
    header,
    fetchData = true,
    onSuccess,
    origin = null,
    searchParams,
    dataMethod,
    dataBody
}: Props<T>) {
    const dispatch = useDispatch();

    let search = ''
    if (isSearch) {
        const params = new URLSearchParams(searchParams);
        Object.entries(query).forEach(([key, value]) => params.set(key, value))
        params.set("page_size", String(limit));
        if (!params.get("page")) params.set("page", "1");
        search = params.toString();
    }

    const result = useQuery<ApiResponse<T>, Error>({
        queryKey: [endpoint, search, origin, dataMethod, dataBody],
        queryFn: async () => {
            try {
                const includeSearch = isSearch ? `?${search}` : '';

                const response: ApiResponse<T> = await createResponse({
                    endpoint: `${endpoint}${includeSearch}`,
                    ...(dataBody ? { data: dataBody } : {}),
                    ...(dataMethod ? { method: dataMethod } : {}),
                    origin: origin,
                });

                if (header) {
                    document.title = `${header}`;
                }

                dispatch(dispatchPagination({
                    page: Number(searchParams?.get("page") || 1),
                    limit
                }));

                onSuccess?.(response)
                return response
            } catch (error: any) {
                getAlert(error.message, "error");
                throw error
            }
        },
        enabled: fetchData,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const refetch = async () => {
        await result.refetch();
    };

    return {
        isLoading: result.isLoading,
        isFetching: result.isFetching,
        data: result.data, // ✅ now strongly typed
        error: result.error?.message?.toString() ?? '',
        isError: result.isError,
        refetch,
    };
}
