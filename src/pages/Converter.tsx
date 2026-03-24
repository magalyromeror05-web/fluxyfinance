import { CurrencyConverterInline } from "@/components/CurrencyConverter";
import { ArrowLeftRight } from "lucide-react";

export default function Converter() {
  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6" /> Conversor de Moedas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cotações em tempo real via Banco Central do Brasil
        </p>
      </div>
      <CurrencyConverterInline />
    </div>
  );
}
