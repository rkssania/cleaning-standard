// Комикс-тема: тёмно-синий, красный, золотой. Меняются здесь в одном месте.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#12204A', dark: '#0A1333', light: '#FFD23F' },
        accent: '#E62429',
      },
      fontFamily: {
        display: ['Bangers', 'Impact', 'Arial Narrow', 'sans-serif'],
        cond: ['"Barlow Condensed"', 'Arial Narrow', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
