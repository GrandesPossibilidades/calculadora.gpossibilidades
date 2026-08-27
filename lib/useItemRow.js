"use client";

import { useEffect, useRef, useState } from "react";
import { computeItem, margemCores, somaOutrosCustos, COMISSAO_MINIMA } from "@/lib/calc";

export const OUTROS = "__outros__";

// Fecha um popover quando o usuário clica fora tanto do ícone que abre quanto
// do próprio painel (que vive num portal em document.body, fora da árvore do
// ícone). Sem isso, só clicar de novo no ícone fechava — se o usuário saísse
// da tela sem clicar de novo, o popover ficava aberto pra sempre.
function useFecharAoClicarFora(aberto, fechar, ...refs) {
  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e) {
      const dentro = refs.some((ref) => ref.current && ref.current.contains(e.target));
      if (!dentro) fechar();
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto, fechar, ...refs]);
}

// Estado e handlers de um item de orçamento, compartilhados entre a linha da
// tabela (desktop, ItemRow.js) e o cartão (mobile, ItemCardMobile.js) — a
// lógica de negócio (cascata de cálculo, popovers) vive só aqui, uma vez.
export default function useItemRow({ item, onChange, fornecedores, aoCadastrarFornecedor }) {
  const r = computeItem(item);
  const cor = margemCores(r.margemPct);
  const comissaoBaixa = r.comissaoValor < COMISSAO_MINIMA;
  const referencias = item.referencias || [];
  const outrosCustosItens = item.outrosCustosItens || [];

  const [outrosAtivo, setOutrosAtivo] = useState(
    Boolean(item.fornecedor) && !fornecedores.includes(item.fornecedor)
  );

  const iconRef = useRef(null);
  const popoverRef = useRef(null);
  const [refAberta, setRefAberta] = useState(false);
  const [popoverPos, setPopoverPos] = useState(null);
  const [novaRef, setNovaRef] = useState("");

  const custoIconRef = useRef(null);
  const custoPopoverRef = useRef(null);
  const [custoAberto, setCustoAberto] = useState(false);
  const [custoPopoverPos, setCustoPopoverPos] = useState(null);

  function set(field, value) {
    const isTexto = field === "nome" || field === "fornecedor";
    onChange({ ...item, [field]: isTexto ? value : parseFloat(value) || 0 });
  }

  function adicionarCustoItem() {
    onChange({ ...item, outrosCustosItens: [...outrosCustosItens, { descricao: "", valor: 0 }] });
  }

  function removerCustoItem(index) {
    onChange({ ...item, outrosCustosItens: outrosCustosItens.filter((_, i) => i !== index) });
  }

  function atualizarCustoItem(index, campo, valor) {
    const novaLista = outrosCustosItens.map((it, i) =>
      i === index ? { ...it, [campo]: campo === "valor" ? parseFloat(valor) || 0 : valor } : it
    );
    onChange({ ...item, outrosCustosItens: novaLista });
  }

  function selecionarFornecedor(valor) {
    if (valor === OUTROS) {
      setOutrosAtivo(true);
      set("fornecedor", "");
    } else {
      setOutrosAtivo(false);
      set("fornecedor", valor);
    }
  }

  function confirmarNovoFornecedor(e) {
    const nome = e.target.value.trim();
    if (nome) aoCadastrarFornecedor(nome);
  }

  function adicionarReferencia() {
    const v = novaRef.trim();
    if (!v) return;
    onChange({ ...item, referencias: [...referencias, v] });
    setNovaRef("");
  }

  function removerReferencia(i) {
    onChange({ ...item, referencias: referencias.filter((_, idx) => idx !== i) });
  }

  // Margem líquida do item == valor da comissão (é assim que a cascata é definida:
  // tudo que sobra depois de custo/comissão/outros custos/imposto é exatamente a
  // comissão da GP). A comissão incide só sobre o custo do material — "outros
  // custos" é repasse puro, não entra nessa base.
  function setMargemDesejada(valor) {
    const novaMargem = parseFloat(valor) || 0;
    const custoTotal = (item.custoUnit || 0) * (item.quantidade || 0);
    const novaComissaoPct = custoTotal > 0 ? Math.round((novaMargem / custoTotal) * 100 * 10000) / 10000 : 0;
    onChange({ ...item, comissaoPct: novaComissaoPct });
  }

  function resolverComissaoPorPrecoTotal(precoVendaTotalDesejado) {
    const custoTotal = (item.custoUnit || 0) * (item.quantidade || 0);
    if (custoTotal <= 0) return 0;
    const outrosCustos = somaOutrosCustos(outrosCustosItens);
    // Imposto é "por dentro" (% do preço final) — pra achar o valor antes do
    // imposto, tira o imposto embutido em vez de dividir por (1 + %).
    const antesImposto = precoVendaTotalDesejado * (1 - (item.impostoPct || 0) / 100);
    const comissaoValor = antesImposto - custoTotal - outrosCustos;
    return Math.round((comissaoValor / custoTotal) * 100 * 10000) / 10000;
  }

  function setPrecoUnitarioDesejado(valor) {
    const novoUnitario = parseFloat(valor) || 0;
    const novoTotal = novoUnitario * (item.quantidade || 0);
    onChange({ ...item, comissaoPct: resolverComissaoPorPrecoTotal(novoTotal) });
  }

  function setPrecoTotalDesejado(valor) {
    const novoTotal = parseFloat(valor) || 0;
    onChange({ ...item, comissaoPct: resolverComissaoPorPrecoTotal(novoTotal) });
  }

  function alternarPopoverRef() {
    setRefAberta((aberto) => {
      const novoAberto = !aberto;
      if (novoAberto && iconRef.current) {
        const rect = iconRef.current.getBoundingClientRect();
        setPopoverPos({ top: rect.bottom + 4, left: rect.left });
      }
      return novoAberto;
    });
  }

  function fecharPopoverRef() {
    setRefAberta(false);
  }

  function alternarPopoverCusto() {
    setCustoAberto((aberto) => {
      const novoAberto = !aberto;
      if (novoAberto && custoIconRef.current) {
        const rect = custoIconRef.current.getBoundingClientRect();
        setCustoPopoverPos({ top: rect.bottom + 4, left: rect.left });
      }
      return novoAberto;
    });
  }

  function fecharPopoverCusto() {
    setCustoAberto(false);
  }

  useFecharAoClicarFora(refAberta, fecharPopoverRef, iconRef, popoverRef);
  useFecharAoClicarFora(custoAberto, fecharPopoverCusto, custoIconRef, custoPopoverRef);

  return {
    r,
    cor,
    comissaoBaixa,
    referencias,
    outrosCustosItens,
    outrosAtivo,
    set,
    selecionarFornecedor,
    confirmarNovoFornecedor,
    novaRef,
    setNovaRef,
    adicionarReferencia,
    removerReferencia,
    adicionarCustoItem,
    removerCustoItem,
    atualizarCustoItem,
    setMargemDesejada,
    setPrecoUnitarioDesejado,
    setPrecoTotalDesejado,
    iconRef,
    popoverRef,
    refAberta,
    popoverPos,
    alternarPopoverRef,
    fecharPopoverRef,
    custoIconRef,
    custoPopoverRef,
    custoAberto,
    custoPopoverPos,
    alternarPopoverCusto,
  };
}
