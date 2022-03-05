import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Center, useColorModeValue, Icon } from "@chakra-ui/react";
import { AiFillFileAdd } from "react-icons/ai";

export default function Dropzone({
  onFileAccepted,
  acceptedTypes,
  file,
  textHints = {
    inactive: "Arraste o arquivo aqui...",
    active: "Solte o arquivo aqui ou clique para selecionar",
  },
}) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      onFileAccepted(acceptedFiles[0]);
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxFiles: 1,
    multiple: false,
  });

  const dropText = file
    ? file.name
    : isDragActive
    ? textHints.inactive
    : textHints.active;

  const fileUploadedBg = useColorModeValue("gray.100", "gray.700");
  const activeBg = useColorModeValue("gray.100", "gray.600");
  const borderColor = useColorModeValue(
    file ? "green.300" : isDragActive ? "teal.300" : "gray.300",
    file ? "green.500" : isDragActive ? "teal.500" : "gray.500"
  );

  return (
    <Center
      p={10}
      cursor="pointer"
      bg={file ? fileUploadedBg : isDragActive ? activeBg : "transparent"}
      _hover={{ bg: activeBg }}
      transition="background-color 0.2s ease"
      borderRadius={4}
      border="3px dashed"
      borderColor={borderColor}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <Icon as={AiFillFileAdd} mr={2} />
      <p>{dropText}</p>
    </Center>
  );
}
