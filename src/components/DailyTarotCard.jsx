import { useState, useEffect } from 'react'

// Base dos 22 Arcanos Maiores do Tarot
const MAJOR_ARCANA = [
  { name: 'O Louco', message: 'Um novo começo se aproxima. Abrace o desconhecido com coragem e otimismo. É hora de dar um salto de fé.', image: '/tarot/0-fool.jpg' },
  { name: 'O Mago', message: 'Você tem todas as ferramentas necessárias para alcançar seus objetivos. Manifeste sua vontade no mundo.', image: '/tarot/1-magician.jpg' },
  { name: 'A Sacerdotisa', message: 'Ouça sua intuição e confie na sua sabedoria interior. Segredos podem ser revelados hoje.', image: '/tarot/2-high-priestess.jpg' },
  { name: 'A Imperatriz', message: 'Dia de abundância, criatividade e fertilidade. Cuide de si mesmo e daqueles ao seu redor.', image: '/tarot/3-empress.jpg' },
  { name: 'O Imperador', message: 'Momento de assumir a liderança, estabelecer ordem e organizar seus projetos com autoridade e estrutura.', image: '/tarot/4-emperor.jpg' },
  { name: 'O Hierofante', message: 'Busque sabedoria nas tradições. O aprendizado e a orientação espiritual trarão as respostas que procura.', image: '/tarot/5-hierophant.jpg' },
  { name: 'Os Enamorados', message: 'Conexões profundas e escolhas importantes marcam o dia. Siga o caminho que ressoa com seu coração.', image: '/tarot/6-lovers.jpg' },
  { name: 'O Carro', message: 'Avanço e vitória estão no horizonte. Mantenha o foco, supere os obstáculos e tome as rédeas da sua vida.', image: '/tarot/7-chariot.jpg' },
  { name: 'A Força', message: 'Use sua força interior, paciência e compaixão para domar as adversidades, não a força bruta.', image: '/tarot/8-strength.jpg' },
  { name: 'O Eremita', message: 'Tempo de introspecção e reflexão. Afaste-se das distrações externas para encontrar a sua própria luz.', image: '/tarot/9-hermit.jpg' },
  { name: 'A Roda da Fortuna', message: 'Mudanças estão a caminho. O ciclo da vida gira, trazendo sorte e novas oportunidades. Esteja aberto!', image: '/tarot/10-wheel.jpg' },
  { name: 'A Justiça', message: 'As coisas se equilibrarão. Decisões justas e consequências cármicas pautam as energias de hoje.', image: '/tarot/11-justice.jpg' },
  { name: 'O Enforcado (O Pendurado)', message: 'Pausa necessária. Olhe as coisas por uma nova perspectiva. Sacrifícios agora trarão iluminação depois.', image: '/tarot/12-hanged-man.jpg' },
  { name: 'A Morte', message: 'Fim de um ciclo e início de outro. Deixe ir o que não lhe serve mais para abrir espaço para o novo.', image: '/tarot/13-death.jpg' },
  { name: 'A Temperança', message: 'Equilíbrio e moderação são fundamentais hoje. Misture paciência e harmonia em suas ações.', image: '/tarot/14-temperance.jpg' },
  { name: 'O Diabo', message: 'Atenção aos apegos e hábitos tóxicos. Reconheça as correntes que te prendem e encontre a chave para se libertar.', image: '/tarot/15-devil.jpg' },
  { name: 'A Torre', message: 'Estruturas instáveis podem ruir. Não tema as revelações bruscas, pois elas limpam o terreno para a verdade.', image: '/tarot/16-tower.jpg' },
  { name: 'A Estrela', message: 'Esperança, inspiração e renovação. Mantenha a fé, o universo está derramando bênçãos sobre você.', image: '/tarot/17-star.jpg' },
  { name: 'A Lua', message: 'Ilusões podem nublar seu julgamento. Preste atenção aos seus sonhos e navegue com cuidado por sentimentos confusos.', image: '/tarot/18-moon.jpg' },
  { name: 'O Sol', message: 'Clareza, alegria e vitalidade brilham sobre seus projetos. É um dia de sucesso e de revelar sua verdadeira essência.', image: '/tarot/19-sun.jpg' },
  { name: 'O Julgamento (O Aeon)', message: 'Hora de despertar. Você está sendo chamado para um propósito maior. Avalie o passado e siga renovado.', image: '/tarot/20-judgement.jpg' },
  { name: 'O Mundo', message: 'Conclusão bem-sucedida de uma jornada! Celebre suas conquistas e prepare-se para abraçar a totalidade da vida.', image: '/tarot/21-world.jpg' },
]

export function DailyTarotCard() {
  const [isFlipped, setIsFlipped] = useState(false)
  const [dailyCard, setDailyCard] = useState(null)

  useEffect(() => {
    // Verifica se já existe uma carta sorteada hoje no localStorage
    const todayStr = new Date().toISOString().split('T')[0]
    const savedDataStr = localStorage.getItem('astria_daily_card')
    
    if (savedDataStr) {
      try {
        const savedData = JSON.parse(savedDataStr)
        if (savedData.date === todayStr) {
          setDailyCard(savedData.card)
          setIsFlipped(true)
          return
        }
      } catch (e) {
        // ignora e sorteia nova
      }
    }

    // Se não tem ou expirou, prepara uma carta aleatória (mas não vira ainda)
    const randomCard = MAJOR_ARCANA[Math.floor(Math.random() * MAJOR_ARCANA.length)]
    setDailyCard(randomCard)
  }, [])

  const handleFlip = () => {
    if (isFlipped) return // Já foi virada hoje

    const todayStr = new Date().toISOString().split('T')[0]
    
    // Salva no localstorage
    localStorage.setItem('astria_daily_card', JSON.stringify({
      date: todayStr,
      card: dailyCard
    }))
    
    setIsFlipped(true)
  }

  if (!dailyCard) return null

  return (
    <div className="group flex h-48 w-full perspective-1000">
      <div 
        onClick={handleFlip}
        className={`relative h-full w-full transform-style-3d transition-transform duration-700 ease-in-out ${isFlipped ? 'rotate-y-180' : 'cursor-pointer hover:scale-105'}`}
      >
        {/* Frente da carta (Costas/Verso com o desenho da sorte) */}
        <div className="absolute inset-0 backface-hidden rounded-xl border-2 border-mystic-gold/40 bg-gradient-to-br from-mystic-purple via-black to-mystic-gold/20 shadow-glow flex flex-col items-center justify-center p-4 text-center">
          <Sparkles className="text-mystic-goldSoft mb-2 animate-pulse" size={32} />
          <h3 className="font-display text-xl text-mystic-goldSoft">Sua Carta do Dia</h3>
          <p className="text-xs text-amber-100/70 mt-2">Toque para revelar seu conselho cósmico</p>
        </div>

        {/* Verso da carta (Face revelada com a mensagem) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border border-mystic-gold/60 bg-gradient-to-b from-[#1f0f38] to-[#0b0715] p-5 shadow-[0_0_20px_rgba(197,160,89,0.2)] overflow-y-auto custom-scrollbar">
          <div className="flex flex-col h-full justify-center text-center">
            <h4 className="font-display text-2xl text-mystic-goldSoft mb-2">{dailyCard.name}</h4>
            <div className="h-[1px] w-12 bg-mystic-gold/50 mx-auto mb-3"></div>
            <p className="text-sm text-amber-100/90 leading-relaxed italic">
              "{dailyCard.message}"
            </p>
            <p className="text-[10px] text-ethereal-silver/50 mt-4 uppercase tracking-wider">
              Volte amanhã para uma nova carta
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Para usar esse componente, precisaremos injetar algumas classes utilitárias de 3D no tailwind
