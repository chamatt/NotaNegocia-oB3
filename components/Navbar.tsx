import React from "react";
import {
  Flex,
  Text,
  Box,
  Button,
  Icon,
  useColorMode,
  Link,
} from "@chakra-ui/react";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi";
import NextLink from "next/link";

function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Flex w="100%" h={50} borderBottomWidth="1px" justify="center">
      <Flex
        w="100%"
        maxW="xl"
        justify="space-between"
        align="center"
        px={[8, 0, 0, 0]}
        py={[4, 0, 0, 0]}
      >
        <Box flex={2}>
          <NextLink href="/">
            <Link>
              <Text fontWeight="bold">Declaração de Renda Variável</Text>
            </Link>
          </NextLink>
        </Box>
        <Flex flex={1} justify="flex-end" alignItems="center">
          <NextLink href="/faq">
            <Link>FAQ</Link>
          </NextLink>

          <Button size="sm" onClick={toggleColorMode} variant="ghost">
            {colorMode === "light" ? (
              <HiOutlineMoon size="20" />
            ) : (
              <HiOutlineSun size="20" />
            )}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default Navbar;
