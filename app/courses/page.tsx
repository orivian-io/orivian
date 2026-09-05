import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function CoursesPage() {
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true)

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Courses</h1>
      <div className="space-y-4">
        {courses?.map((course) => (
          <Link
            key={course.id}
            href={`/courses/${course.slug}`}
            className="block border rounded-lg p-6 hover:border-gray-400 transition"
          >
            <h2 className="text-xl font-semibold">{course.title}</h2>
            <p className="text-gray-600 mt-1">{course.description}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}