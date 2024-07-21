import { extendTheme } from "@chakra-ui/react";

const Theme = extendTheme({
  fonts: {
    heading: "Oswald, sans-serif",
    body: "Oswald, sans-serif",
  },
  colors: {
    brand: {
      50: "#E6FFFA",
      75: "#D1FFF7",
      100: "#B2F5EA",
      150: "#A0F0E3",
      200: "#81E6D9",
      250: "#72E1D2",
      300: "#4FD1C5",
      350: "#45C8BC",
      400: "#38B2AC",
      450: "#31A9A2",
      500: "#319795",
      550: "#2D8A88",
      600: "#2C7A7B",
      650: "#276C6F",
      700: "#285E61",
      750: "#245557",
      800: "#234E52",
      850: "#1F4548",
      900: "#1D4044",
      950: "#19393B",
    },
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: "brand.500",
          _hover: {
            bg: "brand.600",
          },
        },
      },
    },
  },
});

export default Theme;
