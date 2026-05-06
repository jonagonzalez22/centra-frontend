/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{ts,tsx,css}'],
    theme: {
        extend: {
            colors: {
                centra: {
                    primary: '#093764',
                    secondary: '#4F46E5',
                    success: '#52c41a',
                    warning: '#faad14',
                    error: '#ff4d4f',
                    text: '#1f1f1f',
                    link: '#000000',
                    surface: '#f5f5f5',
                },
            },
        },
    },
    plugins: [],
};
