"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Home, 
  MessageCircle, 
  BookOpen, 
  TrendingUp, 
  FileText, 
  Settings, 
  LogOut, 
  Shield,
  Brain,
  Menu,
  X,
  User,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/actions";

interface SidebarProps {
  username: string;
  role: "STUDENT" | "ADMIN";
}

export function Sidebar({ username, role }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const studentNavItems = [
    { href: "/dashboard", icon: Home, label: "Tổng quan" },
    { href: "/tutor", icon: MessageCircle, label: "AI Tutor" },
    { href: "/history", icon: History, label: "Lịch sử" },
    { href: "/questions", icon: BookOpen, label: "Luyện tập" },
    { href: "/progress", icon: TrendingUp, label: "Tiến trình" },
    { href: "/knowledge", icon: FileText, label: "Kiến thức" },
  ];

  const adminNavItems = [
    { href: "/admin", icon: Shield, label: "Tổng quan" },
    { href: "/admin/users", icon: User, label: "Người dùng" },
    { href: "/admin/moderation", icon: MessageCircle, label: "Duyệt nội dung" },
  ];

  const navItems = role === "STUDENT" ? studentNavItems : adminNavItems;

  return (
    <>
      {/* Mobile Header với Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-5 w-5" />
            </div>
            <span>StudyOS</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Overlay cho mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen w-64 flex flex-col border-r bg-background transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo (hidden on mobile, shown on desktop) */}
        <div className="hidden lg:flex p-6">
          <Link href="/dashboard" className="flex items-center gap-3 font-bold text-2xl text-primary">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Brain className="h-6 w-6" />
            </div>
            <span>StudyOS</span>
          </Link>
        </div>

        {/* Mobile spacer */}
        <div className="lg:hidden h-16" />

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setMobileOpen(false)}
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 transition-all duration-200 ${
                    isActive ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Profile + Actions */}
        <div className="mt-auto border-t p-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{username}</p>
              <p className="text-xs text-muted-foreground">{role === "STUDENT" ? "Học sinh" : "Quản trị"}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href="/profile" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm">Hồ sơ</span>
              </Button>
            </Link>
            <Link href="/settings" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Cài đặt</span>
              </Button>
            </Link>
          </div>

          <form action={logout}>
            <Button 
              type="submit" 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
