import LoginForm from "@/components/login-form";

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-100 dark:from-zinc-950 dark:to-blue-950 p-4">
            <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 pointer-events-none" />
            <div className="relative z-10 w-full max-w-sm">
                {/* Placeholder for Logo */}
                <div className="mb-8 flex justify-center">
                    <div className="h-16 w-16 bg-blue-600 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-2xl transform rotate-3">
                        SPC
                    </div>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
