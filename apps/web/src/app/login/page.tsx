import { Box, Heading, Text } from '@chakra-ui/react'
import { FormularioDeLogin } from '@/features/auth/components/FormularioDeLogin.tsx'

export default function PaginaDeLogin() {
  return (
    <Box maxW="sm" mx="auto" mt="20" p="8" borderWidth="1px" borderRadius="lg">
      <Heading size="lg">Entrar</Heading>
      <Text color="fg.muted" mb="6">
        Use o usuário e a senha da academia.
      </Text>
      <FormularioDeLogin />
    </Box>
  )
}
