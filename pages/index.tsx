import Head from 'next/head';
import { useState } from 'react';
import styles from '../styles/Home.module.css';
import { read, utils } from 'xlsx';

// Código de Negociação: "BOVA11"
// Data do Negócio: "29/12/2021"
// Instituição: "NU INVEST CORRETORA DE VALORES S.A."
// Mercado: "Mercado à Vista"
// Prazo/Vencimento: "-"
// Preço: 100.52
// Quantidade: 5
// Tipo de Movimentação: "Compra"
// Valor: 502.6

enum OriginalFileHeaderKeys {
  TransactionCode = 'Código de Negociação',
}

enum TransactionProperties {
  TransactionCode = 'TransactionCode',
}

const MapOriginalFileHeaderKeysToProperties = {
  [OriginalFileHeaderKeys.TransactionCode]:
    TransactionProperties.TransactionCode,
};

const transformKeys = (
  originalData: Array<Record<OriginalFileHeaderKeys, string>>
) => {};

const processData = () => {};

export default function Home() {
  const [file, setFile] = useState<File>(null);
  const [workbook, setWorkbook] = useState(null);
  const [data, setData] = useState(null);
  const [table, setTable] = useState(null);

  console.log(data);

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
          setData(utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]));
          setFile(file);
          setTable(
            utils.sheet_to_html(workbook.Sheets[workbook.SheetNames[0]])
          );
          // setWorkbook(workbook);
        }}
      />
      file info: {file?.name}
      <div
        dangerouslySetInnerHTML={{
          __html: table,
        }}
      />
    </div>
  );
}
