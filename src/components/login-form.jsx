"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

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
    password: z.string().min(1, "Password is required"),
});

export default function LoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: "",
            password: "",
        },
    });

    async function onSubmit(values) {
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                redirect: false,
                code: values.code,
                password: values.password,
            });

            if (result?.error) {
                setError("Invalid code or password");
                setLoading(false);
            } else {
                router.push("/dashboard");
                router.refresh(); // Ensure session is updated
            }
        } catch (err) {
            setError("An unexpected error occurred");
            setLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-sm border-0 shadow-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center text-primary">Login</CardTitle>
                <CardDescription className="text-center">
                    Enter your player code to access the club
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
                                        <Input placeholder="Enter your code" {...field} />
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
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter your password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {error && <div className="text-sm text-red-500 font-medium text-center">{error}</div>}
                        <Button className="w-full font-semibold" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 mt-4 text-center text-sm text-muted-foreground">
                <div>Don&apos;t have a password? Please contact your agent.</div>
            </CardFooter>
        </Card>
    );
}
