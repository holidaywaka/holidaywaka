

import type { paginationTypeProps } from "global";
import { ArrowLeft, ArrowRight } from "iconsax-reactjs";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router";
import type { RootState } from "~/store/store";
import { BackToTop } from "../utils";

const mapPage = (number: number) => {
  const arr = [];
  for (let i = 0; i < number; i++) {
    arr.push(i + 1);
  }
  return arr;
};

type componentProps = {
  total: number;
  pageAction: () => void;
};

export default function Paginated({ total, pageAction }: componentProps) {
  const {perPage} = useSelector((state: RootState) => state.data)
  const ellipsisThreshold = 3;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("p") ?? 1);
  const totalPages = Math.ceil(total / perPage);

  function handlePageAction(num: number, type: paginationTypeProps) {
    let newPage = currentPage;
    
    if (type === "next") {
      newPage = Math.min(currentPage + 1, totalPages);
    } else if (type === "previous") {
      newPage = Math.max(currentPage - 1, 1);
    } else if (type === "current") {
      newPage = num;
    }

    setSearchParams(`?p=${newPage}`);
    pageAction();
    BackToTop()
  }

  const getPageNumbers = () => {
    if (totalPages <= ellipsisThreshold * 2 + 1) {
      return mapPage(totalPages);
    }

    let startPage = Math.max(2, currentPage - ellipsisThreshold);
    let endPage = Math.min(totalPages - 1, currentPage + ellipsisThreshold);

    // Adjust if we're near the start or end
    if (currentPage <= ellipsisThreshold + 1) {
      endPage = 1 + ellipsisThreshold * 2;
    } else if (currentPage >= totalPages - ellipsisThreshold) {
      startPage = totalPages - ellipsisThreshold * 2;
    }

    const pages: (number | string)[] = [1];
    
    // Add first ellipsis if needed
    if (startPage > 2) {
      pages.push('...');
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last ellipsis if needed
    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    // Add last page if not already included
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="border-t border-gray-300 mt-4 px-6 py-4 pb-2 flex items-center flex-wrap justify-between">
      <div
        onClick={() => currentPage <= 1 ? null : handlePageAction(0, "previous")}
        className={`size-fit py-2 px-3 rounded-md flex items-center gap-2 border border-gray-300 ${
          currentPage <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-black cursor-pointer'
        } transition-all hover:scale-95`}
      >
        <ArrowLeft />
        <span>Previous</span>
      </div>
      
      <div className='flex justify-center'>
        <div className='flex space-x-4'>
          {getPageNumbers().map((num, index) => (
            <button
              key={index}
              onClick={() => (typeof num === 'number' ? handlePageAction(num, "current") : null)}
              className={`p-1 rounded-md cursor-pointer px-3 ${
                currentPage === num ? "bg-[#D1D9EE] text-primary" : ""
              }`}
              disabled={num === '...'}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
      
      <div
        onClick={() => currentPage >= totalPages ? null : handlePageAction(0, "next")}
        className={`size-fit py-2 px-3 rounded-md flex items-center gap-2 border border-gray-300 ${
          currentPage >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-black cursor-pointer'
        } transition-all hover:scale-95`}
      >
        <span>Next</span>
        <ArrowRight />
      </div>
    </div>
  );
};
