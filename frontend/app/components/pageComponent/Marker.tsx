

export default function Marker({title}: {title: string}) {
    return (
        <div className="flex items-center gap-3 mt-8 mb-3">
            <div className="font-bold text-primary whitespace-nowrap">{title}</div>
            <div className="h-px flex-1 bg-slate-200"></div>
        </div>
    )
}
