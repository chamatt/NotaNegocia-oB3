import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import styles from "../styles/Home.module.css";
import { read, utils } from "xlsx";
import { flow, groupBy, mapValues } from "lodash";
import {
  Badge,
  Box,
  Divider,
  Flex,
  IconButton,
  Table,
  Tbody,
  Td,
  Text,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import Dropzone from "../components/Dropzone";
import { AiOutlineCopy } from "react-icons/ai";

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
    (acc, transaction) => acc + transaction.Price,
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
    (acc, transaction) => acc + transaction.Price,
    0
  );
  const totalSalePrice = sales.reduce(
    (acc, transaction) => acc + transaction.Price,
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
  console.log(data);
  /* data is an ArrayBuffer */
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

const CopyToClipboard = ({ text }: { text: string }) => {
  return (
    <IconButton
      size="sm"
      aria-label="Copiar Descriminação"
      onClick={() => navigator.clipboard.writeText(text)}
    >
      <AiOutlineCopy />
    </IconButton>
  );
};

const Discriminator = ({ stock }: { stock: Stock }) => {
  const descriminatoryText = `${stock.Ticker} / ${stock.Quantity} Unidades / Custo Médio ${stock.AveragePurchagePrice} / Corretora ${stock.Instituition}`;

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
  const { Ticker, Date, Institution, Market, Maturity, Price, Quantity, Type } =
    transaction;
  const value = Price * Quantity;

  const buyColor = useColorModeValue("green.200", "green.800");
  const sellColor = useColorModeValue("red.200", "red.300");

  const color = Type === TransactionType.Buy ? buyColor : sellColor;
  const type = Type === TransactionType.Buy ? "Compra" : "Venda";

  return (
    <Flex
      alignItems="center"
      bg="gray.200"
      px="4"
      py="2"
      justify="space-between"
    >
      <Flex flex="1">
        <Text>{transaction.Date}</Text>
      </Flex>
      <Badge
        w="16"
        textAlign="center"
        bg={Type === TransactionType.Buy ? buyColor : sellColor}
        fontSize="xs"
        fontWeight="semibold"
      >
        {type}
      </Badge>

      {/* <Text>{Ticker}</Text>
      <Text>{Date}</Text>
      <Text>{Institution}</Text>
      <Text>{Market}</Text>
      <Text>{Maturity}</Text>
      <Text>{currencyFormatter(Price.toString())}</Text>
      <Text>{Quantity}</Text>
      <Text>{Type}</Text>
      <Text>{currencyFormatter(value.toString())}</Text> */}
    </Flex>
  );
};

const TransactionList = ({ stock }: { stock: Stock }) => {
  const transactions = stock.Transactions;
  const totalQuantity = stock.Quantity;
  const totalPrice = stock.TotalPrice;
  const averagePurchagePrice = stock.AveragePurchagePrice;

  return (
    <Box>
      <Flex alignItems="center">
        <Text fontWeight="bold">Transações </Text>
        <IconButton size="sm" aria-label="Copiar Descriminação">
          <AiOutlineCopy />
        </IconButton>
      </Flex>

      {transactions.map((transaction) => (
        <>
          <TransactionRow transaction={transaction} />
          <Divider />
        </>
      ))}

      {/* <Table>
        <Thead>
          <Tr>
            <Td>Data</Td>
            <Td>Tipo</Td>
            <Td>Preço</Td>
            <Td>Quantidade</Td>
            <Td>Valor</Td>
          </Tr>
        </Thead>
        <Tbody>
          {transactions.map((transaction) => (
            <Tr key={transaction.Date}>
              <Td>{transaction.Date}</Td>
              <Td>{transaction.Type}</Td>
              <Td>{currencyFormatter(transaction.Price.toString())}</Td>
              <Td>{transaction.Quantity}</Td>
              <Td>{currencyFormatter(transaction.Value.toString())}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table> */}
      <Box>
        <Flex alignItems="center">
          <Text fontWeight="bold">Resumo </Text>
          <IconButton size="sm" aria-label="Copiar Descriminação">
            <AiOutlineCopy />
          </IconButton>
        </Flex>
        <Text>
          Quantidade Total: {totalQuantity} Unidades
          <br />
          Valor Total: {currencyFormatter(totalPrice.toString())}
          <br />
          Custo Médio: {currencyFormatter(averagePurchagePrice.toString())}
        </Text>
      </Box>
    </Box>
  );
};

const StockItem = ({ stock }: { stock: Stock }) => {
  const bgColor = useColorModeValue("gray.100", "gray.700");

  return (
    <Flex bg={bgColor} width="full" p="8" direction="column">
      <Flex flex="1" mb="2">
        <Flex direction="column" flex="1" alignContent="center">
          <Box>
            <Text fontSize="lg" fontWeight="bold" d="block">
              {stock.Ticker}
            </Text>
          </Box>
          <Text>{stock.Instituition}</Text>
        </Flex>
        <Flex justify="end">
          <Box>
            <Text fontSize="lg" align="right" fontWeight="semibold">
              {currencyFormatter(stock.TotalPrice)}
            </Text>
            <Text align="right">
              <Text as="span" fontWeight="semibold">
                Quantidade:
              </Text>{" "}
              {stock.Quantity}
            </Text>
          </Box>
        </Flex>
      </Flex>
      <Discriminator stock={stock} />
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
    <Box m="auto" w="full" maxW="xl">
      <Box my="16">
        <Text fontSize="2xl" fontWeight="bold" mb="4">
          Faça upload na nota de negociação da B3
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
            <>
              <StockItem stock={stock} />
              <Box mb="16" />
            </>
          );
        })}
      </Flex>
    </Box>
  );
}
