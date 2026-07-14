"use client";

import { useState } from "react";

// Input numérico que mostra o valor formatado com separador de milhar (1.234,56)
// quando não está em foco, e o valor puro editável quando o usuário clica pra
// digitar. Um <input type="number"> nativo nunca mostra pontuação de milhar —
// por isso esse componente existe.
export default function CampoNumero({ value, onChange, casasDecimais = 2, className, style, title }) {
  const [focado, setFocado] = useState(false);
  const [bruto, setBruto] = useState("");

  function aoFocar(e) {
    setBruto(String(value ?? 0));
    setFocado(true);
    requestAnimationFrame(() => e.target.select());
  }

  function aoDigitar(e) {
    setBruto(e.target.value);
    onChange(e.target.value.replace(",", "."));
  }

  function aoDesfocar() {
    setFocado(false);
  }

  const exibido = focado
    ? bruto
    : (value || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: casasDecimais,
      });

  return (
    <input
      type="text"
      inputMode="decimal"
      value={exibido}
      onFocus={aoFocar}
      onChange={aoDigitar}
      onBlur={aoDesfocar}
      title={title}
      className={className}
      style={style}
    />
  );
}
