// Interpretações místicas dos números pitagóricos em cada aspecto
export const numerologyInterpretations = {
  destino: {
    1: 'Líder nato, criador de destinos. Você é chamado a iniciar caminhos, ser pioneiro e trazer inovação ao mundo.',
    2: 'Diplomata do universo. Seu propósito é harmonizar, conectar almas e trazer equilíbrio onde há conflito.',
    3: 'Criativo e expressivo. Seu destino é compartilhar sua criatividade, inspirar através da comunicação e da arte.',
    4: 'Construtor celestial. Você foi enviado para criar bases sólidas, estrutura e estabilidade para gerações.',
    5: 'Libertador de almas. Seu caminho é trazer liberdade, transformação e mudança benéfica ao mundo.',
    6: 'Guardião do amor. Você é destinado a servir, cuidar e trazer harmonia através do amor incondicional.',
    7: 'Buscador de verdades. Seu propósito é investigar os mistérios da vida e compartilhar sabedoria espiritual.',
    8: 'Manifestador de abundância. Você está aqui para criar riqueza material e espiritual, equilibrando poder e integridade.',
    9: 'Sábio universal. Seu destino é evoluir continuamente e guiar a humanidade com compaixão e entendimento.',
    11: 'Iluminado visionário. Você carrega uma vibração rara, conectando dimensões e trazendo inspiração elevada.',
    22: 'Mestre construtor. Seu destino extraordinário é manifestar grandes sonhos em realidades transformadoras.',
    33: 'Mestre compassivo. Você encarna o mais alto nível de amor e sabedoria para servir a humanidade.'
  },
  expressao: {
    1: 'Sua energia é independente e assertiva. Você se expressa com confiança, liderança natural e originalidade.',
    2: 'Sua expressão é sensível e diplomática. Você se comunica com delicadeza, intuição e empatia profunda.',
    3: 'Sua criatividade transborda. Você se expressa com humor, vivacidade e uma comunicação magnética.',
    4: 'Sua expressão é prática e directa. Você fala com responsabilidade, trabalho focado e confiabilidade.',
    5: 'Sua expressão é versátil e dinâmica. Você se comunica com flexibilidade, adaptabilidade e liberdade.',
    6: 'Sua expressão é amorosa e protetora. Você se expressa cuidando, apoiando e trazendo harmonia aos outros.',
    7: 'Sua expressão é introspectiva e profunda. Você fala com análise, sabedoria intuitiva e mistério.',
    8: 'Sua expressão é poderosa e persuasiva. Você se comunica com autoridade, visão económica e magnetismo.',
    9: 'Sua expressão é universal e compassiva. Você fala com sabedoria, perdão e visão humanitária.',
    11: 'Sua expressão é inspirada e elevada. Você canaliza frequências superiores através de uma comunicação iluminada.',
    22: 'Sua expressão é profoundamente criativa em escala macro. Você manifesta ideias revolucionárias com maestria.',
    33: 'Sua expressão é pura compaixão encarnada. Você inspira através da verdade amorosa e sabedoria sagrada.'
  },
  motivacao: {
    1: 'Você é impulsionado pela ambição e pelo desejo de conquistar, liderar e deixar sua marca.',
    2: 'Você deseja profundamente paz, parcerias significativas e conexões emocionais verdadeiras.',
    3: 'Você é motivado pela alegria, criação e pela necessidade de se expressar livremente.',
    4: 'Você anseia por estabilidade, segurança e pela satisfação do trabalho bem feito.',
    5: 'Você é impulsionado pela liberdade, experiências novas e pela exploração da vida.',
    6: 'Seu coração é motivado pelo cuidado, responsabilidade com aqueles que ama e criar harmonia familiar.',
    7: 'Você é movido pela busca de verdade, conhecimento espiritual e compreensão profunda.',
    8: 'Você é impulsionado por sucesso material, poder, reconhecimento e realização de objetivos grandiosos.',
    9: 'Você é motivado pela compaixão universal, contribuição ao bem maior e evolução espiritual.',
    11: 'Você é impulsionado por ideais elevados, espiritualidade e pela visão de um mundo melhor.',
    22: 'Você é movido pela vontade de criar fenômenos extraordinários que beneficiem a coletividade.',
    33: 'Seu impulso mais profundo é servir a humanidade com amor incondicional e sacrifício sagrado.'
  },
  impressao: {
    1: 'Os outros te veem como forte, independente e naturalmente líder. Uma presença que inspira confiança.',
    2: 'Você é percebido como gentil, empático e confiável. As pessoas sentem-se seguras em sua presença.',
    3: 'Os outros te veem como alegre, criativo e socialmente magnético. Uma energia que anima o ambiente.',
    4: 'Você é visto como confiável, responsável e alguém em quem se pode contar. Sólido e seguro.',
    5: 'Os outros te percebem como dinâmico, livre-espírito e aventureiro. Interessante e imprevisível.',
    6: 'Você é visto como amoroso, protetor e preocupado com o bem-estar dos outros. Um cuidador natural.',
    7: 'Os outros te percebem como misterioso, inteligente e espiritualmente profundo. Enigmático e sábio.',
    8: 'Você é visto como poderoso, confiante e bem-sucedido. Uma presença que comanda respeito.',
    9: 'Os outros te veem como sábio, compassivo e universalmente acessível. Um irmão de toda a humanidade.',
    11: 'Você é percebido como elevado, inspirador e tocado pelo divino. Uma aura de espiritualidade.',
    22: 'Os outros te veem como excepcional e capaz de realizar o impossível. Um mestre encarnado.',
    33: 'Você é visto como sagrado, amoroso e profundamente sábio. Uma presença que toca almas.'
  }
}

// Retorna a interpretação de um número em um aspecto específico
export function getInterpretation(aspect, number) {
  if (numerologyInterpretations[aspect] && numerologyInterpretations[aspect][number]) {
    return numerologyInterpretations[aspect][number]
  }
  return 'Número misterioso que aguarda revelação...'
}
