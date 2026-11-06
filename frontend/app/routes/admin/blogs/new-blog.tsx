


import AHeader from '~/components/admin/AHeader'
import BlogForm from '~/routes/admin/blogs/blog-form'

export default function NewBlogPage() {


  return (
    <div>
      <AHeader
        title="New Blog"
        subtitle=''
      />
      <BlogForm data={null} />
    </div>
  )
}
