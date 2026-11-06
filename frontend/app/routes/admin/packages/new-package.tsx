
import AHeader from '~/components/admin/AHeader'
import TripForm from '~/routes/admin/packages/trip-form'


export default function NewPackagePage() {
  return (
    <div>
      <AHeader title="New Package" subtitle='' />
      <div className="mt-5">
        <TripForm data={null} images={[]} />
      </div>
    </div>
  )
}
