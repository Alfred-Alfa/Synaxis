"use client";
import { useEffect, useRef, useState } from "react";
import { User, Lock, ArrowRight } from 'lucide-react';

// Vertex shader source code
const vertexSmokeySource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

// Fragment shader source code for the smokey background effect
const fragmentSmokeySource = `
precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 u_color;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord / iResolution;
    vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    float time = iTime * 0.5;

    // Normalize mouse input (0.0 - 1.0) and remap to -1.0 ~ 1.0
    vec2 mouse = iMouse / iResolution;
    vec2 rippleCenter = 2.0 * mouse - 1.0;

    vec2 distortion = centeredUV;
    // Apply distortion for a wavy, smokey effect
    for (float i = 1.0; i < 8.0; i++) {
        distortion.x += 0.5 / i * cos(i * 2.0 * distortion.y + time + rippleCenter.x * 3.1415);
        distortion.y += 0.5 / i * cos(i * 2.0 * distortion.x + time + rippleCenter.y * 3.1415);
    }

    // Create a glowing wave pattern
    float wave = abs(sin(distortion.x + distortion.y + time));
    float glow = smoothstep(0.9, 0.2, wave);

    fragColor = vec4(u_color * glow, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

/**
 * Valid blur sizes supported by Tailwind CSS.
 */
type BlurSize = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/**
 * Props for the SmokeyBackground component.
 */
interface SmokeyBackgroundProps {
    backdropBlurAmount?: string;
    color?: string;
    className?: string;
}

/**
 * A mapping from blur size names to Tailwind CSS classes.
 */
const blurClassMap: Record<BlurSize, string> = {
    none: "backdrop-blur-none",
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
    "2xl": "backdrop-blur-2xl",
    "3xl": "backdrop-blur-3xl",
};

/**
 * A React component that renders an interactive WebGL shader background.
 */
export function SmokeyBackground({
    backdropBlurAmount = "sm",
    color = "#1E40AF", // Default dark blue
    className = "",
}: SmokeyBackgroundProps): React.JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    // Helper to convert hex color to RGB (0-1 range)
    const hexToRgb = (hex: string): [number, number, number] => {
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;
        return [r, g, b];
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl");
        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        const compileShader = (type: number, source: string): WebGLShader | null => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSmokeySource);
        const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSmokeySource);
        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program linking error:", gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
        const iTimeLocation = gl.getUniformLocation(program, "iTime");
        const iMouseLocation = gl.getUniformLocation(program, "iMouse");
        const uColorLocation = gl.getUniformLocation(program, "u_color");

        let startTime = Date.now();
        const [r, g, b] = hexToRgb(color);
        gl.uniform3f(uColorLocation, r, g, b);

        const render = () => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);

            const currentTime = (Date.now() - startTime) / 1000;

            gl.uniform2f(iResolutionLocation, width, height);
            gl.uniform1f(iTimeLocation, currentTime);
            gl.uniform2f(iMouseLocation, isHovering ? mousePosition.x : width / 2, isHovering ? height - mousePosition.y : height / 2);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            requestAnimationFrame(render);
        };

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        };
        const handleMouseEnter = () => setIsHovering(true);
        const handleMouseLeave = () => setIsHovering(false);

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseenter", handleMouseEnter);
        canvas.addEventListener("mouseleave", handleMouseLeave);

        render();

        return () => {
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseenter", handleMouseEnter);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [isHovering, mousePosition, color]);

    const finalBlurClass = blurClassMap[backdropBlurAmount as BlurSize] || blurClassMap["sm"];

    return (
        <div className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}>
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className={`absolute inset-0 ${finalBlurClass}`}></div>
        </div>
    );
}

/**
 * Props for the LoginForm component.
 */
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

/**
 * A glassmorphism-style login form component with animated labels.
 */
export function LoginForm({
    email,
    setEmail,
    password,
    setPassword,
    onSubmit,
    loading,
    error,
    onForgotPassword
}: LoginFormProps) {
    return (
        <div className="w-full max-w-md px-10 py-12 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl flex flex-col gap-8 relative z-10">
            {/* Header Block */}
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold !text-white leading-tight drop-shadow-md">Welcome Back</h2>
                <p className="text-base text-gray-200 leading-relaxed font-medium pb-2">Sign in to continue</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-sm leading-relaxed backdrop-blur-sm">
                    {error}
                </div>
            )}

            {/* Form Block */}
            <form onSubmit={onSubmit} className="flex flex-col gap-8">
                <div className="flex flex-col gap-6">
                    {/* Email Input with Animated Label */}
                    <div className="relative group">
                        <input
                            type="email"
                            id="floating_email"
                            value={email}
                            onChange={(e) => setEmail && setEmail(e.target.value)}
                            className="block w-full py-4 text-white bg-transparent border-0 border-b-2 border-gray-400/50 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer pt-6 pb-2 text-lg transition-colors"
                            placeholder=" "
                            required
                        />
                        <label
                            htmlFor="floating_email"
                            className="absolute text-base text-gray-300 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] peer-focus:text-blue-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:top-2 hover:cursor-text pointer-events-none flex items-center gap-2"
                        >
                            <User size={18} />
                            Email Address
                        </label>
                    </div>

                    {/* Password Input with Animated Label */}
                    <div className="relative group">
                        <input
                            type="password"
                            id="floating_password"
                            value={password}
                            onChange={(e) => setPassword && setPassword(e.target.value)}
                            className="block w-full py-4 text-white bg-transparent border-0 border-b-2 border-gray-400/50 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer pt-6 pb-2 text-lg transition-colors"
                            placeholder=" "
                            required
                        />
                        <label
                            htmlFor="floating_password"
                            className="absolute text-base text-gray-300 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] peer-focus:text-blue-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-4 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:top-2 hover:cursor-text pointer-events-none flex items-center gap-2"
                        >
                            <Lock size={18} />
                            Password
                        </label>
                    </div>
                </div>

                {/* Action Block */}
                <div className="flex flex-col gap-6 mt-4">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-sm font-medium text-blue-300 hover:text-white transition-colors duration-200 ml-auto"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group w-full flex items-center justify-center py-4 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-xl text-white text-lg font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all duration-300 shadow-lg shadow-blue-900/40 active:scale-[0.98]"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                        <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </form>

            {/* Secondary Link */}
            <p className="text-center text-sm text-gray-300 leading-relaxed mt-2">
                Don't have an account? <a href="#" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors ml-1 underline decoration-blue-400/30 underline-offset-4">Sign Up</a>
            </p>
        </div>
    );
}
