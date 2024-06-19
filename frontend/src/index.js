import React, { createContext, useState, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ChakraProvider } from '@chakra-ui/react';
import Theme from './Theme'

const SavedListContext = createContext();
export const useSavedList = () => useContext(SavedListContext);

const SavedListProvider = ({ children }) => {
  const [savedProducts, setSavedProducts] = useState([]);

  const saveProduct = (product) => {
    setSavedProducts((prevProducts) => [...prevProducts, product]);
  };

  return (
    <SavedListContext.Provider value={{ savedProducts, saveProduct }}>
      {children}
    </SavedListContext.Provider>
  )
}


const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ChakraProvider theme={Theme}>
      <SavedListProvider>
        <App />
      </SavedListProvider>
    </ChakraProvider>
  </React.StrictMode>
);
