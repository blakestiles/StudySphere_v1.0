import Link from "next/link";
import UserButton from "@/components/features/auth/UserButton";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-blue-600">Study</span>
          <span>Sphere</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
