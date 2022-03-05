import "../styles/globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import { RegisteredCVMCompaniesContextProvider } from "../context/registeredCVMCompanies";

function MyApp({ Component, pageProps }) {
  return (
    <RegisteredCVMCompaniesContextProvider>
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
    </RegisteredCVMCompaniesContextProvider>
  );
}

export default MyApp;
