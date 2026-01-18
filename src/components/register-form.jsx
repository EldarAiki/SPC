"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const formSchema = z.object({
    code: z.string().min(1, "Player code is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password too short"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export default function RegisterForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values) {
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: values.code, password: values.password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Registration failed");
            } else {
                setSuccess(true);
                setTimeout(() => router.push("/login"), 2000);
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-sm border-0 shadow-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-green-600 text-center">Success!</CardTitle>
                    <CardDescription className="text-center">
                        Your account has been registered. Redirecting to login...
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-sm border-0 shadow-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center text-primary">Activate Account</CardTitle>
                <CardDescription className="text-center">
                    Enter your player code and set a password
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Player Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your player code" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Create a password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Confirm password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {error && <div className="text-sm text-red-500 font-medium text-center">{error}</div>}

                        <Button className="w-full font-semibold" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Activate
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex justify-center mt-4">
                <Link href="/login" className="text-sm text-blue-600 hover:underline">
                    Already have a password? Login
                </Link>
            </CardFooter>
        </Card>
    );
}
