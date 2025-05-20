import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        float1: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.3' },
          '50%': { transform: 'translateY(-15px) translateX(5px)', opacity: '0.8' },
        },
        float2: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.4' },
          '50%': { transform: 'translateY(-20px) translateX(-10px)', opacity: '0.7' },
        },
        float3: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.5' },
          '50%': { transform: 'translateY(-10px) translateX(15px)', opacity: '0.9' },
        },
        float4: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.3' },
          '30%': { transform: 'translateY(-25px) translateX(5px)', opacity: '0.6' },
          '70%': { transform: 'translateY(-5px) translateX(-10px)', opacity: '0.8' },
        },
        float5: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.4' },
          '25%': { transform: 'translateY(-15px) translateX(-15px)', opacity: '0.7' },
          '75%': { transform: 'translateY(10px) translateX(10px)', opacity: '0.9' },
        },
      },
      animation: {
        float1: 'float1 6s ease-in-out infinite',
        float2: 'float2 8s ease-in-out infinite',
        float3: 'float3 7s ease-in-out infinite',
        float4: 'float4 10s ease-in-out infinite',
        float5: 'float5 9s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar')
  ],
  darkMode: "class",
};
export default config;
