import Navbar from "@/components/navbar";

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-900">
            <Navbar />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
