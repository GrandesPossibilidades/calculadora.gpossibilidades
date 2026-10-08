// Converte uma linha de orcamento_itens (banco) pro formato usado no app.
// Orçamentos salvos antes da lista de "outros custos" tinham frete e outros
// custos como dois campos numéricos fixos + uma nota de texto solta. Se o
// item não tem nada na lista nova mas tem valor num desses campos antigos,
// reconstrói como entradas da lista — assim nada do histórico some quando
// reabre um orçamento antigo.
export function mapItemRow(row) {
  const itensSalvos = row.outros_custos_itens;
  let outrosCustosItens = Array.isArray(itensSalvos) ? itensSalvos : [];

  if (outrosCustosItens.length === 0) {
    const migrados = [];
    if (Number(row.frete) > 0) {
      migrados.push({ descricao: "Frete", valor: Number(row.frete) });
    }
    if (Number(row.outros_custos) > 0) {
      migrados.push({ descricao: row.notas_internas?.trim() || "Outros custos", valor: Number(row.outros_custos) });
    }
    outrosCustosItens = migrados;
  }

  return {
    nome: row.nome,
    fornecedor: row.fornecedor || "",
    referencias: row.referencias || [],
    custoUnit: Number(row.custo_unit),
    quantidade: Number(row.quantidade),
    outrosCustosItens,
    incluido: row.incluido !== false,
    comissaoPct: Number(row.comissao_pct),
    impostoPct: Number(row.imposto_pct),
  };
}
