import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/20">
      <Link href="/" className="text-xl font-bold tracking-wide text-brand-primary">
        ORIVIAN
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <Link href="/courses" className="hover:text-brand-primary transition">
          Courses
        </Link>
        <Link href="/login" className="hover:text-brand-primary transition">
          Log in
        </Link>
        <Link
          href="/signup"
          className="bg-brand-primary text-black px-4 py-2 rounded-md font-medium hover:bg-brand-primary-light transition"
        >
          Sign up
        </Link>
      </div>
    </nav>
  )
}