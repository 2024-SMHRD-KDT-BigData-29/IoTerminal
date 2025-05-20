// File: frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 다크모드 지원을 위해 추가
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // src 폴더 내의 모든 js, jsx, ts, tsx 파일을 스캔합니다.
    "./public/index.html"         // public/index.html 파일도 스캔 대상에 포함할 수 있습니다 (클래스를 직접 사용할 경우).
  ],
  theme: {
    extend: {
      // 이전에 추가했던 그리드 패턴 배경 (선택적)
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, theme('colors.gray.200') 1px, transparent 1px), linear-gradient(to bottom, theme('colors.gray.200') 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '20px 20px', 
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
    },
  },
  plugins: [],
}