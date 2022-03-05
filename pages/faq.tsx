import { Box, Flex, Link, Text } from "@chakra-ui/react";
import Image from "next/image";
import Navbar from "../components/Navbar";
import extrato from "../images/extrato.png";
import negociacao from "../images/negociacao.png";
import filtrar from "../images/filtrar.png";
import filtrando from "../images/filtrando.png";
import downloadExtrato from "../images/download-extrato.png";
import excelDownload from "../images/excel.png";
import downloadedFile from "../images/downloaded-file.png";
import NextLink from "next/link";
import { IoChevronBack } from "react-icons/io5";

const BackToHome = () => (
  <NextLink href="/">
    <Link>
      <Text fontWeight="bold">
        <Flex alignItems="center">
          <IoChevronBack /> Voltar a página inicial
        </Flex>
      </Text>
    </Link>
  </NextLink>
);

export default () => {
  const ArrowRight = <Text>→</Text>;
  return (
    <Flex flex="1" direction="column" alignItems="center" w="full">
      <Navbar />
      <Flex mt="8" justify="start" w="100%" maxW="xl" padding={["4", 0, 0, 0]}>
        <BackToHome />
      </Flex>

      <Flex
        w="100%"
        maxW="xl"
        direction="column"
        padding={["4", 0, 0, 0]}
        mt="10"
      >
        <Box mb="8">
          <Text fontSize="lg">
            <Text fontWeight="bold">Disclamer: </Text>Nenhum dado seu é enviado
            para nenhum servidor, todos os dados são processados localmente no
            seu próprio navegador.
          </Text>
        </Box>

        <Text fontSize="3xl" textTransform="uppercase">
          Como baixar a nota de negociação de 2021?
        </Text>
        <Text fontSize="sm">
          Para baixar a nota de movimentação de 2021, acesse o{" "}
          <Link
            target="_blank"
            href="https://www.investidor.b3.com.br/"
            fontWeight="bold"
          >
            <Text as="span" color="blue.500">
              Portal do Investidor
            </Text>
          </Link>{" "}
          e faça o login. Caso não possua conta, cria uma nova.
          <br />
          <br />
          <Box>
            Após isso vá até{" "}
            <Text as="span" fontWeight="bold">
              Extratos
            </Text>
            <Box>
              <Image src={extrato} />
            </Box>
          </Box>
          <Box>
            Aba{" "}
            <Text as="span" fontWeight="bold">
              Negociação
            </Text>{" "}
            <Box>
              <Image src={negociacao} />
            </Box>
          </Box>
          <Box>
            Clique em{" "}
            <Text as="span" fontWeight="bold">
              Filtrar
            </Text>{" "}
            <Box>
              <Image src={filtrar} />
            </Box>
          </Box>
          <Box>
            Preencha os campos de data{" "}
            <Text as="span" fontWeight="bold">
              (01/01/2021 à 31/12/2021).
            </Text>{" "}
            E confirme clicando no botão laranja "Filtrar".
            <Box>
              <Image src={filtrando} />
            </Box>
          </Box>
          <Box>
            Clique no botão laranja no canto inferior direito da tela
            <Box>
              <Image src={downloadExtrato} />
            </Box>
          </Box>
          <Box>
            Baixe o arquivo em{" "}
            <Text as="span" fontWeight="bold">
              EXCEL
            </Text>{" "}
            <Box>
              <Image src={excelDownload} />
            </Box>
          </Box>
          <Box>
            Pronto, agora já tem o arquivo baixado. Volte para a página inicial
            do nosso site e arraste o arquivo para o local indicado.{" "}
            <Box>
              <Image src={downloadedFile} />
            </Box>
          </Box>
          <Box py="16">
            <BackToHome />
          </Box>
        </Text>
      </Flex>
    </Flex>
  );
};
