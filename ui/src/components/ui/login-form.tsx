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
                src='/assets/logo.png'
                alt='Company Logo'
                className='rounded-full'
            />
        ),
        className: 'size-[80px] border-none bg-transparent',
        duration: 20,
        delay: 0,
        radius: 150,
        path: false,
        reverse: false,
    },
    {
        component: () => (
            <img
                width={100}
                height={100}
                src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg'
                alt='HTML5'
            />
        ),
        className: 'size-[30px] border-none bg-transparent',
        duration: 20,
        delay: 20,
        radius: 100,
        path: false,
        reverse: false,
    },
    {
        component: () => (
            <img
                width={100}
                height={100}
                src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg'
                alt='CSS3'
            />
        ),
        className: 'size-[30px] border-none bg-transparent',
        duration: 20,
        delay: 10,
        radius: 100,
        path: false,
        reverse: false,
    },
    {
        component: () => (
            <img
                width={100}
                height={100}
                src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg'
                alt='TypeScript'
            />
        ),
        className: 'size-[50px] border-none bg-transparent',
        radius: 210,
        duration: 20,
        path: false,
        reverse: false,
    },
    {
        component: () => (
            <img
                width={100}
                height={100}
                src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg'
                alt='JavaScript'
            />
        ),
        className: 'size-[50px] border-none bg-transparent',
        radius: 210,
        duration: 20,
        delay: 20,
        path: false,
        reverse: false,
    },
    {
        component: () => (
            <img
                width={100}
                height={100}
                src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg'
                alt='TailwindCSS'
            />
        ),
        className: 'size-[30px] border-none bg-transparent',
        duration: 20,
        delay: 20,
        radius: 150,
        path: false,
        reverse: true,
    },
    {
        component: () => (
            <img
                width={100}
                height={100}
                src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg'
                alt='Nextjs'
            />
        ),
        className: 'size-[30px] border-none bg-transparent',
        duration: 20,
        delay: 10,
        radius: 150,
        path: false,
        reverse: true,
    },
    {
        component: () => (
            <img
                width={100}
                height={100}
                src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg'
                alt='React'
            />
        ),
        className: 'size-[50px] border-none bg-transparent',
        radius: 270,
        duration: 20,
        path: false,
        reverse: true,
    },
    {
        component: () => (
            <img
                width={100}
                height={100}
                src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg'
                alt='Figma'
            />
        ),
        className: 'size-[50px] border-none bg-transparent',
        radius: 270,
        duration: 20,
        delay: 60,
        path: false,
        reverse: true,
    },
    {
        component: () => (
            <img
                width={100}
                height={100}
                src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg'
                alt='Git'
            />
        ),
        className: 'size-[50px] border-none bg-transparent',
        radius: 320,
        duration: 20,
        delay: 20,
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
