import React from 'react'
import { FiSearch } from 'react-icons/fi'
import { useSearchParams } from 'react-router';


type props = {
    placeholder?: string;
}
export default function SearchInput(props: props) {
    const [searchParams, setSearchParams] = useSearchParams()
    const searchText = searchParams.get('search') ?? ''
    const page = searchParams.get('p') ?? ''

    const [search, setSearch] = React.useState(searchText)


    React.useEffect(() => {
        // if (search === (searchParams.get('search') ?? '')) return;

        const timerId = setTimeout(() => {
            const nextParams = new URLSearchParams(searchParams.toString());

            if (search && search.trim().length > 0) {
                nextParams.set('search', search.trim());
            } else {
                nextParams.delete('search');
            }
            
            // Always preserve pagination indexes context safely if applicable
            if (page) {
                nextParams.set('p', page);
            }


            // Navigating to the same query would push a duplicate history entry
            if (nextParams.toString() === searchParams.toString()) return;
            setSearchParams(nextParams);
        }, 600);

        return () => {
            clearTimeout(timerId);
        };
    }, [search, searchParams, setSearchParams]);

    // React.useEffect(() => {
    //     setSearch(searchText);
    // }, [searchText]);


    const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
    }, [])
    return (
        <div>
            <div className="border border-gray-200 bg-white px-3 flex items-center gap-1 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <FiSearch className='text-gray-400 text-xl shrink-0' />
                <input
                    onChange={handleSearchChange}
                    value={search}
                    type="text"
                    className='w-full border-0 rounded-md py-3 px-2 outline-0 bg-transparent'
                    placeholder={props.placeholder ?? 'Search country here...'} />
            </div>
        </div>
    )
}
