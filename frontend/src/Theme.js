import { extendTheme } from "@chakra-ui/react";

const Theme = extendTheme({
    fonts: {
        heading: `'Oswald', sans-serif`,
        body: `'Oswald', sans-serif`,
    },
    colors: {
        brand: {
          50: '#E6FFFA',
          100: '#B2F5EA',
          200: '#81E6D9',
          300: '#4FD1C5',
          400: '#38B2AC',
          500: '#319795',
          600: '#2C7A7B',
          700: '#285E61',
          800: '#234E52',
          900: '#1D4044',
        },
      },
      components: {
        Button: {
          variants: {
            solid: {
              bg: 'brand.500',
              _hover: {
                bg: 'brand.600',
              },
            },
          },
        },
      },
});

export default Theme;