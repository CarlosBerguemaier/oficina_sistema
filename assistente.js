// ==========================================
// ASSISTENTE DE IA: Ditado por voz e Foto do caderno
// ==========================================
// A chave da API da Anthropic fica salva só neste aparelho (localStorage),
// nunca no código nem no Firebase.

const CHAVE_STORAGE = "oficina_anthropic_key";
const MODELO = "claude-opus-5-5";

// Formato que a IA deve devolver: uma lista de OS
const ESQUEMA_OS = {
    type: "object",
    additionalProperties: false,
    required: ["ordens"],
    properties: {
        ordens: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                required: ["placa", "nomeCliente", "marca", "modelo", "motor", "ano", "data", "quilometragem", "descricao", "valorMaoDeObra", "repasseCarlos", "repasseRatinho", "outrosGastos", "observacoes"],
                properties: {
                    placa: { type: "string" },
                    nomeCliente: { type: "string" },
                    marca: { type: "string" },
                    modelo: { type: "string" },
                    motor: { type: "string" },
                    ano: { type: "integer" },
                    data: { type: "string" },
                    quilometragem: { type: "integer" },
                    descricao: { type: "string" },
                    valorMaoDeObra: { type: "number" },
                    repasseCarlos: { type: "number" },
                    repasseRatinho: { type: "number" },
                    outrosGastos: {
                        type: "array",
                        items: {
                            type: "object",
                            additionalProperties: false,
                            required: ["descricao", "valor"],
                            properties: {
                                descricao: { type: "string" },
                                valor: { type: "number" }
                            }
                        }
                    },
                    observacoes: { type: "string" }
                }
            }
        }
    }
};

function montarInstrucoes(frotaBrasil) {
    const hoje = new Date();
    const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    const diaSemana = hoje.toLocaleDateString("pt-BR", { weekday: "long" });

    return `Você ajuda uma oficina mecânica brasileira a passar ordens de serviço (OS) do caderno para o sistema.
Você vai receber um texto ditado por voz ou fotos de páginas do caderno, e deve extrair cada OS encontrada.

Regras:
- Hoje é ${diaSemana}, ${dataHoje}. Converta datas relativas ("ontem", "dia 12", "segunda") para o formato AAAA-MM-DD. Se a data não for dita, use ${dataHoje}. Datas do caderno sem ano: assuma o ano mais recente que não fique no futuro.
- Placa: só letras e números, maiúsculas, sem traço (ex: ABC1234 ou ABC1D23).
- Marca, modelo e motor: use EXATAMENTE os nomes da lista abaixo quando o carro estiver nela (ex: "Gol" -> marca "Volkswagen", modelo "Gol"). Se não estiver na lista, escreva o nome como foi dito. Se não souber, deixe "".
- quilometragem: número inteiro ("98 mil 560" -> 98560). Se não souber, 0.
- ano: ano do carro com 4 dígitos. Se não souber, 0.
- valorMaoDeObra: valor cobrado pelo serviço (mão de obra).
- repasseCarlos e repasseRatinho: quanto vai para o Carlos e para o Ratinho (comissão). 0 se não for dito.
- outrosGastos: peças, óleo, retífica e outros gastos com valor, cada um em um item.
- descricao: o que foi feito no carro, escrito de forma clara e curta.
- Campos de texto desconhecidos ficam "" e números desconhecidos ficam 0. Nunca invente dados.
- observacoes: avise em poucas palavras sobre o que ficou duvidoso (letra ilegível, valor incerto, placa incompleta). Deixe "" se estiver tudo claro.
- Se não encontrar nenhuma OS, devolva a lista vazia.

Lista de carros (marca -> modelo -> motores):
${JSON.stringify(frotaBrasil)}`;
}

// Diminui a foto antes de enviar (fotos de celular são grandes demais)
function redimensionarImagem(arquivo, ladoMaximo = 1568) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(arquivo);
        img.onload = () => {
            const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * escala);
            canvas.height = Math.round(img.height * escala);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Não foi possível abrir a imagem."));
        };
        img.src = url;
    });
}

export class Assistente {
    constructor(frotaBrasil, aoExtrairOrdens) {
        this.frotaBrasil = frotaBrasil;
        this.aoExtrairOrdens = aoExtrairOrdens;
        this.reconhecimento = null;
        this.gravando = false;

        this.painel = document.getElementById("painelDitado");
        this.textoDitado = document.getElementById("textoDitado");
        this.btnDitar = document.getElementById("btnDitarOS");
        this.btnMicrofone = document.getElementById("btnMicrofone");
        this.inputFoto = document.getElementById("inputFotoCaderno");
        this.status = document.getElementById("statusAssistente");

        this.btnDitar.addEventListener("click", () => this.abrirDitado());
        this.btnMicrofone.addEventListener("click", () => this.alternarGravacao());
        document.getElementById("btnOrganizarDitado").addEventListener("click", () => this.processarTexto());
        document.getElementById("btnFecharDitado").addEventListener("click", () => this.fecharDitado());
        document.getElementById("btnFotoCaderno").addEventListener("click", () => this.inputFoto.click());
        this.inputFoto.addEventListener("change", () => this.processarFotos());
        document.getElementById("btnConfigIA").addEventListener("click", () => this.pedirChave());
    }

    obterChave() {
        try {
            return localStorage.getItem(CHAVE_STORAGE);
        } catch {
            return null;
        }
    }

    pedirChave() {
        const atual = this.obterChave();
        const chave = prompt(
            "Cole aqui a sua chave da API da Anthropic (começa com sk-ant-).\nEla fica salva só neste aparelho.",
            atual || ""
        );
        if (chave === null) return atual;
        try {
            localStorage.setItem(CHAVE_STORAGE, chave.trim());
        } catch {
            alert("Não foi possível salvar a chave neste navegador.");
        }
        return chave.trim();
    }

    mostrarStatus(mensagem, tipo = "info") {
        this.status.innerHTML = mensagem ? `<div class="alert alert-${tipo} py-2 mb-0">${mensagem}</div>` : "";
    }

    // ---------- DITADO POR VOZ ----------
    abrirDitado() {
        this.painel.classList.remove("d-none");
        this.textoDitado.focus();
        const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Reconhecimento) {
            this.btnMicrofone.classList.add("d-none");
            this.mostrarStatus("Este navegador não grava voz direto. Toque na caixa de texto e use o microfone do teclado do celular.", "warning");
            return;
        }
        this.iniciarGravacao();
    }

    fecharDitado() {
        this.pararGravacao();
        this.painel.classList.add("d-none");
        this.textoDitado.value = "";
        this.mostrarStatus("");
    }

    alternarGravacao() {
        if (this.gravando) this.pararGravacao();
        else this.iniciarGravacao();
    }

    iniciarGravacao() {
        const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Reconhecimento || this.gravando) return;

        this.reconhecimento = new Reconhecimento();
        this.reconhecimento.lang = "pt-BR";
        this.reconhecimento.continuous = true;
        this.reconhecimento.interimResults = true;

        // Texto que já estava na caixa antes desta gravação
        const textoBase = this.textoDitado.value ? this.textoDitado.value.trimEnd() + " " : "";
        let textoFinal = "";

        this.reconhecimento.onresult = (evento) => {
            let parcial = "";
            for (let i = evento.resultIndex; i < evento.results.length; i++) {
                const trecho = evento.results[i][0].transcript;
                if (evento.results[i].isFinal) textoFinal += trecho + " ";
                else parcial += trecho;
            }
            this.textoDitado.value = textoBase + textoFinal + parcial;
        };
        this.reconhecimento.onerror = (evento) => {
            if (evento.error === "not-allowed") {
                this.mostrarStatus("Permita o uso do microfone para este site nas configurações do navegador.", "danger");
            }
        };
        this.reconhecimento.onend = () => {
            this.gravando = false;
            this.atualizarBotaoMicrofone();
        };

        this.reconhecimento.start();
        this.gravando = true;
        this.atualizarBotaoMicrofone();
        this.mostrarStatus("🎤 Ouvindo... fale os dados da OS. Pode falar várias OS seguidas.", "info");
    }

    pararGravacao() {
        if (this.reconhecimento && this.gravando) this.reconhecimento.stop();
        this.gravando = false;
        this.atualizarBotaoMicrofone();
    }

    atualizarBotaoMicrofone() {
        this.btnMicrofone.textContent = this.gravando ? "⏹️ Parar" : "🎤 Gravar";
        this.btnMicrofone.classList.toggle("btn-danger", this.gravando);
        this.btnMicrofone.classList.toggle("btn-outline-danger", !this.gravando);
    }

    async processarTexto() {
        this.pararGravacao();
        const texto = this.textoDitado.value.trim();
        if (!texto) {
            alert("Fale ou digite os dados da OS primeiro.");
            return;
        }
        const ordens = await this.extrairOrdens([{ type: "text", text: `Texto ditado:\n${texto}` }]);
        if (ordens) {
            this.painel.classList.add("d-none");
            this.textoDitado.value = "";
        }
    }

    // ---------- FOTO DO CADERNO ----------
    async processarFotos() {
        const arquivos = Array.from(this.inputFoto.files);
        this.inputFoto.value = "";
        if (arquivos.length === 0) return;

        this.mostrarStatus('<span class="spinner-border spinner-border-sm"></span> Preparando as fotos...', "info");
        let conteudo;
        try {
            const imagens = await Promise.all(arquivos.map(a => redimensionarImagem(a)));
            conteudo = imagens.map(dados => ({
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: dados }
            }));
        } catch (erro) {
            this.mostrarStatus(erro.message, "danger");
            return;
        }
        conteudo.push({ type: "text", text: "Extraia todas as ordens de serviço escritas nestas páginas do caderno." });
        await this.extrairOrdens(conteudo);
    }

    // ---------- CHAMADA DA IA ----------
    async extrairOrdens(conteudo) {
        let chave = this.obterChave();
        if (!chave) chave = this.pedirChave();
        if (!chave) return null;

        this.mostrarStatus('<span class="spinner-border spinner-border-sm"></span> A IA está organizando os dados... (pode levar alguns segundos)', "info");

        let Anthropic;
        try {
            ({ default: Anthropic } = await import("https://esm.sh/@anthropic-ai/sdk"));
        } catch (erro) {
            console.error(erro);
            this.mostrarStatus("Não foi possível carregar a IA. Verifique a internet.", "danger");
            return null;
        }

        const cliente = new Anthropic({ apiKey: chave, dangerouslyAllowBrowser: true });

        try {
            const resposta = await cliente.beta.messages.create({
                model: MODELO,
                max_tokens: 16000,
                betas: ["server-side-fallback-2026-07-01"],
                fallbacks: "default",
                output_config: {
                    effort: "medium",
                    format: { type: "json_schema", schema: ESQUEMA_OS }
                },
                system: montarInstrucoes(this.frotaBrasil),
                messages: [{ role: "user", content: conteudo }]
            });

            if (resposta.stop_reason === "refusal") {
                this.mostrarStatus("A IA não conseguiu processar este pedido. Tente de novo com outro texto ou foto.", "danger");
                return null;
            }
            if (resposta.stop_reason === "max_tokens") {
                this.mostrarStatus("Muita coisa de uma vez. Tente com menos OS ou menos fotos.", "warning");
                return null;
            }

            const blocoTexto = resposta.content.find(b => b.type === "text");
            const { ordens } = JSON.parse(blocoTexto.text);

            if (ordens.length === 0) {
                this.mostrarStatus("Nenhuma OS encontrada. Tente falar ou fotografar de novo.", "warning");
                return null;
            }

            this.mostrarStatus("");
            this.aoExtrairOrdens(ordens);
            return ordens;
        } catch (erro) {
            console.error(erro);
            if (erro instanceof Anthropic.AuthenticationError) {
                this.mostrarStatus('Chave da API inválida. Toque em ⚙️ para corrigir.', "danger");
            } else if (erro instanceof Anthropic.RateLimitError) {
                this.mostrarStatus("Muitos pedidos seguidos. Espere um minuto e tente de novo.", "warning");
            } else if (erro instanceof Anthropic.BadRequestError) {
                this.mostrarStatus(`Pedido recusado pela IA: ${erro.message}`, "danger");
            } else if (erro instanceof Anthropic.APIError) {
                this.mostrarStatus(`Erro na IA (${erro.status ?? "sem conexão"}). Tente de novo.`, "danger");
            } else {
                this.mostrarStatus("Erro ao ler a resposta da IA. Tente de novo.", "danger");
            }
            return null;
        }
    }
}
