/**
 * Tabela Pitagórica para conversão de letras em números
 */
const PITAGORICA = {
  'A': 1, 'J': 1, 'S': 1,
  'B': 2, 'K': 2, 'T': 2,
  'C': 3, 'L': 3, 'U': 3,
  'D': 4, 'M': 4, 'V': 4,
  'E': 5, 'N': 5, 'W': 5,
  'F': 6, 'O': 6, 'X': 6,
  'G': 7, 'P': 7, 'Y': 7,
  'H': 8, 'Q': 8, 'Z': 8,
  'I': 9, 'R': 9
};

const VOGAIS = ['A', 'E', 'I', 'O', 'U'];

/**
 * Reduz um número somando seus dígitos até restar 1-9, ou Números Mestres (11, 22, 33)
 */
function reduzirNumero(num, manterMestres = true) {
  let n = Math.abs(num);
  if (manterMestres && (n === 11 || n === 22 || n === 33)) return n;
  
  while (n > 9) {
    n = n.toString().split('').reduce((acc, curr) => acc + parseInt(curr), 0);
    if (manterMestres && (n === 11 || n === 22 || n === 33)) break;
  }
  return n;
}

/**
 * Converte uma string em valor numérico usando a Tabela Pitagórica
 */
function calcularValorTexto(texto, filtro = null) {
  const clean = texto.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, "");
  let soma = 0;
  
  for (let char of clean) {
    if (filtro === 'vogais' && !VOGAIS.includes(char)) continue;
    if (filtro === 'consoantes' && VOGAIS.includes(char)) continue;
    
    soma += PITAGORICA[char] || 0;
  }
  
  return reduzirNumero(soma);
}

/**
 * Calcula o Caminho da Vida (Destino) baseado na data de nascimento
 */
function calcularCaminhoDaVida(dataNascimento) {
  const data = new Date(dataNascimento);
  if (isNaN(data.getTime())) return null;
  
  const dia = data.getUTCDate();
  const mes = data.getUTCMonth() + 1;
  const ano = data.getUTCFullYear();
  
  const soma = reduzirNumero(dia) + reduzirNumero(mes) + reduzirNumero(ano);
  return reduzirNumero(soma);
}

/**
 * Gera a interpretação básica de um número
 */
const INTERPRETACOES = {
  caminho_vida: {
    1: { titulo: "Liderança e Independência", teaser: "Seu destino é trilhar caminhos próprios, sendo um pioneiro da sua própria história." },
    2: { titulo: "Diplomacia e Parceria", teaser: "A harmonia e a sensibilidade são suas maiores forças para unir o que está disperso." },
    3: { titulo: "Expressão e Criatividade", teaser: "Sua voz e criatividade são as chaves que abrem os portais do seu sucesso." },
    4: { titulo: "Estabilidade e Trabalho", teaser: "A construção sólida e a disciplina são os alicerces onde sua vida se sustenta." },
    5: { titulo: "Liberdade e Mudança", teaser: "A aventura e a adaptabilidade são o oxigênio que mantém sua chama vital acesa." },
    6: { titulo: "Responsabilidade e Amor", teaser: "Seu caminho é iluminado pelo cuidado com o próximo e pela harmonia no lar." },
    7: { titulo: "Sabedoria e Espiritualidade", teaser: "A busca pelo conhecimento profundo e a conexão com o invisível regem seus passos." },
    8: { titulo: "Poder e Justiça", teaser: "A maestria no mundo material e o equilíbrio do karma são seus grandes desafios." },
    9: { titulo: "Humanitarismo e Conclusão", teaser: "Seu destino é servir ao todo, encerrando ciclos com sabedoria e compaixão." },
    11: { titulo: "Intuição e Iluminação", teaser: "Como um mestre intuitivo, você canaliza luz para inspirar a evolução da humanidade." },
    22: { titulo: "O Grande Construtor", teaser: "Sua missão é materializar sonhos elevados em realidades que beneficiam a todos." },
    33: { titulo: "Mestre da Compaixão", teaser: "Seu caminho é a entrega total ao amor incondicional e ao serviço espiritual." }
  }
};

export const numerologyService = {
  getPreview: (nomeCompleto, dataNascimento) => {
    const caminhoVida = calcularCaminhoDaVida(dataNascimento);
    const expressao = calcularValorTexto(nomeCompleto);
    const desejoAlma = calcularValorTexto(nomeCompleto, 'vogais');
    const personalidade = calcularValorTexto(nomeCompleto, 'consoantes');

    return {
      caminho_vida: {
        numero: caminhoVida,
        ...INTERPRETACOES.caminho_vida[caminhoVida]
      },
      expressao: { numero: expressao },
      desejo_alma: { numero: desejoAlma },
      personalidade: { numero: personalidade }
    };
  }
};
