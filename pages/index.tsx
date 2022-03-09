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
  Button,
  Switch,
  toast,
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
import { useDebounce } from "react-use";
import memoize from "micro-memoize";
import { DateTime } from "luxon";

import extrato from "../images/extrato.png";

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

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

const getAveragePurchagePrice = memoize(
  (
    transactions: AtLeast<
      Transaction,
      | TransactionProperties.Ticker
      | TransactionProperties.Value
      | TransactionProperties.Quantity
    >[]
  ) => {
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
  }
);
const getTotalStockValue = memoize((transactions: Transaction[]) => {
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
  console.log("purchases", purchases, totalPurchasePrice);
  const totalSalePrice = sales.reduce(
    (acc, transaction) => acc + transaction.Value,
    0
  );

  // console.log({
  //   totalPurchasePrice,
  //   totalSalePrice,
  // });

  return (totalPurchasePrice - totalSalePrice).toFixed(2);
});

const createStock = memoize(
  (
    ticker: string,
    transactions: Transaction[],
    previousYearData: PreviousYearData
  ): Stock => {
    const totalQuantity = transactions.reduce(
      (acc, transaction) => acc + transaction.Quantity,
      0
    );

    const transactionFromPreviousData =
      previousYearData &&
      ({
        Ticker: previousYearData.ticker,
        Value: (previousYearData.price || 0) * (previousYearData.quantity || 0),
        Quantity: previousYearData.quantity || 0,
        Type: TransactionType.Buy,
      } as Transaction);

    console.log("buceta", previousYearData, transactionFromPreviousData);

    const allTransactions = [
      ...transactions,
      transactionFromPreviousData,
    ].filter(Boolean);

    let averagePurchagePrice = getAveragePurchagePrice(allTransactions);
    let totalPrice = getTotalStockValue(
      allTransactions.filter((transaction) => {
        return transaction.Quantity > 0;
      })
    );

    return {
      Ticker: ticker,
      Instituition: transactions[0].Institution,
      Transactions: transactions,
      Quantity: totalQuantity + (transactionFromPreviousData?.Quantity || 0),
      AveragePurchagePrice: averagePurchagePrice,
      TotalPrice: totalPrice,
      // AveragePurchagePrice: "0",
      // TotalPrice: "0",
      // PreviousYearData: previousYearData,
    };
  }
);

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

const getAllStocks = ({
  transactions,
  previousYearDataMap,
}: {
  transactions: Transaction[];
  previousYearDataMap: Record<string, PreviousYearData>;
}): Stock[] => {
  const groupedByTicker = groupBy(transactions, TransactionProperties.Ticker);
  // console.log("groupedByTicker", groupedByTicker);
  const stocks = mapValues(groupedByTicker, (value, key) => {
    // console.log("key", key, "value", value);
    return createStock(key, value, previousYearDataMap?.[key]);
  });
  return Object.values(stocks);
};

const processFileUpload = async (file: File): Promise<OriginalData | null> => {
  const data = await file.arrayBuffer();
  const workbook = read(data);
  // console.log(workbook);
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

const MoneyInput = ({ value, setValue, ...rest }) => {
  return (
    <InputGroup>
      <InputLeftAddon children="R$" />
      <NumberInput
        onChange={(valueString) => setValue(valueString)}
        value={value}
        {...rest}
      >
        <NumberInputField />
      </NumberInput>
    </InputGroup>
  );
};

const StockItem = ({
  stock,
  previousYearDataMap,
  updatePreviousYearDataMap,
}: {
  stock: Stock;
  previousYearDataMap: PreviousYearDataMap;
  updatePreviousYearDataMap: UpdatePreviousYearDataMap;
}) => {
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

  const [previousYear, setPreviousYear] = useState<{
    price: string;
    quantity: string;
  }>({
    price: "",
    quantity: "",
  });
  // const endValue = parseFloat(stock.TotalPrice) + (+previousYear) |;

  const getTotalValue = (
    price?: string | number,
    quantity?: string | number
  ) => {
    if (!price || !quantity) {
      return 0;
    }
    const priceValue = parseFloat(`${price}`);
    const quantityValue = parseFloat(`${quantity}`);
    return priceValue * quantityValue;
  };
  const previousYearValueFormatted = currencyFormatter(
    getTotalValue(
      previousYearDataMap?.[stock.Ticker]?.price,
      previousYearDataMap?.[stock.Ticker]?.quantity
    ).toString()
  );
  const endValueFormatted = currencyFormatter(stock.TotalPrice.toString());

  const toast = useToast();
  const handleSubmit = (e) => {
    e.preventDefault();
    const value = {
      ticker: stock.Ticker,
      price: parseFloat(previousYear.price) || 0,
      quantity: parseFloat(previousYear.quantity) || 0,
    };
    // console.log("xixixi", value);
    updatePreviousYearDataMap(value);
    toast({
      title: "Ativo recalculado com sucesso!",
      status: "success",
      duration: 1000,
      isClosable: true,
    });
  };

  const [hadInPreviousYear, setHadInPreviousYear] = useState(false);
  const toggleHadInPreviousYear = () => {
    setHadInPreviousYear(!hadInPreviousYear);
  };

  useEffect(() => {
    if (previousYearDataMap?.[stock.Ticker] && !hadInPreviousYear) {
      const value = {
        ticker: stock.Ticker,
        price: 0,
        quantity: 0,
      };
      updatePreviousYearDataMap(value);
    }
  }, [previousYearDataMap?.[stock.Ticker], hadInPreviousYear]);

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

      <Box my="3">
        <Text fontWeight="bold" mb="2">
          Possuia esse ativo na declaração de 2020?{" "}
          <Switch
            ml="4"
            onChange={() => {
              toggleHadInPreviousYear();
            }}
            isChecked={hadInPreviousYear}
          />
        </Text>
        {hadInPreviousYear && (
          <form onSubmit={handleSubmit}>
            <Flex justifyContent="space-between" alignItems="end" w="full">
              <Flex flexBasis="50%" direction="column">
                <Text>Preço Médio Declarado</Text>
                <MoneyInput
                  placeholder="1234.56"
                  value={previousYear.price}
                  setValue={(newValue) =>
                    setPreviousYear((prev) => ({ ...prev, price: newValue }))
                  }
                />
              </Flex>
              <Flex flexBasis="30%" direction="column">
                <Text>Qnt. Declarada</Text>
                <NumberInput
                  placeholder="Ex: 100"
                  onChange={(newValue) =>
                    setPreviousYear((prev) => ({ ...prev, quantity: newValue }))
                  }
                  value={previousYear.quantity}
                >
                  <NumberInputField />
                </NumberInput>
              </Flex>
              <Flex alignItems="end">
                <Button type="submit">Salvar</Button>
              </Flex>
            </Flex>
          </form>
        )}
      </Box>

      <Discriminator stock={stock} />

      <Box mt="4">
        <Flex justifyContent="space-between" alignItems="center" w="full">
          <Flex alignItems="center" flexBasis="50%" direction="column">
            <Text>Situação em 31/12/2020</Text>
            <Box>
              <Text as="span" fontWeight="bold">
                {previousYearValueFormatted}
              </Text>
              <CopyToClipboard text={previousYear?.price?.toString()} />
            </Box>
          </Flex>
          <Flex flexBasis="50%" alignItems="center" direction="column">
            <Text>Situação em 31/12/2021</Text>
            <Box>
              <Text as="span" fontWeight="bold">
                {endValueFormatted}
              </Text>
              <CopyToClipboard text={stock?.TotalPrice?.toString()} />
            </Box>
          </Flex>
        </Flex>
      </Box>

      <TransactionList stock={stock} />
    </Flex>
  );
};

interface PreviousYearData {
  quantity: number;
  price: number;
  ticker: string;
}

type PreviousYearDataMap = Record<string, PreviousYearData>;
type UpdatePreviousYearDataMap = (data: Partial<PreviousYearData>) => void;
const useManagePreviousYearValues = () => {
  const [previousYearDataMap, setPreviousYearDataMap] = useState<
    Record<string, PreviousYearData>
  >({});

  const updatePreviousYearDataMap = (data: Partial<PreviousYearData>) => {
    if (data?.price === 0 && !previousYearDataMap?.[data.ticker].price) {
      return;
    }

    setPreviousYearDataMap((prev) => ({
      ...prev,
      [data.ticker]: {
        ticker: data.ticker,
        ...prev[data.ticker],
        ...data,
      },
    }));
  };

  return {
    previousYearDataMap,
    updatePreviousYearDataMap,
  };
};

export default function Home() {
  const [file, setFile] = useState<File>(null);
  const [data, setData] = useState<OriginalData>();
  const [stocks, setStocks] = useState<Stock[]>([]);

  const { previousYearDataMap, updatePreviousYearDataMap } =
    useManagePreviousYearValues();

  console.log("previousYearDataMap", previousYearDataMap);

  useEffect(() => {
    if (file) {
      processFileUpload(file).then((data) => {
        setData(data);
      });
    }
  }, [file]);

  useEffect(() => {
    if (!data) setStocks([]);
    else {
      // console.log(
      //   getAllStocks({
      //     transactions: processTransactions(data),
      //     previousYearDataMap,
      //   })
      // );
      setStocks(
        getAllStocks({
          transactions: processTransactions(data),
          previousYearDataMap,
        })
      );
    }
  }, [data, previousYearDataMap]);

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
                <StockItem
                  stock={stock}
                  previousYearDataMap={previousYearDataMap}
                  updatePreviousYearDataMap={updatePreviousYearDataMap}
                />
                <Box mb="16" />
              </React.Fragment>
            );
          })}
        </Flex>
      </Flex>
    </Flex>
  );
}
