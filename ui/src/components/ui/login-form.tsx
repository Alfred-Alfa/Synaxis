"use client";
import React from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import {
    Ripple,
    AuthTabs,
    TechOrbitDisplay,
} from './modern-animated-sign-in';

interface LoginFormProps {
    email?: string;
    setEmail?: (val: string) => void;
    password?: string;
    setPassword?: (val: string) => void;
    onSubmit?: (e: React.FormEvent) => void;
    loading?: boolean;
    error?: string;
    onForgotPassword?: () => void;
}

interface OrbitIcon {
    component: () => ReactNode;
    className: string;
    duration?: number;
    delay?: number;
    radius?: number;
    path?: boolean;
    reverse?: boolean;
}

const iconsArray: OrbitIcon[] = [
    {
        component: () => (
            <img
                width={80}
                height={80}
                src='/assets/logo-elitecraft.png'
                alt='Elitecraft Logo'
                className='rounded-full'
            />
        ),
        className: 'size-[80px] border-none bg-transparent',
        duration: 20,
        delay: 0,
        radius: 180,
        path: false,
        reverse: false,
    },
    {
        component: () => (
            <img
                width={60}
                height={60}
                src='/assets/logo-cursor.png'
                alt='Cursor Logo'
                className='rounded-full'
            />
        ),
        className: 'size-[60px] border-none bg-transparent',
        duration: 20,
        delay: 7,
        radius: 180,
        path: false,
        reverse: false,
    },
    {
        component: () => (
            <img
                width={60}
                height={60}
                src='/assets/logo-runner.png'
                alt='Runner Logo'
                className='rounded-full'
            />
        ),
        className: 'size-[60px] border-none bg-transparent',
        duration: 20,
        delay: 14,
        radius: 180,
        path: false,
        reverse: false,
    },
];

export function LoginForm({
    setEmail,
    setPassword,
    onSubmit,
    loading,
    error,
    onForgotPassword
}: LoginFormProps) {

    const handleForgotPassword = (
        event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
    ) => {
        event.preventDefault();
        if (onForgotPassword) onForgotPassword();
    };

    const handleInputChange = (
        event: ChangeEvent<HTMLInputElement>,
        type: 'email' | 'password'
    ) => {
        const value = event.target.value;
        if (type === 'email' && setEmail) setEmail(value);
        if (type === 'password' && setPassword) setPassword(value);
    };

    const formFields = {
        header: 'Welcome back',
        subHeader: 'Sign in to your account',
        fields: [
            {
                label: 'Email',
                required: true,
                type: 'email' as const,
                placeholder: 'Enter your email address',
                onChange: (event: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(event, 'email'),
            },
            {
                label: 'Password',
                required: true,
                type: 'password' as const,
                placeholder: 'Enter your password',
                onChange: (event: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(event, 'password'),
            },
        ],
        submitButton: loading ? 'Signing in...' : 'Sign in',
        textVariantButton: 'Forgot password?',
        errorField: error
    };

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        // The AnimatedForm handles validation internally then calls this
        if (onSubmit) onSubmit(event);
    };

    return (
        <div className="w-full flex h-screen bg-background text-foreground overflow-hidden">
            <section className='flex w-full max-lg:justify-center'>
                {/* Left Side */}
                <span className='flex flex-col justify-center w-1/2 max-lg:hidden relative bg-black/5 dark:bg-white/5'>
                    <Ripple mainCircleSize={100} />
                    <TechOrbitDisplay iconsArray={iconsArray} text="Sentinal HRMS" />
                </span>

                {/* Right Side */}
                <span className='w-1/2 h-full flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%]'>
                    <AuthTabs
                        formFields={formFields}
                        goTo={handleForgotPassword}
                        handleSubmit={handleFormSubmit}
                    />
                </span>
            </section>
        </div>
    );
}
