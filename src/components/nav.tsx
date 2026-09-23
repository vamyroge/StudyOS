import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLoading } from "@/hooks/use-loading";
import { Brain, Home, MessageCircle, BookOpen, TrendingUp, FileText, User, Settings, LogOut, Shield } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "./ui/button";

interface NavProps {
  username: string;
  role: "STUDENT" | "ADMIN";
}

export function Nav({ username, role }: NavProps) {
  const pathname = usePathname();
  const { addLoading, removeLoading } = useLoading();

  useEffect(() => {
    addLoading();
    const timer = setTimeout(() => {
      removeLoading();
    }, 300);
    return () => clearTimeout(timer);
  }, [pathname, addLoading, removeLoading]);
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <Brain className="h-6 w-6" />
            StudyOS
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard" icon={<Home className="h-4 w-4" />}>
              Dashboard
            </NavLink>
            <NavLink href="/tutor" icon={<MessageCircle className="h-4 w-4" />}>
              AI Tutor
            </NavLink>
            <NavLink href="/questions" icon={<BookOpen className="h-4 w-4" />}>
              Câu hỏi
            </NavLink>
            <NavLink href="/progress" icon={<TrendingUp className="h-4 w-4" />}>
              Tiến trình
            </NavLink>
            <NavLink href="/knowledge" icon={<FileText className="h-4 w-4" />}>
              Kiến thức
            </NavLink>
            {role === "ADMIN" && (
              <NavLink href="/admin" icon={<Shield className="h-4 w-4" />}>
                Admin
              </NavLink>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{username}</span>
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <form action={logout}>
            <Button variant="ghost" size="icon" type="submit">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <Button variant="ghost" size="sm" className="gap-2">
        {icon}
        {children}
      </Button>
    </Link>
  );
}
