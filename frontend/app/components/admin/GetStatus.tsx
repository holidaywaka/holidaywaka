


type componentProps = {
    status: string
}

export default function GetStatus({status}: componentProps) {
    const pending = ['pending']
    const failed = ['rejected', 'unfulfilled', 'inactive', 'open', 'unpaid', 'false', 'declined']
    const processing = ['part_paid', "submitted", 'true']
  if(pending.includes(status.toLowerCase())) return <div className={`uppercase bg-gray-200 text-xs text-center font-medium w-fit mx-auto text-gray-700 rounded-md py-1 px-2 truncate`}>{status}</div>
  if(failed.includes(status.toLowerCase())) return <div className={`uppercase bg-red-100 text-xs text-center font-medium w-fit mx-auto text-red-700 rounded-md py-1 px-2 truncate`}>{status}</div>
  if(processing.includes(status.toLowerCase())) return <div className={`uppercase bg-cyan-100 text-xs text-center font-medium w-fit mx-auto text-cyan-700 rounded-md py-1 px-2 truncate`}>{status?.replace("_", " ")}</div>
  return <div className={`uppercase bg-green-100 text-xs text-center font-medium w-fit mx-auto text-green-700 rounded-md py-1 px-2 truncate`}>{status}</div>
}
