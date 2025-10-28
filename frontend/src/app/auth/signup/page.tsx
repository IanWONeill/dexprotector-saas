"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Shield, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { logger } from "@/lib/logger";

export default function SignUpPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const createUserDocument = async (uid: string, email: string) => {
        try {
            logger.log("Creating user document for:", uid, email);

            await setDoc(doc(db, "users", uid), {
                email: email,
                displayName: '',
                photoURL: '',
                credits: 5, // Free credits for new users
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            logger.log("User document created successfully");
        } catch (error) {
            logger.error("Error creating user document:", error);
            throw error; // Re-throw to be caught by the calling function
        }
    };

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            logger.log("Creating user with email:", email);
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            logger.log("User created in Auth, UID:", userCredential.user.uid);

            await createUserDocument(userCredential.user.uid, email);

            toast.success("Account created successfully!");
            router.push("/dashboard");
        } catch (error: any) {
            logger.error("Signup error:", error);
            toast.error(error.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();

        try {
            logger.log("Starting Google sign-in");
            const result = await signInWithPopup(auth, provider);
            logger.log("Google sign-in successful, UID:", result.user.uid);

            // Check if user document already exists
            const userDocRef = doc(db, "users", result.user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // New user - create document with free credits
                await createUserDocument(result.user.uid, result.user.email || "");
                toast.success("Account created successfully!");
            } else {
                // Existing user - just log them in
                toast.success("Welcome back!");
            }

            router.push("/dashboard");
        } catch (error: any) {
            logger.error("Google sign-up error:", error);
            toast.error(error.message || "Failed to sign up with Google");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1419] flex flex-col relative overflow-hidden no-scroll-x">
            {/* Animated background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0f1419]/95 backdrop-blur-sm border-b border-primary/20 safe-top">
                <div className="container mx-auto px-4 py-3 sm:py-4">
                    <nav className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors touch-manipulation p-2">
                                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Link>
                            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 touch-manipulation">
                                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary cyber-glow" />
                                <span className="text-xl sm:text-2xl font-bold gradient-text font-mono">4tify</span>
                            </Link>
                        </div>
                        <div className="flex items-center">
                            <Link href="/auth/login" className="text-muted-foreground hover:text-primary font-medium transition-colors font-mono text-xs sm:text-sm md:text-base touch-manipulation px-2 py-2">
                                <span className="text-primary/60">$</span> login
                            </Link>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-4 relative z-10 py-6 sm:py-12 safe-bottom">
                <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                        <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-primary cyber-glow" />
                        <span className="text-2xl sm:text-3xl font-bold gradient-text font-mono">
                            4tify
                        </span>
                    </div>
                    <div className="font-mono text-primary text-xs sm:text-sm mb-2">
                        <span className="text-primary/60">$</span> useradd --new
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2 font-mono">
                        [INIT_SESSION]
                    </h1>
                    <p className="text-muted-foreground font-mono text-xs sm:text-sm">
                        create account // 5 free credits
                    </p>
                </div>

                {/* Sign Up Form */}
                <div className="terminal-border bg-card/30 backdrop-blur rounded-lg p-5 sm:p-8 cyber-glow">
                    <form onSubmit={handleEmailSignUp} className="space-y-5 sm:space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs sm:text-sm font-medium text-primary mb-2 font-mono"
                            >
                                email_address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm sm:text-base touch-manipulation"
                                placeholder="user@domain.tld"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xs sm:text-sm font-medium text-primary mb-2 font-mono"
                            >
                                password_hash
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm sm:text-base touch-manipulation"
                                placeholder="****************"
                            />
                            <p className="mt-1 text-xs text-muted-foreground font-mono">
                                min_length: 8
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-xs sm:text-sm font-medium text-primary mb-2 font-mono"
                            >
                                confirm_hash
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded bg-background border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm sm:text-base touch-manipulation"
                                placeholder="****************"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-background py-2.5 sm:py-3 rounded font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cyber-glow font-mono text-sm sm:text-base touch-manipulation min-h-[44px]"
                        >
                            {loading ? "initializing..." : "./signup --execute"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-5 sm:my-6 flex items-center">
                        <div className="flex-1 border-t border-border"></div>
                        <span className="px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground font-mono">
                            ||
                        </span>
                        <div className="flex-1 border-t border-border"></div>
                    </div>

                    {/* Google Sign Up */}
                    <button
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                        className="w-full bg-card border-2 border-border text-foreground py-2.5 sm:py-3 rounded font-semibold hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-mono text-sm sm:text-base touch-manipulation min-h-[44px]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span>oauth2_google()</span>
                    </button>

                    {/* Login Link */}
                    <p className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground font-mono">
                        <span className="text-primary/60">$</span> have account?{" "}
                        <Link
                            href="/auth/login"
                            className="text-primary font-semibold hover:text-primary/80 transition-colors touch-manipulation"
                        >
                            ./login
                        </Link>
                    </p>

                    {/* Free Credits Notice */}
                    <div className="mt-6 p-4 terminal-border bg-primary/10 rounded text-center">
                        <p className="text-sm text-primary font-medium font-mono">
                            <span className="text-green-400">✓</span> init_bonus: 5_credits
                        // free
                        </p>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}
