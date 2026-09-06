import Link from 'next/link'

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-20 text-center">
      <img
        src="/logo.svg"
        alt="Orivian"
        className="h-32 w-auto mx-auto mb-10"
      />

      <h1 className="text-5xl font-bold mb-6">
        <span className="text-brand-primary">Free courses</span>,<br />
        built for professionals.
      </h1>

      <p className="text-lg text-brand-secondary max-w-2xl mx-auto mb-10">
        Orivian is a free learning platform for any professional field —
        starting with a full CISSP certification prep course.
      </p>

      <div className="flex items-center justify-center gap-4">
        <Link
          href="/courses"
          className="inline-block bg-brand-primary text-black px-8 py-3 rounded-md font-medium hover:bg-brand-primary-light transition"
        >
          Browse Courses
        </Link>
        <Link
          href="/signup"
          className="inline-block border border-brand-muted/40 px-8 py-3 rounded-md font-medium hover:border-brand-primary transition"
        >
          Sign Up Free
        </Link>
      </div>
    </main>
  )
}