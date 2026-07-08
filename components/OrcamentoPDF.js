import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { computeItem, computeTotals, margemCor } from "@/lib/calc";
import { formatMoney, formatPct } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica", color: "#1B2A41" },
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
    fontSize: 8.5,
    padding: 4,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF3",
  },
  colNome: { width: "26%", textAlign: "left" },
  colNum: { width: "10.5%" },
  totals: { flexDirection: "row", gap: 8, marginTop: 10 },
  tbox: { flex: 1, borderRadius: 6, padding: 10, textAlign: "center" },
  tCap: { fontSize: 7.5, textTransform: "uppercase", fontWeight: 700 },
  tBig: { fontSize: 13, fontWeight: 700, marginTop: 2 },
});

export default function OrcamentoPDF({ cliente, observacao, empresa, itens, totals, criadoPor, data }) {
  const t = totals || computeTotals(itens);
  const corMargem = margemCor(t.margemPct);
  const dataStr = (data ? new Date(data) : new Date()).toLocaleDateString("pt-BR");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.empresaNome}>{empresa.nomeFantasia}</Text>
          <Text style={styles.empresaLinha}>{empresa.razaoSocial} — CNPJ {empresa.cnpj}</Text>
          <Text style={styles.empresaLinha}>{empresa.endereco}</Text>
          <Text style={styles.empresaLinha}>
            {empresa.email} · {empresa.telefone}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orçamento</Text>
          <Text>Cliente: {cliente || "-"}</Text>
          {observacao ? <Text style={{ marginTop: 2 }}>Observação: {observacao}</Text> : null}
          <Text style={{ marginTop: 2, fontSize: 8, color: "#64748B" }}>
            Data: {dataStr}
            {criadoPor ? `  ·  Responsável: ${criadoPor}` : ""}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={[styles.th, styles.colNome]}>Item</Text>
            <Text style={[styles.th, styles.colNum]}>Qtd</Text>
            <Text style={[styles.th, styles.colNum]}>Custo unit.</Text>
            <Text style={[styles.th, styles.colNum]}>Frete</Text>
            <Text style={[styles.th, styles.colNum]}>Preço unit.</Text>
            <Text style={[styles.th, styles.colNum]}>Total item</Text>
          </View>
          {itens.map((it) => {
            const r = computeItem(it);
            return (
              <View style={styles.row} key={it.id}>
                <Text style={[styles.td, styles.colNome]}>{it.nome || "(item)"}</Text>
                <Text style={[styles.td, styles.colNum]}>{it.quantidade}</Text>
                <Text style={[styles.td, styles.colNum]}>{formatMoney(it.custoUnit)}</Text>
                <Text style={[styles.td, styles.colNum]}>{formatMoney(it.frete)}</Text>
                <Text style={[styles.td, styles.colNum]}>{formatMoney(r.precoUnitario)}</Text>
                <Text style={[styles.td, styles.colNum]}>{formatMoney(r.precoVendaTotal)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totals}>
          <View style={[styles.tbox, { backgroundColor: "#F1F3F6" }]}>
            <Text style={styles.tCap}>Custo total</Text>
            <Text style={styles.tBig}>{formatMoney(t.custoTotal)}</Text>
          </View>
          <View style={[styles.tbox, { backgroundColor: "#E8F0FB" }]}>
            <Text style={styles.tCap}>Preço total</Text>
            <Text style={styles.tBig}>{formatMoney(t.precoTotal)}</Text>
          </View>
          <View style={[styles.tbox, { backgroundColor: corMargem, color: "#fff" }]}>
            <Text style={[styles.tCap, { color: "#fff" }]}>Margem líquida</Text>
            <Text style={[styles.tBig, { color: "#fff" }]}>{formatMoney(t.margemTotal)}</Text>
            <Text style={{ color: "#fff", fontSize: 9, marginTop: 2 }}>{formatPct(t.margemPct)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
