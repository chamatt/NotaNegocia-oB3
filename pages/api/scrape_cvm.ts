// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import cheerio from "cheerio";
var https = require("https");
var iconv = require("iconv-lite");

function retrieve(url, callback) {
  https.get(url, function (res) {
    res.pipe(iconv.decodeStream("win1252")).collect(callback);
  });
}

const convertHTMLTableToJSON = (dataResponse) => {
  const $ = cheerio.load(dataResponse);
  const table = $("table");
  const rows = table.find("tr");
  const data = [];

  console.log(rows);

  rows.each((i, row) => {
    const cols = $(row).find("td");
    const colsArray = [];
    cols.each((i, col) => {
      colsArray.push($(col).text());
    });
    data.push(colsArray);
  });

  console.log(data);
  return data;
};

const formatCNPJ = (cnpj: string) => {
  if (cnpj?.length !== 14) return cnpj;
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

const processData = (data: Array<[string, string]>) => {
  const removeDanglingFirstNumber = (str: string) => str.slice(1);

  return data.map(([cnpj, name]) => {
    return {
      cnpj: formatCNPJ(
        cnpj?.length === 15 ? removeDanglingFirstNumber(cnpj) : cnpj
      ),
      name,
    };
  });
};

export default (req, res) => {
  const url = "https://sistemas.cvm.gov.br/asp/cvmwww/InvNRes/tabecus.asp";
  retrieve(url, function (err, data) {
    const resultData = convertHTMLTableToJSON(data);
    res.setHeader("Cache-Control", "s-maxage=86400");
    res.status(200).json(processData(resultData));
  });
};
