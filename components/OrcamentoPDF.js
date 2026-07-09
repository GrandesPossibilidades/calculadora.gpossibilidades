import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import { computeItem, computeTotals, margemCor } from "@/lib/calc";
import { formatMoney, formatMoneyPreciso, formatPct, isUrl, urlHref } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 9, fontFamily: "Helvetica", color: "#1B2A41" },
  header: {
    backgroundColor: "#1B3A6B",
    color: "#fff",
    padding: 14,
    borderRadius: 6,
    marginBottom: 14,
  },
  empresaNome: { fontSize: 14, fontWeight: 700 },
  empresaLinha: { fontSize: 8, marginTop: 2, opacity: 0.9 },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#1B3A6B",
    textTransform: "uppercase",
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8F0",
    paddingBottom: 3,
  },
  row: { flexDirection: "row" },
  th: {
    backgroundColor: "#1B3A6B",
    color: "#fff",
    fontSize: 7.5,
    textTransform: "uppercase",
    padding: 4,
    textAlign: "center",
  },
  td: {
    fontSize: 8,
    padding: 4,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF3",
  },
  totalBox: {
    backgroundColor: "#1B3A6B",
    borderRadius: 6,
    padding: 14,
    marginTop: 10,
    alignItems: "flex-end",
  },
  totalCap: { color: "#fff", fontSize: 9, textTransform: "uppercase", fontWeight: 700, opacity: 0.9 },
  totalBig: { color: "#fff", fontSize: 18, fontWeight: 700, marginTop: 2 },
});

// Modo "cliente": só nome, quantidade, preço unitário e total (dados de venda).
// Modo "fornecedor": tudo, inclusive custo, frete, comissão, imposto, margem e as
// referências de fornecedor (links clicáveis) — uso interno da GP, nunca enviar
// esse arquivo pro cliente final.
export default function OrcamentoPDF({
  modo = "cliente",
  numero,
  cliente,
  observacao,
  empresa,
  itens,
  totals,
  criadoPor,
  data,
}) {
  const t = totals || computeTotals(itens);
  const dataStr = (data ? new Date(data) : new Date()).toLocaleDateString("pt-BR");
  const fornecedorMode = modo === "fornecedor";

  const colNome = { width: fornecedorMode ? "18%" : "46%", textAlign: "left" };
  const colFornecedor = { width: "12%" };
  const colRef = { width: "14%", textAlign: "left" };
  const colNum = { width: fornecedorMode ? "7.5%" : "18%" };

  return (
    <Document>
      <Page size="A4" orientation={fornecedorMode ? "landscape" : "portrait"} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.empresaNome}>{empresa.nomeFantasia}</Text>
          <Text style={styles.empresaLinha}>{empresa.razaoSocial} — CNPJ {empresa.cnpj}</Text>
          <Text style={styles.empresaLinha}>{empresa.endereco}</Text>
          <Text style={styles.empresaLinha}>
            {empresa.email} · {empresa.telefone}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Orçamento{numero ? ` Nº ${numero}` : ""}
            {fornecedorMode ? " — uso interno" : ""}
          </Text>
          <Text>Cliente: {cliente || "-"}</Text>
          {observacao ? <Text style={{ marginTop: 2 }}>Observação: {observacao}</Text> : null}
          <Text style={{ marginTop: 2, fontSize: 8, color: "#64748B" }}>
            Data: {dataStr}
            {criadoPor ? `  ·  Responsável: ${criadoPor}` : ""}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={[styles.th, colNome]}>Item</Text>
            {fornecedorMode && <Text style={[styles.th, colFornecedor]}>Fornecedor</Text>}
            {fornecedorMode && <Text style={[styles.th, colRef]}>Referências</Text>}
            <Text style={[styles.th, colNum]}>Qtd</Text>
            {fornecedorMode && <Text style={[styles.th, colNum]}>Custo unit.</Text>}
            {fornecedorMode && <Text style={[styles.th, colNum]}>Frete</Text>}
            {fornecedorMode && <Text style={[styles.th, colNum]}>Com. %</Text>}
            {fornecedorMode && <Text style={[styles.th, colNum]}>Imp. %</Text>}
            <Text style={[styles.th, colNum]}>Preço unit.</Text>
            <Text style={[styles.th, colNum]}>Total</Text>
            {fornecedorMode && <Text style={[styles.th, colNum]}>Margem</Text>}
          </View>
          {itens.map((it) => {
            const r = computeItem(it);
            const corMargem = margemCor(r.margemPct);
            return (
              <View style={styles.row} key={it.id}>
                <Text style={[styles.td, colNome]}>{it.nome || "(item)"}</Text>
                {fornecedorMode && <Text style={[styles.td, colFornecedor]}>{it.fornecedor || "-"}</Text>}
                {fornecedorMode && (
                  <View style={[styles.td, colRef]}>
                    {(it.referencias || []).length === 0 && <Text>-</Text>}
                    {(it.referencias || []).map((ref, i) =>
                      isUrl(ref) ? (
                        <Link key={i} src={urlHref(ref)} style={{ color: "#1B3A6B", textDecoration: "underline" }}>
                          {ref}
                        </Link>
                      ) : (
                        <Text key={i}>{ref}</Text>
                      )
                    )}
                  </View>
                )}
                <Text style={[styles.td, colNum]}>{it.quantidade}</Text>
                {fornecedorMode && <Text style={[styles.td, colNum]}>{formatMoney(it.custoUnit)}</Text>}
                {fornecedorMode && <Text style={[styles.td, colNum]}>{formatMoney(it.frete)}</Text>}
                {fornecedorMode && <Text style={[styles.td, colNum]}>{it.comissaoPct}%</Text>}
                {fornecedorMode && <Text style={[styles.td, colNum]}>{it.impostoPct}%</Text>}
                <Text style={[styles.td, colNum]}>{formatMoneyPreciso(r.precoUnitario)}</Text>
                <Text style={[styles.td, colNum]}>{formatMoney(r.precoVendaTotal)}</Text>
                {fornecedorMode && (
                  <Text style={[styles.td, colNum, { color: corMargem, fontWeight: 700 }]}>
                    {formatMoney(r.margem)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {fornecedorMode ? (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <View style={{ flex: 1, borderRadius: 6, padding: 10, backgroundColor: "#F1F3F6" }}>
              <Text style={{ fontSize: 8, textTransform: "uppercase", fontWeight: 700 }}>Custo total</Text>
              <Text style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{formatMoney(t.custoTotal)}</Text>
            </View>
            <View style={{ flex: 1, borderRadius: 6, padding: 10, backgroundColor: "#E8F0FB" }}>
              <Text style={{ fontSize: 8, textTransform: "uppercase", fontWeight: 700 }}>Preço total</Text>
              <Text style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{formatMoney(t.precoTotal)}</Text>
            </View>
            <View style={{ flex: 1, borderRadius: 6, padding: 10, backgroundColor: margemCor(t.margemPct) }}>
              <Text style={{ fontSize: 8, textTransform: "uppercase", fontWeight: 700, color: "#fff" }}>
                Margem líquida
              </Text>
              <Text style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: "#fff" }}>
                {formatMoney(t.margemTotal)}
              </Text>
              <Text style={{ fontSize: 9, marginTop: 2, color: "#fff" }}>{formatPct(t.margemPct)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.totalBox}>
            <Text style={styles.totalCap}>Total do orçamento</Text>
            <Text style={styles.totalBig}>{formatMoney(t.precoTotal)}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
