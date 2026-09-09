'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PeakBackdrop from '@/components/PeakBackdrop'

type Category = {
  id: string
  slug: string
  name: string
  description: string | null
}

type CourseCard = {
  id: string
  slug: string
  title: string
  description: string
  category_id: string | null
  totalLessons: number
  completedLessons: number
  enrolled: boolean
}

export default function CoursesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [courses, setCourses] = useState<CourseCard[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [requestTitle, setRequestTitle] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [requestError, setRequestError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      setCategories(categoriesData || [])

      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('published', true)

      if (!coursesData) {
        setLoading(false)
        return
      }

      let enrolledCourseIds = new Set<string>()
      let completedLessonIds = new Set<string>()

      if (user) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user.id)

        enrolledCourseIds = new Set(enrollments?.map((e) => e.course_id))

        const { data: progress } = await supabase
          .from('progress')
          .select('lesson_id')
          .eq('user_id', user.id)

        completedLessonIds = new Set(progress?.map((p) => p.lesson_id))
      }

      const results: CourseCard[] = []

      for (const course of coursesData) {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', course.id)

        const totalLessons = lessons?.length || 0
        const completedLessons = lessons?.filter((l) => completedLessonIds.has(l.id)).length || 0

        results.push({
          ...course,
          totalLessons,
          completedLessons,
          enrolled: enrolledCourseIds.has(course.id),
        })
      }

      setCourses(results)
      setLoading(false)
    }

    load()
  }, [])

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRequestError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('course_requests').insert({
      user_id: user?.id || null,
      requested_title: requestTitle,
      notes: requestNotes || null,
    })

    if (error) {
      setRequestError('Something went wrong. Please try again.')
    } else {
      setRequestSubmitted(true)
      setRequestTitle('')
      setRequestNotes('')
    }
  }

  if (loading) return null

  const filteredCourses = courses.filter((c) => {
    const matchesCategory = activeCategory === 'all' || c.category_id === activeCategory
    const matchesSearch =
      searchQuery.trim() === '' ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const activeCategoryData = categories.find((c) => c.id === activeCategory)

  return (
    <main>
      <section className="relative overflow-hidden">
        <PeakBackdrop />
        <div className="relative max-w-3xl mx-auto px-4 pt-16 pb-10 text-center">
          <h1 className="text-4xl font-medium mb-3">Find your next course</h1>
          <p className="text-brand-secondary max-w-lg mx-auto">
            Every course is free, self-paced, and built to actually prepare you —
            not sell you a bundle.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-brand-muted/40 rounded-md p-3 mb-4 bg-brand-surface"
        />

        <div className="flex flex-wrap gap-2 mb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={
              activeCategory === 'all'
                ? 'bg-brand-primary text-black px-4 py-1.5 rounded-full text-sm font-medium'
                : 'border border-brand-muted/40 px-4 py-1.5 rounded-full text-sm hover:border-brand-primary transition'
            }
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={
                activeCategory === cat.id
                  ? 'bg-brand-primary text-black px-4 py-1.5 rounded-full text-sm font-medium'
                  : 'border border-brand-muted/40 px-4 py-1.5 rounded-full text-sm hover:border-brand-primary transition'
              }
            >
              {cat.name}
            </button>
          ))}
        </div>

        {activeCategoryData?.description && (
          <p className="text-sm text-brand-secondary mb-8">{activeCategoryData.description}</p>
        )}
        {activeCategory === 'all' && <div className="mb-8" />}

        <div className="space-y-3 mb-16">
          {filteredCourses.length === 0 && (
            <p className="text-brand-secondary text-sm">No courses match your search.</p>
          )}
          {filteredCourses.map((course) => {
            const percent = course.totalLessons > 0
              ? Math.round((course.completedLessons / course.totalLessons) * 100)
              : 0
            const isComplete = course.enrolled && percent === 100

            return (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="block rounded-xl bg-brand-surface hover:bg-brand-surface-raised transition p-6"
              >
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xl font-medium">{course.title}</h2>
                  {course.enrolled && (
                    <span className={isComplete ? 'text-xs text-brand-primary' : 'text-xs text-brand-secondary'}>
                      {isComplete ? '✓ Completed' : `${percent}% complete`}
                    </span>
                  )}
                </div>
                <p className="text-brand-secondary mb-3">{course.description}</p>

                {course.enrolled ? (
                  <div className="w-full h-1.5 bg-brand-muted/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-brand-secondary">Not enrolled</span>
                )}
              </Link>
            )
          })}
        </div>

        <div className="border-t border-brand-muted/20 pt-10">
          <h2 className="text-xl font-medium mb-2">Don&apos;t see what you&apos;re looking for?</h2>
          <p className="text-brand-secondary text-sm mb-4">
            Tell us what you&apos;d like Orivian to build next — every request shapes the roadmap.
          </p>

          {requestSubmitted ? (
            <p className="text-brand-primary text-sm">
              Thanks — your request has been submitted!
            </p>
          ) : (
            <form onSubmit={handleRequestSubmit} className="space-y-3 max-w-md">
              <input
                type="text"
                placeholder="Course or certification name"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                className="w-full border border-brand-muted/40 rounded-md p-2 bg-brand-surface"
                required
              />
              <textarea
                placeholder="Anything else? (optional)"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                className="w-full border border-brand-muted/40 rounded-md p-2 bg-brand-surface"
                rows={3}
              />
              {requestError && <p className="text-red-500 text-sm">{requestError}</p>}
              <button
                type="submit"
                className="bg-brand-primary text-black px-6 py-2 rounded-md font-medium hover:bg-brand-primary-light transition"
              >
                Submit Request
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}