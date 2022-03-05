// a context for the registered companies
// use this for fetching: const { data: registeredCVMCompanies } = useSWR("/api/scrape_cvm", fetcher);

import useSWR from "swr";
import { createContext, useCallback, useContext } from "react";
import fetcher from "../utils/fetcher";

export const RegisteredCVMCompaniesContext = createContext({
  companies: [],
  isLoading: true,
  getCNPJ: (companyName: string) => null,
});

export const useRegisteredCVMCompanies = () => {
  //  if context is not defined return an error saying it should be used inside the context
  const context = useContext(RegisteredCVMCompaniesContext);
  if (!context) {
    throw new Error(
      "useRegisteredCVMCompanies must be used within a RegisteredCVMCompaniesContextProvider"
    );
  }
  return context;
};

interface RegisteredCVMCompany {
  name: string;
  cnpj: string;
}

const fixText = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^A-Za-z]/g, "");

export const RegisteredCVMCompaniesContextProvider = ({ children }) => {
  const { data, isValidating } = useSWR<RegisteredCVMCompany[]>(
    "/api/scrape_cvm",
    fetcher
  );

  const companies = data;

  const getCNPJ = useCallback(
    (companyName: string) => {
      const company = data?.find(
        (company) => fixText(company.name) === fixText(companyName)
      );

      return company ? company.cnpj : null;
    },
    [data]
  );

  return (
    <RegisteredCVMCompaniesContext.Provider
      value={{
        companies: companies || [],
        isLoading: isValidating,
        getCNPJ,
      }}
    >
      {children}
    </RegisteredCVMCompaniesContext.Provider>
  );
};
