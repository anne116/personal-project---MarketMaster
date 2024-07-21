import React, { createContext, useState, useContext, useMemo } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ChakraProvider } from "@chakra-ui/react";
import Theme from "./theme";
import PropTypes from "prop-types";

const SavedListContext = createContext();
export const useSavedList = () => useContext(SavedListContext);

const SavedListProvider = ({ children }) => {
  const [savedProducts, setSavedProducts] = useState([]);
  const saveProduct = async (product) => {
    setSavedProducts((prevProducts) => [...prevProducts, product]);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("/api/save_to_savedLists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: product.id }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, message: "Unauthorized" };
        }
        const data = await response.json();

        if (
          response.status === 400 &&
          data.detail === "Product already saved"
        ) {
          return { success: false, message: data.detail };
        }
        return { success: false, message: data.detail };
      }
      const data = await response.json();
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const removeProduct = async (product_id) => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `/api/unsave_product/${encodeURIComponent(product_id)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      const data = await response.json();
      throw new Error(data.detail);
    }
    setSavedProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== product_id),
    );
  };

  const value = useMemo(
    () => ({
      savedProducts,
      setSavedProducts,
      saveProduct,
      removeProduct,
    }),
    [savedProducts],
  );

  return (
    <SavedListContext.Provider
      // value={{ savedProducts, setSavedProducts, saveProduct, removeProduct }}
      value={value}
    >
      {children}
    </SavedListContext.Provider>
  );
};

SavedListProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ChakraProvider theme={Theme}>
      <SavedListProvider>
        <App />
      </SavedListProvider>
    </ChakraProvider>
  </React.StrictMode>,
);
