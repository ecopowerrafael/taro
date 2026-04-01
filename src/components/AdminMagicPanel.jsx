import { useMemo, useState } from 'react'
import { Check, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'

const emptyForm = {
  id: null,
  title: '',
  shortDescription: '',
  description: '',
  imageUrl: '',
  consultantId: '',
  price: '',
}

export function AdminMagicPanel({
  spells = [],
  consultants = [],
  pendingSpellOrders = [],
  adminSpellOrders = [],
  onSaveSpell,
  onDeleteSpell,
  onSpellOrderAction,
}) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [processingOrderId, setProcessingOrderId] = useState('')

  const sortedSpells = useMemo(
    () => [...spells].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.title.localeCompare(b.title)),
    [spells],
  )

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (file) => {
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, imageUrl: reader.result?.toString() || '' }))
    }
    reader.readAsDataURL(file)
  }

  const resetForm = ({ keepFeedback = false } = {}) => {
    setForm(emptyForm)
    if (!keepFeedback) {
      setFeedback('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFeedback('')

    const result = await onSaveSpell?.({
      ...form,
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      consultantId: form.consultantId,
      price: Number(form.price),
    })

    setSaving(false)

    if (result?.ok) {
      setFeedback(result.message || 'Magia salva com sucesso.')
      resetForm({ keepFeedback: true })
      return
    }

    setFeedback(result?.message || 'Erro ao salvar magia.')
  }

  const startEdit = (spell) => {
    setForm({
      id: spell.id,
      title: spell.title || '',
      shortDescription: spell.shortDescription || '',
      description: spell.description || '',
      imageUrl: spell.imageUrl || '',
      consultantId: spell.consultantId || '',
      price: spell.price?.toString() || '',
    })
    setFeedback('Editando magia existente.')
  }

  const handleDelete = async (spellId) => {
    const confirmed = window.confirm('Remover esta magia da vitrine?')
    if (!confirmed) {
      return
    }

    const result = await onDeleteSpell?.(spellId)
    setFeedback(result?.message || 'Magia removida.')
    if (form.id === spellId) {
      resetForm({ keepFeedback: true })
    }
  }

  const handleOrderAction = async (orderId, action) => {
    setProcessingOrderId(orderId)
    const result = await onSpellOrderAction?.(orderId, action)
    setProcessingOrderId('')
    setFeedback(result?.message || 'Pedido atualizado.')
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl text-mystic-goldSoft">Cadastro de Magias</h3>
              <p className="text-xs text-amber-100/65">Imagem, descrição, consultor responsável e preço do produto.</p>
            </div>
            {form.id && (
              <button
                onClick={resetForm}
                className="rounded-lg border border-mystic-gold/40 px-3 py-1.5 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/10"
              >
                Nova magia
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3">
            <label className="grid gap-1 text-xs text-amber-100/70">
              Título
              <input
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/50"
                placeholder="Ex: Amarração do Amor"
              />
            </label>

            <label className="grid gap-1 text-xs text-amber-100/70">
              Breve descrição
              <input
                value={form.shortDescription}
                onChange={(event) => handleChange('shortDescription', event.target.value)}
                className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/50"
                placeholder="Chamada curta para a vitrine"
              />
            </label>

            <label className="grid gap-1 text-xs text-amber-100/70">
              Descrição completa
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                className="resize-none rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/50"
                placeholder="Explique o que o cliente está contratando e como funciona."
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-xs text-amber-100/70">
                Feita por
                <select
                  value={form.consultantId}
                  onChange={(event) => handleChange('consultantId', event.target.value)}
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/50"
                >
                  <option value="">Selecione o consultor</option>
                  {consultants.map((consultant) => (
                    <option key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-xs text-amber-100/70">
                Preço (R$)
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => handleChange('price', event.target.value)}
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/50"
                  placeholder="0,00"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="grid gap-1 text-xs text-amber-100/70">
                URL da imagem ou base64
                <input
                  value={form.imageUrl}
                  onChange={(event) => handleChange('imageUrl', event.target.value)}
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-amber-50 outline-none focus:ring-2 focus:ring-mystic-gold/50"
                  placeholder="https://..."
                />
              </label>

              <label className="grid gap-1 text-xs text-amber-100/70">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageUpload(event.target.files?.[0])}
                  className="rounded-lg border border-mystic-gold/35 bg-black/35 px-3 py-2 text-xs text-amber-50 file:mr-3 file:rounded-md file:border-0 file:bg-mystic-gold/85 file:px-3 file:py-1 file:text-black"
                />
              </label>
            </div>

            {form.imageUrl && (
              <div className="overflow-hidden rounded-xl border border-mystic-gold/25 bg-black/20">
                <img src={form.imageUrl} alt="Preview da magia" className="h-48 w-full object-cover" />
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition enabled:hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? 'Salvando...' : form.id ? 'Atualizar magia' : 'Criar magia'}
            </button>
          </form>

          {feedback && <p className="mt-3 text-xs text-amber-100/80">{feedback}</p>}
        </section>

        <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-mystic-goldSoft" />
            <div>
              <h3 className="font-display text-xl text-mystic-goldSoft">Pedidos PIX Pendentes</h3>
              <p className="text-xs text-amber-100/65">A comissão só é liberada ao consultor após aprovação do pedido.</p>
            </div>
          </div>

          <div className="grid gap-3">
            {pendingSpellOrders.length === 0 ? (
              <p className="rounded-lg border border-mystic-gold/20 bg-black/30 p-4 text-sm text-ethereal-silver/65">
                Nenhum pedido PIX pendente para magias.
              </p>
            ) : (
              pendingSpellOrders.map((order) => (
                <article key={order.id} className="rounded-lg border border-mystic-gold/20 bg-black/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-amber-50">{order.spellTitle}</p>
                      <p className="text-[11px] text-amber-100/65">Cliente: {order.userName} • {order.userEmail}</p>
                      <p className="text-[11px] text-amber-100/55">Consultor: {order.consultantName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl text-mystic-goldSoft">R$ {Number(order.price).toFixed(2)}</p>
                      <p className="text-[11px] text-emerald-300">Repasse: R$ {Number(order.consultantNetValue).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] text-ethereal-silver/60">
                      Comissão plataforma: {Number(order.commissionRate).toFixed(2)}% • Criado em {new Date(order.createdAt).toLocaleString('pt-BR')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOrderAction(order.id, 'approved')}
                        disabled={processingOrderId === order.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition enabled:hover:bg-emerald-500/20 disabled:opacity-40"
                      >
                        {processingOrderId === order.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleOrderAction(order.id, 'rejected')}
                        disabled={processingOrderId === order.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition enabled:hover:bg-red-500/20 disabled:opacity-40"
                      >
                        <Trash2 size={12} />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
        <h3 className="font-display text-xl text-mystic-goldSoft">Magias publicadas</h3>
        <p className="mt-1 text-xs text-amber-100/65">Lista atual da vitrine de produtos da página de magias.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedSpells.length === 0 ? (
            <p className="rounded-lg border border-mystic-gold/20 bg-black/30 p-4 text-sm text-ethereal-silver/65">
              Nenhuma magia cadastrada ainda.
            </p>
          ) : (
            sortedSpells.map((spell) => (
              <article key={spell.id} className="overflow-hidden rounded-xl border border-mystic-gold/20 bg-black/30">
                <div className="h-40 bg-black/40">
                  {spell.imageUrl ? (
                    <img src={spell.imageUrl} alt={spell.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-ethereal-silver/45">Sem imagem</div>
                  )}
                </div>
                <div className="grid gap-3 p-4">
                  <div>
                    <p className="font-display text-xl text-mystic-goldSoft">{spell.title}</p>
                    <p className="text-xs text-amber-100/65">Feita por {spell.consultantName}</p>
                  </div>
                  <p className="text-sm text-ethereal-silver/80">{spell.shortDescription || spell.description}</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-2xl text-amber-100">R$ {Number(spell.price).toFixed(2)}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(spell)}
                        className="rounded-lg border border-mystic-gold/40 px-3 py-1.5 text-xs text-mystic-goldSoft transition hover:bg-mystic-gold/10"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(spell.id)}
                        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-mystic-gold/30 bg-black/25 p-4">
        <h3 className="font-display text-xl text-mystic-goldSoft">Histórico de pedidos</h3>
        <p className="mt-1 text-xs text-amber-100/65">Todos os pedidos de magias, com método, status e repasse líquido.</p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-mystic-gold/20">
          <table className="min-w-full divide-y divide-mystic-gold/15 text-sm">
            <thead className="bg-black/35">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Pedido</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Cliente</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Consultor</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Método</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Status</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Valor</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Repasse</th>
                <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-amber-100/70">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mystic-gold/10 bg-black/20">
              {adminSpellOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-ethereal-silver/65">
                    Nenhum pedido de magia registrado ainda.
                  </td>
                </tr>
              ) : (
                adminSpellOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-3 py-2 text-amber-50">
                      <p>{order.spellTitle}</p>
                      <p className="text-[11px] text-ethereal-silver/55">{order.id}</p>
                    </td>
                    <td className="px-3 py-2 text-amber-100/80">
                      <p>{order.userName}</p>
                      <p className="text-[11px] text-ethereal-silver/55">{order.userEmail}</p>
                    </td>
                    <td className="px-3 py-2 text-ethereal-silver/85">{order.consultantName}</td>
                    <td className="px-3 py-2 text-ethereal-silver/85 uppercase">{order.method}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-wide ${
                        order.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : order.status === 'pending' || order.status === 'processing' || order.status === 'approved'
                            ? 'bg-amber-500/15 text-amber-200'
                            : 'bg-red-500/15 text-red-300'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-mystic-goldSoft">R$ {Number(order.price).toFixed(2)}</td>
                    <td className="px-3 py-2 text-emerald-300">R$ {Number(order.consultantNetValue).toFixed(2)}</td>
                    <td className="px-3 py-2 text-[12px] text-ethereal-silver/70">{new Date(order.createdAt).toLocaleString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}