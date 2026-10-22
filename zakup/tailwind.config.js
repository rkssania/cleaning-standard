// Фирменные цвета Центра гематологии: меняются здесь в одном месте.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#12396B', dark: '#0B2547', light: '#E8EEF6' },
        accent: '#C8102E',
      },
      fontFamily: { sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'] },
    },
  },
  plugins: [],
};
