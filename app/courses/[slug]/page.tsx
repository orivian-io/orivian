import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', course.id)
    .order('order_index')

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <p className="text-gray-600 mt-2 mb-8">{course.description}</p>

      <h2 className="text-xl font-semibold mb-4">Lessons</h2>
      <div className="space-y-3">
        {lessons?.map((lesson) => (
          <div key={lesson.id} className="border rounded-lg p-4">
            <h3 className="font-medium">{lesson.title}</h3>
          </div>
        ))}
      </div>
    </main>
  )
}