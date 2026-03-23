const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function createRechargePreference({ packageId, minutes, amount, customerEmail }) {
  await wait(700)

  return {
    preferenceId: `pref_${packageId}_${Date.now()}`,
    initPoint: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${packageId}_${Date.now()}`,
    amount,
    minutes,
    customerEmail,
    status: 'approved',
  }
}
