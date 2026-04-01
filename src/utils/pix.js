export function generatePixPayload({ key, name, city, amount, description }) {
  const pad = (value) => value.toString().length.toString().padStart(2, '0')

  const sections = [
    { id: '00', value: '01' },
    { id: '01', value: '11' },
    {
      id: '26',
      value: [
        { id: '00', value: 'br.gov.bcb.pix' },
        { id: '01', value: key.replace(/\s/g, '') },
        { id: '02', value: (description || 'Pagamento Astria').substring(0, 25) },
      ],
    },
    { id: '52', value: '0000' },
    { id: '53', value: '986' },
    { id: '54', value: Number(amount || 0).toFixed(2) },
    { id: '58', value: 'BR' },
    {
      id: '59',
      value: name.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(),
    },
    {
      id: '60',
      value: city.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(),
    },
    {
      id: '62',
      value: [{ id: '05', value: '***' }],
    },
  ]

  const build = (id, value) => {
    if (Array.isArray(value)) {
      let nested = ''
      value.forEach((item) => {
        nested += item.id + pad(item.value) + item.value
      })
      return id + pad(nested) + nested
    }

    return id + pad(value) + value
  }

  let payload = ''
  sections.forEach((item) => {
    payload += build(item.id, item.value)
  })

  payload += '6304'

  const crc16ccitt = (data) => {
    let crc = 0xffff
    for (let index = 0; index < data.length; index += 1) {
      crc ^= data.charCodeAt(index) << 8
      for (let offset = 0; offset < 8; offset += 1) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021
        } else {
          crc <<= 1
        }
      }
    }

    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0')
  }

  return payload + crc16ccitt(payload)
}