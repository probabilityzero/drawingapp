/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"], // Or wherever your HTML and JS files are
  theme: {
      extend: {
          colors: {
              'beige-light': '#f5f5dc', // Light beige color
              // You can add more custom colors here if needed
          },
          fontWeight: {
              'thin': '100',       // Define 'thin' if Tailwind doesn't have it by default
              'extralight': '200', // Define 'extralight' if needed
              'light': '300',      // Or use Tailwind's 'light' if it exists
              'normal': '400',     // Default
              // ... other font weights if needed
          },
      },
  },
  plugins: [],
};