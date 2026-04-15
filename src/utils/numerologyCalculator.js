// Mapeamento pitagórico: A=1, B=2, C=3, ... I=9, J=1, K=2, ... Z=8
const letterValues = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
}

const vowels = new Set(['A', 'E', 'I', 'O', 'U'])

// Reduz um número a um dígito único (exceto números mestres 11, 22, 33)
export function reduceToSingleDigit(num) {
  if (num === 0) return 0
  
  // Números mestres
  if (num === 11 || num === 22 || num === 33) return num
  
  while (num >= 10) {
    num = Math.floor(num / 10) + (num % 10)
  }
  
  return num
}

// Calcula o Número de Destino a partir da data de nascimento
export function calculateNumeroDestino(dataBirthString) {
  // Formato esperado: YYYY-MM-DD
  if (!dataBirthString) return null
  
  const [year, month, day] = dataBirthString.split('-').map(Number)
  
  // Soma todos os dígitos da data
  const totalSum = year + month + day
  
  return reduceToSingleDigit(totalSum)
}

// Calcula o Número de Expressão (todas as letras do nome)
export function calculateNumeroExpression(nome) {
  if (!nome) return null
  
  let sum = 0
  for (const char of nome.toUpperCase()) {
    if (letterValues[char]) {
      sum += letterValues[char]
    }
  }
  
  return reduceToSingleDigit(sum)
}

// Calcula o Número de Motivação (apenas vogais)
export function calculateNumeroMotivacao(nome) {
  if (!nome) return null
  
  let sum = 0
  for (const char of nome.toUpperCase()) {
    if (vowels.has(char) && letterValues[char]) {
      sum += letterValues[char]
    }
  }
  
  return reduceToSingleDigit(sum)
}

// Calcula o Número de Impressão (apenas consoantes)
export function calculateNumeroImpressao(nome) {
  if (!nome) return null
  
  let sum = 0
  for (const char of nome.toUpperCase()) {
    if (!vowels.has(char) && letterValues[char]) {
      sum += letterValues[char]
    }
  }
  
  return reduceToSingleDigit(sum)
}

// Calcula o Número de Caminho de Vida (Destino)
export function calculateCaminhoVida(dataBirthString) {
  return calculateNumeroDestino(dataBirthString)
}

// Retorna todos os números pitagóricos
export function calculateAllNumerologyNumbers(nomeCompleto, dataNascimento) {
  return {
    caminhoVida: calculateCaminhoVida(dataNascimento),
    destino: calculateNumeroDestino(dataNascimento),
    expressao: calculateNumeroExpression(nomeCompleto),
    motivacao: calculateNumeroMotivacao(nomeCompleto),
    impressao: calculateNumeroImpressao(nomeCompleto)
  }
}
