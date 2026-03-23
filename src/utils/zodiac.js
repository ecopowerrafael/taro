const zodiacRanges = [
  { sign: 'Capricórnio', start: [12, 22], end: [1, 19] },
  { sign: 'Aquário', start: [1, 20], end: [2, 18] },
  { sign: 'Peixes', start: [2, 19], end: [3, 20] },
  { sign: 'Áries', start: [3, 21], end: [4, 19] },
  { sign: 'Touro', start: [4, 20], end: [5, 20] },
  { sign: 'Gêmeos', start: [5, 21], end: [6, 20] },
  { sign: 'Câncer', start: [6, 21], end: [7, 22] },
  { sign: 'Leão', start: [7, 23], end: [8, 22] },
  { sign: 'Virgem', start: [8, 23], end: [9, 22] },
  { sign: 'Libra', start: [9, 23], end: [10, 22] },
  { sign: 'Escorpião', start: [10, 23], end: [11, 21] },
  { sign: 'Sagitário', start: [11, 22], end: [12, 21] },
]

const isDateInRange = (month, day, start, end) => {
  const [startMonth, startDay] = start
  const [endMonth, endDay] = end

  if (startMonth > endMonth) {
    return (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay) ||
      month > startMonth ||
      month < endMonth
    )
  }

  return (
    (month === startMonth && day >= startDay) ||
    (month === endMonth && day <= endDay) ||
    (month > startMonth && month < endMonth)
  )
}

export const getZodiacSign = (dateString) => {
  if (!dateString) {
    return null
  }

  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const month = date.getMonth() + 1
  const day = date.getDate()

  const range = zodiacRanges.find(({ start, end }) =>
    isDateInRange(month, day, start, end),
  )

  return range?.sign ?? null
}
