'use client'

import Link from 'next/link'
import { MastervoltLogo } from '@/app/_components/landing/assets/MastervoltLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from '@/components/ui/card'
import { Label } from '@/components/ui/base/label'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black/95 relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md px-4 relative z-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors font-mono text-xs uppercase tracking-widest"
                >
                    <ArrowLeft size={14} />
                    <span>Back to Landing</span>
                </Link>

                <div className="flex justify-center mb-8">
                    <div className="relative h-16 w-16 flex items-center justify-center">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl scale-150" />
                        <MastervoltLogo
                            className="w-12 h-12 relative z-10"
                            color="emerald"
                        />
                    </div>
                </div>

                <Card className="bg-black/50 border-white/10 backdrop-blur-xl">
                    <CardHeader className="text-center space-y-1">
                        <CardTitle className="text-2xl font-black italic tracking-tighter text-white uppercase">
                            Welcome_Back
                        </CardTitle>
                        <CardDescription className="font-mono text-xs text-slate-400">
                            Enter your credentials to access the console
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="text-xs font-mono uppercase tracking-wider text-slate-400"
                            >
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="researcher@mastervolt.dev"
                                className="bg-white/5 border-white/10 focus-visible:ring-emerald-500/50 text-white placeholder:text-slate-600 font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="password"
                                    className="text-xs font-mono uppercase tracking-wider text-slate-400"
                                >
                                    Password
                                </Label>
                                <Link
                                    href="#"
                                    className="text-[10px] font-mono text-emerald-500 hover:text-emerald-400 uppercase tracking-wider"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                className="bg-white/5 border-white/10 focus-visible:ring-emerald-500/50 text-white font-mono text-sm"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            asChild
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-black italic tracking-widest border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] h-10"
                        >
                            <Link href="/dashboard">AUTHENTICATE_SESSION</Link>
                        </Button>

                        <div className="text-center text-xs text-slate-500 font-mono">
                            <span>Don't have an account? </span>
                            <Link
                                href="/signup"
                                className="text-emerald-500 hover:text-emerald-400 font-bold hover:underline decoration-emerald-500/30 underline-offset-4"
                            >
                                REQUEST ACCESS
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
