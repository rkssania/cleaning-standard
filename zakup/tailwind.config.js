// Фирменные цвета Центра гематологии (взяты с логотипа: сине-серый и оранжевый). Меняются здесь в одном месте.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#4F5880', dark: '#3C4468', light: '#ECEEF5' },
        accent: '#D2762F',
      },
      fontFamily: { sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'] },
    },
  },
  plugins: [],
};
