import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "Calculadora GP",
  description: "Precificação de orçamentos — Grandes Possibilidades",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
