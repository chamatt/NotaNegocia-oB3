import React, { useEffect, useMemo, useState } from "react";
import { read, utils } from "xlsx";
import { flow, groupBy, mapValues } from "lodash";
import {
  Badge,
  Box,
  Divider,
  Flex,
  IconButton,
  Link,
  Text,
  useColorModeValue,
  AccordionPanel,
  AccordionButton,
  AccordionItem,
  Accordion,
  useToast,
  Input,
  NumberInput,
  NumberInputField,
  InputLeftAddon,
  InputGroup,
} from "@chakra-ui/react";
import Dropzone from "../components/Dropzone";
import {
  AiOutlineCopy,
  AiOutlineDown,
  AiOutlineQuestionCircle,
} from "react-icons/ai";
import { useRegisteredCVMCompanies } from "../context/registeredCVMCompanies";
import Navbar from "../components/Navbar";
import Image from "next/image";
import NextLink from "next/link";
import {} from "@chakra-ui/react";

import extrato from "../images/extrato.png";

// Código de Negociação: "BOVA11"
// Data do Negócio: "29/12/2021"
// Instituição: "NU INVEST CORRETORA DE VALORES S.A."
// Mercado: "Mercado à Vista"
// Prazo/Vencimento: "-"
// Preço: 100.52
// Quantidade: 5
// Tipo de Movimentação: "Compra"
// Valor: 502.6

enum TransactionProperties {
  Ticker = "Ticker",
  Date = "Date",
  Institution = "Institution",
  Market = "Market",
  Maturity = "Maturity",
  Price = "Price",
  Quantity = "Quantity",
  Type = "Type",
  Value = "Value",
}
enum OriginalFileHeaderKeys {
  Ticker = "Código de Negociação",
  Date = "Data do Negócio",
  Institution = "Instituição",
  Market = "Mercado",
  Maturity = "Prazo/Vencimento",
  Price = "Preço",
  Quantity = "Quantidade",
  Type = "Tipo de Movimentação",
  Value = "Valor",
}

enum TransactionType {
  Buy = "Compra",
  Sell = "Venda",
}

interface Transaction {
  [TransactionProperties.Ticker]: string;
  [TransactionProperties.Date]: string;
  [TransactionProperties.Institution]: string;
  [TransactionProperties.Market]: string;
  [TransactionProperties.Maturity]: string;
  [TransactionProperties.Price]: number;
  [TransactionProperties.Quantity]: number;
  [TransactionProperties.Type]: TransactionType;
  [TransactionProperties.Value]: number;
}

interface Stock {
  Ticker: string;
  Instituition: string;
  Transactions: Transaction[];
  Quantity: number;
  AveragePurchagePrice: string;
  TotalPrice: string;
}

const getAveragePurchagePrice = (transactions: Transaction[]) => {
  const purchases = transactions.filter(
    (transaction) => transaction.Type === TransactionType.Buy
  );
  const sumPrice = purchases.reduce(
    (acc, transaction) => acc + transaction.Value,
    0
  );
  const sumQuantity = purchases.reduce(
    (acc, transaction) => acc + transaction.Quantity,
    0
  );
  return (sumPrice / sumQuantity).toFixed(2);
};
const getTotalStockValue = (transactions: Transaction[]) => {
  const purchases = transactions.filter(
    (transaction) => transaction.Type === TransactionType.Buy
  );
  const sales = transactions.filter(
    (transaction) => transaction.Type === TransactionType.Sell
  );

  const totalPurchasePrice = purchases.reduce(
    (acc, transaction) => acc + transaction.Value,
    0
  );
  const totalSalePrice = sales.reduce(
    (acc, transaction) => acc + transaction.Value,
    0
  );

  return (totalPurchasePrice - totalSalePrice).toFixed(2);
};

const createStock = (ticker: string, transactions: Transaction[]): Stock => {
  const totalQuantity = transactions.reduce(
    (acc, transaction) => acc + transaction.Quantity,
    0
  );
  const averagePurchagePrice = getAveragePurchagePrice(transactions);
  const totalPrice = getTotalStockValue(transactions);
  return {
    Ticker: ticker,
    Instituition: transactions[0].Institution,
    Transactions: transactions,
    Quantity: totalQuantity,
    AveragePurchagePrice: averagePurchagePrice,
    TotalPrice: totalPrice,
  };
};

const MapOriginalFileHeaderKeysToProperties = {
  [OriginalFileHeaderKeys.Ticker]: TransactionProperties.Ticker,
  [OriginalFileHeaderKeys.Date]: TransactionProperties.Date,
  [OriginalFileHeaderKeys.Institution]: TransactionProperties.Institution,
  [OriginalFileHeaderKeys.Market]: TransactionProperties.Market,
  [OriginalFileHeaderKeys.Maturity]: TransactionProperties.Maturity,
  [OriginalFileHeaderKeys.Price]: TransactionProperties.Price,
  [OriginalFileHeaderKeys.Quantity]: TransactionProperties.Quantity,
  [OriginalFileHeaderKeys.Type]: TransactionProperties.Type,
  [OriginalFileHeaderKeys.Value]: TransactionProperties.Value,
};

type OriginalData = Array<Record<OriginalFileHeaderKeys, any>>;

const transformKeys = (originalData: OriginalData): Transaction[] => {
  return (
    originalData?.map((transaction) => {
      const entries = Object.entries(transaction).map(([key, value]) => [
        MapOriginalFileHeaderKeysToProperties[key],
        value,
      ]);
      return Object.fromEntries(entries) as Transaction;
    }) || []
  );
};

const processTransactions = (originalData: OriginalData): Transaction[] =>
  flow(transformKeys)(originalData);

const getAllStocks = (transactions: Transaction[]): Stock[] => {
  const groupedByTicker = groupBy(transactions, TransactionProperties.Ticker);
  console.log("groupedByTicker", groupedByTicker);
  const stocks = mapValues(groupedByTicker, (value, key) => {
    console.log("key", key, "value", value);
    return createStock(key, value);
  });
  return Object.values(stocks);
};

const processFileUpload = async (file: File): Promise<OriginalData | null> => {
  const data = await file.arrayBuffer();
  const workbook = read(data);
  console.log(workbook);
  try {
    return utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  } catch (err) {
    return null;
  }
};

const currencyFormatter = (value: string) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parseFloat(value));
};

const copyToClipboard1 = (text: string) => {
  navigator.clipboard.writeText(text);
};
const copyToClipboard2 = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
};

const copyToClipboard = (text: string) => {
  try {
    copyToClipboard1(text);
  } catch (err) {
    try {
      copyToClipboard2(text);
    } catch (err) {
      console.log(err);
    }
  }
};

const CopyToClipboard = ({ text }: { text: string }) => {
  const toast = useToast();
  return (
    <IconButton
      bgColor="transparent"
      size="sm"
      aria-label="Copiar Descriminação"
      onClick={() => {
        try {
          copyToClipboard(text);
          toast({
            title: "Copiado para a área de transferência",
            status: "success",
            duration: 1000,
            isClosable: true,
          });
        } catch (err) {
          toast({
            title: "Erro ao copiar",
            status: "error",
            duration: 1000,
            isClosable: true,
          });
        }
      }}
    >
      <AiOutlineCopy />
    </IconButton>
  );
};

const Discriminator = ({ stock }: { stock: Stock }) => {
  const { getCNPJ } = useRegisteredCVMCompanies();

  const cnpj = useMemo(() => getCNPJ(stock.Instituition), [stock.Instituition]);
  const cnpjTextPart = cnpj ? ` / CNPJ: ${cnpj}` : "";

  const descriminatoryText = `${stock.Ticker} / ${
    stock.Quantity
  } Unidades / Preço Médio ${currencyFormatter(
    stock.AveragePurchagePrice
  )} / Corretora ${stock.Instituition}${cnpjTextPart}`;

  return (
    <Box>
      <Flex alignItems="center">
        <Text fontWeight="bold">Descriminação </Text>
        <CopyToClipboard text={descriminatoryText} />
      </Flex>
      <Text>{descriminatoryText}</Text>
    </Box>
  );
};

const TransactionRow = ({ transaction }: { transaction: Transaction }) => {
  const { Ticker, Date, Institution, Price, Value, Quantity, Type } =
    transaction;
  const value = Price * Quantity;

  const bgColor = useColorModeValue("gray.100", "gray.700");

  const buyColor = useColorModeValue("green.200", "green.500");
  const sellColor = useColorModeValue("red.200", "red.500");

  const badgeColor = Type === TransactionType.Buy ? buyColor : sellColor;
  const type = Type === TransactionType.Buy ? "Compra" : "Venda";

  return (
    <Flex
      alignItems="center"
      bg={bgColor}
      px="4"
      py="2"
      justify="space-between"
    >
      <Flex direction="column" flex="1">
        <Flex mb="2" alignItems="center" justify="space-between">
          <Flex w="100%">
            <Badge
              w="16"
              textAlign="center"
              bg={badgeColor}
              size="xs"
              lineHeight="taller"
            >
              {type}
            </Badge>
            <Box className="ellipsis" w="90%">
              <Text
                as="span"
                fontSize="sm"
                ml="2"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                maxW="60%"
                w="-webkit-max-content"
              >
                {Ticker} - {Institution}
              </Text>
            </Box>
          </Flex>
          <Flex>
            <Text fontSize="sm" ml="2" fontWeight="bold">
              {currencyFormatter(Value.toString())}
            </Text>
          </Flex>
        </Flex>

        <Flex flex="1" justify="space-between" alignItems="center">
          <Box>
            <Text fontSize="xs">{Date}</Text>
          </Box>
          <Flex>
            <Text fontSize="xs" textTransform="uppercase">
              {currencyFormatter(Price.toString())}
            </Text>
            <Text fontSize="xs" px="0.5">
              ×
            </Text>
            <Text fontSize="xs" textTransform="uppercase">
              {Quantity}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

const TransactionList = ({ stock }: { stock: Stock }) => {
  const transactions = stock.Transactions;

  return (
    <Box mt="4">
      <Accordion allowMultiple allowToggle>
        <AccordionItem>
          <AccordionButton>
            <Flex alignItems="center">
              <Box mr="2">
                <AiOutlineDown />
              </Box>
              <Text fontWeight="bold">Transações </Text>
            </Flex>
          </AccordionButton>
          <AccordionPanel p="0" m="0">
            {transactions.map((transaction) => (
              <React.Fragment
                key={`transaction-${transaction.Date}-${transaction.Quantity}-${transaction.Price}`}
              >
                <TransactionRow transaction={transaction} />
                <Divider />
              </React.Fragment>
            ))}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  );
};

const MoneyInput = ({ value, setValue }) => {
  return (
    <InputGroup>
      <InputLeftAddon children="R$" />
      <NumberInput
        onChange={(valueString) => setValue(valueString)}
        value={value}
      >
        <NumberInputField />
      </NumberInput>
    </InputGroup>
  );
};

const StockItem = ({ stock }: { stock: Stock }) => {
  const { getCNPJ } = useRegisteredCVMCompanies();

  const cnpj = useMemo(() => getCNPJ(stock.Instituition), [stock.Instituition]);

  const renderCNPJ = () => {
    if (cnpj) {
      return (
        <Text fontSize="sm" fontWeight="bold">
          {cnpj} <CopyToClipboard text={cnpj} />
        </Text>
      );
    } else {
      const url = new URL("http://www.google.com/search");
      url.searchParams.append("q", `${stock.Instituition} cnpj`);
      return (
        <Link
          fontSize="sm"
          color="blue.500"
          target="_blank"
          href={url.toString()}
        >
          Pesquisar CNPJ
        </Link>
      );
    }
  };

  const bgColor = useColorModeValue("gray.100", "gray.700");

  const [startValue, setStartValue] = useState<number>(0);
  const endValue = parseFloat(stock.TotalPrice) + +startValue;
  const endValueFormatted = currencyFormatter(endValue.toString());

  return (
    <Flex bg={bgColor} width="full" p="8" direction="column">
      <Flex flex="1" mb="2" flexWrap="wrap">
        <Flex direction="column" alignContent="center" flex="1">
          <Box>
            <Text fontSize="lg" fontWeight="bold" d="block">
              {stock.Ticker}
            </Text>
          </Box>
          <Box className="ellipsis">
            <Text as="span">{stock.Instituition}</Text>
          </Box>
          {renderCNPJ()}
        </Flex>
        <Flex justify="end">
          <Box>
            <Text fontSize="lg" align="right" fontWeight="semibold">
              {currencyFormatter(stock.TotalPrice)}
            </Text>
            <Text align="right">
              <Text as="span" fontWeight="semibold">
                Qtd:
              </Text>{" "}
              {stock.Quantity}
            </Text>
            <Text align="right">
              <Text as="span" fontWeight="semibold">
                P.M.:
              </Text>{" "}
              {currencyFormatter(stock.AveragePurchagePrice)}
            </Text>
          </Box>
        </Flex>
      </Flex>
      <Discriminator stock={stock} />

      <Text fontWeight="bold" mt="4" mb="2">
        Valores no início e fim do ano
      </Text>
      <Flex justifyContent="space-between" alignItems="center" w="full">
        <Flex alignItems="center" flexBasis="50%">
          <MoneyInput value={startValue} setValue={setStartValue} />
          <CopyToClipboard text={startValue.toString()} />
        </Flex>
        <Flex flexBasis="50%" justifyContent="end" alignItems="center">
          {endValueFormatted}
          <CopyToClipboard text={endValue.toString()} />
        </Flex>
      </Flex>

      <TransactionList stock={stock} />
    </Flex>
  );
};

export default function Home() {
  const [file, setFile] = useState<File>(null);
  const [data, setData] = useState<OriginalData>();

  const stocks = useMemo(() => {
    if (!data) return [];
    console.log(processTransactions(data));
    return getAllStocks(processTransactions(data));
  }, [data]);

  useEffect(() => {
    if (file) {
      processFileUpload(file).then((data) => {
        setData(data);
      });
    }
  }, [file]);

  return (
    <Flex flex="1" direction="column" alignItems="center" w="full">
      <Navbar />

      <Flex mt="8" justify="start" w="100%" maxW="xl" padding={["4", 0, 0, 0]}>
        <NextLink href="/faq">
          <Link>
            <Text align="left" display="flex" fontWeight="bold">
              <Flex alignItems="center">
                Como baixar a nota de negociação de 2021?
                <Box ml={2}>
                  <AiOutlineQuestionCircle />
                </Box>
              </Flex>
            </Text>
          </Link>
        </NextLink>
      </Flex>

      <Flex w="100%" maxW="xl" direction="column" padding={["4", 0, 0, 0]}>
        <Box mb="16" mt="8">
          <Text fontSize="2xl" fontWeight="bold" mb="4">
            Faça upload da nota de negociação da B3
          </Text>
          <Dropzone
            acceptedTypes=".xlsx"
            file={file}
            onFileAccepted={(file) => {
              setFile(file);
            }}
            textHints={{
              active: "Arraste a nota de negociação da B3 aqui",
              inactive: "Solte a nota de negociação da B3 aqui",
            }}
          />
        </Box>
        <Flex w="full" maxWidth="xl" direction="column">
          {stocks.map((stock) => {
            return (
              <React.Fragment key={`stock-${stock.Ticker}`}>
                <StockItem stock={stock} />
                <Box mb="16" />
              </React.Fragment>
            );
          })}
        </Flex>
      </Flex>
    </Flex>
  );
}
