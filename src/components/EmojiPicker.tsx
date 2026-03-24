import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

const EMOJI_CATEGORIES: { label: string; icon: string; emojis: { emoji: string; keywords: string[] }[] }[] = [
  {
    label: "Moradia e casa", icon: "🏠",
    emojis: [
      { emoji: "🏠", keywords: ["casa", "house", "home", "moradia"] },
      { emoji: "🏡", keywords: ["casa jardim", "house garden"] },
      { emoji: "🏘️", keywords: ["casas", "houses", "bairro"] },
      { emoji: "🏢", keywords: ["prédio", "building", "escritório"] },
      { emoji: "🏗️", keywords: ["construção", "construction", "condomínio"] },
      { emoji: "🔑", keywords: ["chave", "key", "aluguel"] },
      { emoji: "🚪", keywords: ["porta", "door"] },
      { emoji: "🛋️", keywords: ["sofá", "couch", "móvel"] },
      { emoji: "🛏️", keywords: ["cama", "bed", "quarto"] },
      { emoji: "🪑", keywords: ["cadeira", "chair", "móvel"] },
      { emoji: "🧹", keywords: ["vassoura", "broom", "limpeza"] },
      { emoji: "💡", keywords: ["luz", "light", "energia", "elétrica"] },
      { emoji: "🔥", keywords: ["fogo", "fire", "gás"] },
      { emoji: "🪟", keywords: ["janela", "window"] },
    ],
  },
  {
    label: "Alimentação", icon: "🍽️",
    emojis: [
      { emoji: "🍽️", keywords: ["prato", "plate", "refeição", "alimentação"] },
      { emoji: "🍕", keywords: ["pizza"] },
      { emoji: "🍔", keywords: ["hambúrguer", "burger", "lanche"] },
      { emoji: "🍟", keywords: ["batata frita", "fries"] },
      { emoji: "🌮", keywords: ["taco", "mexicano"] },
      { emoji: "🍣", keywords: ["sushi", "japonês"] },
      { emoji: "🥗", keywords: ["salada", "salad", "saudável"] },
      { emoji: "🍞", keywords: ["pão", "bread", "padaria"] },
      { emoji: "☕", keywords: ["café", "coffee"] },
      { emoji: "🥤", keywords: ["bebida", "drink", "suco"] },
      { emoji: "🍺", keywords: ["cerveja", "beer", "bar"] },
      { emoji: "🍷", keywords: ["vinho", "wine"] },
      { emoji: "🛒", keywords: ["mercado", "supermercado", "compras", "grocery"] },
      { emoji: "🥩", keywords: ["carne", "meat", "açougue"] },
      { emoji: "🍰", keywords: ["bolo", "cake", "doce"] },
      { emoji: "🍎", keywords: ["fruta", "fruit", "maçã", "apple"] },
    ],
  },
  {
    label: "Transporte", icon: "🚗",
    emojis: [
      { emoji: "🚗", keywords: ["carro", "car", "automóvel"] },
      { emoji: "🚕", keywords: ["táxi", "taxi", "uber"] },
      { emoji: "🚌", keywords: ["ônibus", "bus", "transporte público"] },
      { emoji: "🚇", keywords: ["metrô", "metro", "subway"] },
      { emoji: "✈️", keywords: ["avião", "airplane", "viagem"] },
      { emoji: "⛽", keywords: ["gasolina", "combustível", "fuel", "gas"] },
      { emoji: "🛞", keywords: ["pneu", "tire", "roda"] },
      { emoji: "🚲", keywords: ["bicicleta", "bike"] },
      { emoji: "🛵", keywords: ["moto", "motorcycle", "scooter"] },
      { emoji: "🚂", keywords: ["trem", "train"] },
      { emoji: "🅿️", keywords: ["estacionamento", "parking"] },
      { emoji: "🛣️", keywords: ["estrada", "road", "pedágio"] },
    ],
  },
  {
    label: "Finanças e dinheiro", icon: "💰",
    emojis: [
      { emoji: "💰", keywords: ["dinheiro", "money", "poupança"] },
      { emoji: "💵", keywords: ["dólar", "dollar", "nota"] },
      { emoji: "💳", keywords: ["cartão", "card", "crédito", "débito"] },
      { emoji: "🏦", keywords: ["banco", "bank"] },
      { emoji: "💸", keywords: ["gasto", "spending", "saída"] },
      { emoji: "📈", keywords: ["investimento", "investment", "alta", "lucro"] },
      { emoji: "📉", keywords: ["queda", "loss", "prejuízo"] },
      { emoji: "🪙", keywords: ["moeda", "coin"] },
      { emoji: "💎", keywords: ["diamante", "diamond", "investimento"] },
      { emoji: "🧾", keywords: ["recibo", "receipt", "nota fiscal"] },
      { emoji: "💼", keywords: ["maleta", "briefcase", "negócios", "trabalho"] },
      { emoji: "↔️", keywords: ["transferência", "transfer"] },
      { emoji: "📊", keywords: ["gráfico", "chart", "relatório"] },
    ],
  },
  {
    label: "Saúde", icon: "🏥",
    emojis: [
      { emoji: "🏥", keywords: ["hospital", "saúde", "health"] },
      { emoji: "💊", keywords: ["remédio", "medicine", "farmácia"] },
      { emoji: "🩺", keywords: ["médico", "doctor", "consulta"] },
      { emoji: "🦷", keywords: ["dente", "dentista", "tooth"] },
      { emoji: "👓", keywords: ["óculos", "glasses", "oculista"] },
      { emoji: "🩹", keywords: ["curativo", "bandaid"] },
      { emoji: "🧬", keywords: ["dna", "exame", "lab"] },
      { emoji: "🩸", keywords: ["sangue", "blood", "exame"] },
      { emoji: "🧠", keywords: ["cérebro", "brain", "psicólogo", "terapia"] },
      { emoji: "❤️", keywords: ["coração", "heart", "saúde"] },
      { emoji: "🐶", keywords: ["pet", "veterinário", "cachorro"] },
    ],
  },
  {
    label: "Educação", icon: "📚",
    emojis: [
      { emoji: "📚", keywords: ["livros", "books", "educação"] },
      { emoji: "🎓", keywords: ["formatura", "graduation", "faculdade"] },
      { emoji: "📖", keywords: ["livro", "book", "leitura"] },
      { emoji: "✏️", keywords: ["lápis", "pencil", "escola"] },
      { emoji: "🖊️", keywords: ["caneta", "pen"] },
      { emoji: "🎒", keywords: ["mochila", "backpack", "escola"] },
      { emoji: "💻", keywords: ["computador", "computer", "curso online"] },
      { emoji: "📝", keywords: ["nota", "note", "estudo"] },
      { emoji: "🏫", keywords: ["escola", "school"] },
      { emoji: "🔬", keywords: ["microscópio", "ciência", "science"] },
    ],
  },
  {
    label: "Lazer e entretenimento", icon: "🎮",
    emojis: [
      { emoji: "🎮", keywords: ["jogo", "game", "videogame"] },
      { emoji: "🎬", keywords: ["cinema", "movie", "filme"] },
      { emoji: "🎵", keywords: ["música", "music", "spotify"] },
      { emoji: "📺", keywords: ["tv", "televisão", "streaming", "netflix"] },
      { emoji: "🎭", keywords: ["teatro", "theater", "show"] },
      { emoji: "🎪", keywords: ["circo", "evento", "event"] },
      { emoji: "🎨", keywords: ["arte", "art", "pintura"] },
      { emoji: "📷", keywords: ["foto", "camera", "fotografia"] },
      { emoji: "🎤", keywords: ["karaokê", "microfone", "karaoke"] },
      { emoji: "🎲", keywords: ["dado", "dice", "jogo de tabuleiro"] },
      { emoji: "🎳", keywords: ["boliche", "bowling"] },
      { emoji: "🎻", keywords: ["violino", "violin", "instrumento"] },
    ],
  },
  {
    label: "Trabalho e negócios", icon: "👔",
    emojis: [
      { emoji: "👔", keywords: ["trabalho", "work", "negócio"] },
      { emoji: "🏢", keywords: ["escritório", "office"] },
      { emoji: "📋", keywords: ["clipboard", "tarefa", "task"] },
      { emoji: "📎", keywords: ["clipe", "clip"] },
      { emoji: "🖨️", keywords: ["impressora", "printer"] },
      { emoji: "📁", keywords: ["pasta", "folder"] },
      { emoji: "📌", keywords: ["pin", "fixar"] },
      { emoji: "🗂️", keywords: ["arquivo", "file"] },
      { emoji: "✉️", keywords: ["email", "carta", "mail"] },
      { emoji: "🤝", keywords: ["acordo", "handshake", "parceria"] },
    ],
  },
  {
    label: "Compras", icon: "🛒",
    emojis: [
      { emoji: "🛍️", keywords: ["sacola", "shopping bag", "compras"] },
      { emoji: "👕", keywords: ["roupa", "clothes", "camiseta"] },
      { emoji: "👗", keywords: ["vestido", "dress"] },
      { emoji: "👟", keywords: ["tênis", "shoes", "calçado"] },
      { emoji: "👜", keywords: ["bolsa", "bag", "purse"] },
      { emoji: "⌚", keywords: ["relógio", "watch", "acessório"] },
      { emoji: "💄", keywords: ["maquiagem", "makeup", "cosmético"] },
      { emoji: "🧴", keywords: ["loção", "creme", "skincare"] },
      { emoji: "🛒", keywords: ["carrinho", "cart", "mercado"] },
      { emoji: "🎁", keywords: ["presente", "gift"] },
    ],
  },
  {
    label: "Viagem", icon: "✈️",
    emojis: [
      { emoji: "✈️", keywords: ["avião", "airplane", "voo"] },
      { emoji: "🏖️", keywords: ["praia", "beach", "férias"] },
      { emoji: "🏔️", keywords: ["montanha", "mountain"] },
      { emoji: "🗺️", keywords: ["mapa", "map"] },
      { emoji: "🧳", keywords: ["mala", "luggage", "viagem"] },
      { emoji: "🏨", keywords: ["hotel", "hospedagem"] },
      { emoji: "🌍", keywords: ["mundo", "world", "internacional"] },
      { emoji: "🗼", keywords: ["torre", "tower", "ponto turístico"] },
      { emoji: "⛱️", keywords: ["guarda-sol", "praia", "parasol"] },
      { emoji: "🚢", keywords: ["navio", "cruise", "cruzeiro"] },
    ],
  },
  {
    label: "Bem-estar e fitness", icon: "💪",
    emojis: [
      { emoji: "💪", keywords: ["músculo", "gym", "academia", "fitness"] },
      { emoji: "🏋️", keywords: ["peso", "weight", "academia"] },
      { emoji: "🧘", keywords: ["yoga", "meditação", "meditation"] },
      { emoji: "🏃", keywords: ["corrida", "running", "exercício"] },
      { emoji: "🏊", keywords: ["natação", "swimming"] },
      { emoji: "🚴", keywords: ["ciclismo", "cycling"] },
      { emoji: "⚽", keywords: ["futebol", "soccer", "esporte"] },
      { emoji: "🎾", keywords: ["tênis", "tennis"] },
      { emoji: "🧖", keywords: ["spa", "relaxar"] },
      { emoji: "💆", keywords: ["massagem", "massage"] },
    ],
  },
  {
    label: "Tecnologia", icon: "📱",
    emojis: [
      { emoji: "📱", keywords: ["celular", "phone", "smartphone"] },
      { emoji: "💻", keywords: ["laptop", "notebook", "computador"] },
      { emoji: "🖥️", keywords: ["desktop", "pc", "monitor"] },
      { emoji: "⌨️", keywords: ["teclado", "keyboard"] },
      { emoji: "🖱️", keywords: ["mouse"] },
      { emoji: "🎧", keywords: ["fone", "headphone", "áudio"] },
      { emoji: "📡", keywords: ["internet", "wifi", "sinal"] },
      { emoji: "🔌", keywords: ["tomada", "plug", "carregador"] },
      { emoji: "🔋", keywords: ["bateria", "battery"] },
      { emoji: "💾", keywords: ["disco", "disk", "storage"] },
    ],
  },
  {
    label: "Animais", icon: "🐾",
    emojis: [
      { emoji: "🐾", keywords: ["pata", "paw", "pet"] },
      { emoji: "🐶", keywords: ["cachorro", "dog"] },
      { emoji: "🐱", keywords: ["gato", "cat"] },
      { emoji: "🐦", keywords: ["pássaro", "bird"] },
      { emoji: "🐠", keywords: ["peixe", "fish"] },
      { emoji: "🐴", keywords: ["cavalo", "horse"] },
      { emoji: "🐇", keywords: ["coelho", "rabbit"] },
      { emoji: "🐢", keywords: ["tartaruga", "turtle"] },
      { emoji: "🦮", keywords: ["cão-guia", "guide dog"] },
    ],
  },
  {
    label: "Presentes", icon: "🎁",
    emojis: [
      { emoji: "🎁", keywords: ["presente", "gift"] },
      { emoji: "🎂", keywords: ["bolo", "cake", "aniversário", "birthday"] },
      { emoji: "🎉", keywords: ["festa", "party", "celebração"] },
      { emoji: "🎊", keywords: ["confete", "confetti"] },
      { emoji: "💐", keywords: ["flores", "flowers", "buquê"] },
      { emoji: "🌹", keywords: ["rosa", "rose"] },
      { emoji: "🧸", keywords: ["urso", "teddy bear", "brinquedo"] },
      { emoji: "💝", keywords: ["coração", "love", "romântico"] },
      { emoji: "🎈", keywords: ["balão", "balloon"] },
    ],
  },
  {
    label: "Serviços e utilidades", icon: "⚡",
    emojis: [
      { emoji: "⚡", keywords: ["energia", "electricity", "conta de luz"] },
      { emoji: "💧", keywords: ["água", "water", "conta de água"] },
      { emoji: "📶", keywords: ["sinal", "internet", "celular"] },
      { emoji: "📞", keywords: ["telefone", "phone", "ligação"] },
      { emoji: "🔧", keywords: ["ferramenta", "tool", "manutenção"] },
      { emoji: "🛠️", keywords: ["ferramentas", "tools", "reparo"] },
      { emoji: "🧰", keywords: ["caixa de ferramentas", "toolbox"] },
      { emoji: "🏗️", keywords: ["obra", "construção", "reforma"] },
      { emoji: "🧯", keywords: ["extintor", "segurança", "seguro"] },
      { emoji: "🗑️", keywords: ["lixo", "trash", "descarte"] },
    ],
  },
  {
    label: "Outros", icon: "🔧",
    emojis: [
      { emoji: "📁", keywords: ["pasta", "folder", "geral"] },
      { emoji: "🔔", keywords: ["sino", "bell", "notificação"] },
      { emoji: "⭐", keywords: ["estrela", "star", "favorito"] },
      { emoji: "🏷️", keywords: ["etiqueta", "tag", "label"] },
      { emoji: "📌", keywords: ["pin", "fixar", "marcar"] },
      { emoji: "🔒", keywords: ["cadeado", "lock", "segurança"] },
      { emoji: "🎯", keywords: ["alvo", "target", "meta"] },
      { emoji: "🔄", keywords: ["recorrente", "repeat", "loop"] },
      { emoji: "❓", keywords: ["pergunta", "question", "outros"] },
      { emoji: "➕", keywords: ["mais", "plus", "adicionar"] },
    ],
  },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results: { emoji: string; keywords: string[] }[] = [];
    for (const cat of EMOJI_CATEGORIES) {
      for (const e of cat.emojis) {
        if (
          e.emoji.includes(q) ||
          e.keywords.some(k => k.toLowerCase().includes(q))
        ) {
          results.push(e);
        }
      }
    }
    return results;
  }, [search]);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-10 w-10 rounded-md border border-input bg-background flex items-center justify-center text-2xl",
            "hover:border-primary/40 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar emoji..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
              autoFocus
            />
          </div>
        </div>

        {!search.trim() && (
          <div className="flex gap-0.5 p-1.5 border-b border-border overflow-x-auto">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveCategory(i)}
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded text-sm flex items-center justify-center transition-colors",
                  activeCategory === i ? "bg-primary/10" : "hover:bg-muted"
                )}
                title={cat.label}
              >
                {cat.icon}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-60 overflow-y-auto p-2">
          {search.trim() ? (
            filtered && filtered.length > 0 ? (
              <div className="grid grid-cols-8 gap-0.5">
                {filtered.map((e, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(e.emoji)}
                    className="w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-muted transition-colors"
                  >
                    {e.emoji}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum emoji encontrado</p>
            )
          ) : (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 px-1">
                {EMOJI_CATEGORIES[activeCategory].label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {EMOJI_CATEGORIES[activeCategory].emojis.map((e, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(e.emoji)}
                    className="w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-muted transition-colors"
                  >
                    {e.emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
