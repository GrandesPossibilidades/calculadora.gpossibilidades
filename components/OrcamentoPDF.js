import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { computeItem, computeTotals } from "@/lib/calc";
import { formatMoney } from "@/lib/format";

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
    fontSize: 8,
    textTransform: "uppercase",
    padding: 5,
    textAlign: "center",
  },
  td: {
    fontSize: 9,
    padding: 5,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF3",
  },
  colNome: { width: "46%", textAlign: "left" },
  colNum: { width: "18%" },
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

// PDF para o cliente: mostra só nome do item, quantidade, preço unitário e total.
// Custo, frete, comissão, imposto e margem são informação interna da GP e nunca
// devem aparecer aqui.
export default function OrcamentoPDF({ numero, cliente, observacao, empresa, itens, totals, criadoPor, data }) {
  const t = totals || computeTotals(itens);
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
          <Text style={styles.sectionTitle}>
            Orçamento{numero ? ` Nº ${numero}` : ""}
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
            <Text style={[styles.th, styles.colNome]}>Item</Text>
            <Text style={[styles.th, styles.colNum]}>Qtd</Text>
            <Text style={[styles.th, styles.colNum]}>Preço unit.</Text>
            <Text style={[styles.th, styles.colNum]}>Total</Text>
          </View>
          {itens.map((it) => {
            const r = computeItem(it);
            return (
              <View style={styles.row} key={it.id}>
                <Text style={[styles.td, styles.colNome]}>{it.nome || "(item)"}</Text>
                <Text style={[styles.td, styles.colNum]}>{it.quantidade}</Text>
                <Text style={[styles.td, styles.colNum]}>{formatMoney(r.precoUnitario)}</Text>
                <Text style={[styles.td, styles.colNum]}>{formatMoney(r.precoVendaTotal)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalCap}>Total do orçamento</Text>
          <Text style={styles.totalBig}>{formatMoney(t.precoTotal)}</Text>
        </View>
      </Page>
    </Document>
  );
}
