import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Target, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Brain className="h-6 w-6" />
            StudyOS
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Đăng nhập</Button>
            </Link>
            <Link href="/register">
              <Button>Đăng ký</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Học thông minh hơn với AI
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Nền tảng học tập cá nhân hóa dành cho học sinh THPT Việt Nam.
            Phân tích điểm yếu, gợi ý lộ trình, và đồng hành cùng bạn chinh phục
            Toán, Lý, Hóa theo chương trình GDPT 2018.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Bắt đầu học ngay</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Xem demo
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/50">
          <div className="container mx-auto px-4 py-16">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center p-6">
                <Brain className="h-10 w-10 mb-4 text-primary" />
                <h3 className="font-semibold text-lg">AI Tutor cá nhân</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hỏi đáp, giải thích kiến thức theo cách phù hợp với bạn.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <Target className="h-10 w-10 mb-4 text-primary" />
                <h3 className="font-semibold text-lg">Phát hiện điểm yếu</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Knowledge Tracing phân tích chính xác concept bạn chưa vững.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <TrendingUp className="h-10 w-10 mb-4 text-primary" />
                <h3 className="font-semibold text-lg">Lộ trình thích ứng</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Adaptive Learning gợi ý bài tập và nội dung phù hợp nhất.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <BookOpen className="h-10 w-10 mb-4 text-primary" />
                <h3 className="font-semibold text-lg">Ngân hàng câu hỏi</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Luyện tập với câu hỏi được kiểm chứng chất lượng.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          StudyOS - AI Study Platform cho học sinh THPT Việt Nam
        </div>
      </footer>
    </div>
  );
}
