import Link from 'next/link'

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-24 text-center">
      <h1 className="text-5xl font-bold mb-6">
        Free courses,<br />
        <span className="text-brand-primary">built by AI</span>, for professionals.
      </h1>
      <p className="text-lg text-brand-secondary max-w-2xl mx-auto mb-10">
        Orivian is a free learning platform for any professional field —
        starting with a full CISSP certification prep course.
      </p>
      <Link
        href="/courses"
        className="inline-block bg-brand-primary text-black px-8 py-3 rounded-md font-medium hover:bg-brand-primary-light transition"
      >
        Browse Courses
      </Link>
    </main>
  )
}