import { Star1 } from 'iconsax-reactjs'

type props = {
    stars: number;
    className?: string;
}

/** ETG star_rating (0 = unrated, renders nothing) */
export default function StarRating({ stars, className = 'size-3.5' }: props) {
    if (!stars) return null
    return (
        <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${stars} star${stars === 1 ? '' : 's'}`}>
            {new Array(stars).fill(0).map((_, index) => <Star1 key={index} variant="Bold" className={`${className} text-amber-500`} />)}
        </span>
    )
}
