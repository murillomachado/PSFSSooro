// Conventional Commits (especificação, seção 5). O hook commit-msg valida cada commit local;
// o CI valida os commits e o título da PR, que vira o commit da main no squash merge.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['api', 'web', 'contracts', 'e2e', 'docs', 'ci', 'deps', 'repo']],
    // O corpo explica o porquê em parágrafos, e o GitHub refaz a quebra das linhas ao exibir.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
}
