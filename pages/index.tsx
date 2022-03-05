import Head from 'next/head';
import { useMemo, useState } from 'react';
import styles from '../styles/Home.module.css';
import { read, utils } from 'xlsx';
import { flow, groupBy } from 'lodash';

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
  Ticker = 'Ticker',
  Date = 'Date',
  Institution = 'Institution',
  Market = 'Market',
  Maturity = 'Maturity',
  Price = 'Price',
  Quantity = 'Quantity',
  Type = 'Type',
  Value = 'Value',
}
enum OriginalFileHeaderKeys {
  Ticker = 'Código de Negociação',
  Date = 'Data do Negócio',
  Institution = 'Instituição',
  Market = 'Mercado',
  Maturity = 'Prazo/Vencimento',
  Price = 'Preço',
  Quantity = 'Quantidade',
  Type = 'Tipo de Movimentação',
  Value = 'Valor',
}
interface Transaction {
  [TransactionProperties.Ticker]: string;
  [TransactionProperties.Date]: string;
  [TransactionProperties.Institution]: string;
  [TransactionProperties.Market]: string;
  [TransactionProperties.Maturity]: string;
  [TransactionProperties.Price]: string;
  [TransactionProperties.Quantity]: string;
  [TransactionProperties.Type]: string;
  [TransactionProperties.Value]: string;
}
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

type OriginalData = Array<Record<OriginalFileHeaderKeys, string>>;

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

const processData = flow(transformKeys);

export default function Home() {
  const [file, setFile] = useState<File>(null);
  const [data, setData] = useState<OriginalData>(null);
  const [table, setTable] = useState(null);

  const processedData = useMemo(() => {
    return processData(data);
  }, [data]);

  console.log(processedData);

  return (
    <div className={styles.container}>
      Faça upload na nota de negociação da B3
      <input
        type="file"
        onChange={async (ev) => {
          const file = ev.target.files[0];
          const data = await file.arrayBuffer();
          console.log(data);
          /* data is an ArrayBuffer */
          const workbook = read(data);
          console.log(workbook);
          try {
            setData(
              utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
            );
            setTable(
              utils.sheet_to_html(workbook.Sheets[workbook.SheetNames[0]])
            );
          } catch (err) {
            console.log(err);
          }
          setFile(file);
        }}
      />
      file info: {file?.name}
      {Object.entries(groupBy(processData, TransactionProperties.Ticker)).map(
        ([ticker, transactionList]: [string, Transaction[]]) => {
          return (
            <div>
              {ticker}
              <div>
                {transactionList.map((transaction) => {
                  return <p>{transaction.Institution}</p>;
                })}
              </div>
            </div>
          );
        }
      )}
      {/* <div
        dangerouslySetInnerHTML={{
          __html: table,
        }}
      /> */}
    </div>
  );
}
