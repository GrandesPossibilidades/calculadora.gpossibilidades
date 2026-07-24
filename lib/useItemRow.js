"use client";

import { useRef, useState } from "react";
import { computeItem, margemCores, COMISSAO_MINIMA } from "@/lib/calc";

export const OUTROS = "__outros__";

// Estado e handlers de um item de orçamento, compartilhados entre a linha da
// tabela (desktop, ItemRow.js) e o cartão (mobile, ItemCardMobile.js) — a
// lógica de negócio (cascata de cálculo, popovers) vive só aqui, uma vez.
export default function useItemRow({ item, onChange, fornecedores, aoCadastrarFornecedor }) {
  const r = computeItem(item);
  const cor = margemCores(r.margemPct);
  const comissaoBaixa = r.comissaoValor < COMISSAO_MINIMA;
  const referencias = item.referencias || [];

  const [outrosAtivo, setOutrosAtivo] = useState(
    Boolean(item.fornecedor) && !fornecedores.includes(item.fornecedor)
  );

  const iconRef = useRef(null);
  const [refAberta, setRefAberta] = useState(false);
  const [refPinada, setRefPinada] = useState(false);
  const [popoverPos, setPopoverPos] = useState(null);
  const [novaRef, setNovaRef] = useState("");

  const custoIconRef = useRef(null);
  const [custoAberto, setCustoAberto] = useState(false);
  const [custoPinado, setCustoPinado] = useState(false);
  const [custoPopoverPos, setCustoPopoverPos] = useState(null);

  function set(field, value) {
    const isTexto = field === "nome" || field === "fornecedor" || field === "notasInternas";
    onChange({ ...item, [field]: isTexto ? value : parseFloat(value) || 0 });
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
    setRefAberta(false);
    setRefPinada(false);
  }

  function removerReferencia(i) {
    onChange({ ...item, referencias: referencias.filter((_, idx) => idx !== i) });
  }

  // Margem líquida do item == valor da comissão (é assim que a cascata é definida:
  // tudo que sobra depois de custo/frete/outros/imposto é exatamente a comissão da GP).
  function setMargemDesejada(valor) {
    const novaMargem = parseFloat(valor) || 0;
    const base = (item.custoUnit || 0) * (item.quantidade || 0) + (item.frete || 0) + (item.outrosCustos || 0);
    const novaComissaoPct = base > 0 ? Math.round((novaMargem / base) * 100 * 10000) / 10000 : 0;
    onChange({ ...item, comissaoPct: novaComissaoPct });
  }

  function resolverComissaoPorPrecoTotal(precoVendaTotalDesejado) {
    const base = (item.custoUnit || 0) * (item.quantidade || 0) + (item.frete || 0) + (item.outrosCustos || 0);
    if (base <= 0) return 0;
    const aposComissao = precoVendaTotalDesejado / (1 + (item.impostoPct || 0) / 100);
    return Math.round((aposComissao / base - 1) * 100 * 10000) / 10000;
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

  function atualizarPosicaoPopover() {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 4, left: rect.left });
    }
  }

  function abrirPopover() {
    if (!refPinada) {
      atualizarPosicaoPopover();
      setRefAberta(true);
    }
  }

  function fecharPopover() {
    if (!refPinada) setRefAberta(false);
  }

  function alternarPin() {
    const novoPin = !refPinada;
    if (novoPin) atualizarPosicaoPopover();
    setRefPinada(novoPin);
    setRefAberta(novoPin);
  }

  function atualizarPosicaoCustoPopover() {
    if (custoIconRef.current) {
      const rect = custoIconRef.current.getBoundingClientRect();
      setCustoPopoverPos({ top: rect.bottom + 4, left: rect.left });
    }
  }

  function abrirCustoPopover() {
    if (!custoPinado) {
      atualizarPosicaoCustoPopover();
      setCustoAberto(true);
    }
  }

  function fecharCustoPopover() {
    if (!custoPinado) setCustoAberto(false);
  }

  function alternarCustoPin() {
    const novoPin = !custoPinado;
    if (novoPin) atualizarPosicaoCustoPopover();
    setCustoPinado(novoPin);
    setCustoAberto(novoPin);
  }

  return {
    r,
    cor,
    comissaoBaixa,
    referencias,
    outrosAtivo,
    set,
    selecionarFornecedor,
    confirmarNovoFornecedor,
    novaRef,
    setNovaRef,
    adicionarReferencia,
    removerReferencia,
    setMargemDesejada,
    setPrecoUnitarioDesejado,
    setPrecoTotalDesejado,
    iconRef,
    refAberta,
    popoverPos,
    abrirPopover,
    fecharPopover,
    alternarPin,
    custoIconRef,
    custoAberto,
    custoPopoverPos,
    abrirCustoPopover,
    fecharCustoPopover,
    alternarCustoPin,
  };
}
