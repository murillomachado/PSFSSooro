import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

/** O índigo e o laranja da Sooro, com tons para o tema claro e o escuro. */
const BRAND = {
  50: { value: '#f4f2fa' },
  100: { value: '#e9e6f6' },
  200: { value: '#d9d6ec' },
  300: { value: '#b4acdf' },
  400: { value: '#8f84d0' },
  500: { value: '#6a5dbd' },
  600: { value: '#4d3fa3' },
  700: { value: '#372b85' },
  800: { value: '#271d6b' },
  900: { value: '#1c1458' },
  950: { value: '#110b38' },
}

const claroEEscuro = (claro: string, escuro: string) => ({ value: { base: claro, _dark: escuro } })

const FONTE = 'var(--font-poppins), "Segoe UI", system-ui, sans-serif'

const configuracao = defineConfig({
  globalCss: {
    // Todos os componentes usam a cor da marca, salvo quando pedem outra (as etiquetas do IMC, por exemplo).
    html: { colorPalette: 'brand' },
    body: { bg: 'bg.canvas', color: 'fg' },
  },
  theme: {
    tokens: {
      colors: { brand: BRAND, laranja: { 400: { value: '#ff8a3d' }, 500: { value: '#ff6503' } } },
      fonts: { heading: { value: FONTE }, body: { value: FONTE } },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: claroEEscuro('{colors.brand.900}', '{colors.brand.400}'),
          contrast: claroEEscuro('white', '{colors.brand.950}'),
          fg: claroEEscuro('{colors.brand.800}', '{colors.brand.300}'),
          muted: claroEEscuro('{colors.brand.100}', '{colors.brand.800}'),
          subtle: claroEEscuro('{colors.brand.50}', '{colors.brand.900}'),
          emphasized: claroEEscuro('{colors.brand.200}', '{colors.brand.700}'),
          focusRing: claroEEscuro('{colors.brand.600}', '{colors.brand.400}'),
          border: claroEEscuro('{colors.brand.300}', '{colors.brand.600}'),
        },
        /** O laranja é só acento (marcadores e detalhes), nunca cor de dado: a faixa Obesidade I já é laranja. */
        acento: claroEEscuro('{colors.laranja.500}', '{colors.laranja.400}'),
        bg: {
          canvas: claroEEscuro('#f4f2fa', '#0d0e14'),
          panel: claroEEscuro('white', '#15161f'),
        },
        border: { DEFAULT: claroEEscuro('#d9d6ec', '#262838') },
      },
    },
  },
})

export const sistema = createSystem(defaultConfig, configuracao)
