import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, query, where, getDocs, orderBy, limit, updateDoc, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { Assistente } from "./assistente.js?v=12";
import { iniciarAcesso } from "./acesso.js?v=12";

// Coleções que pertencem a cada oficina (usadas no backup e na importação)
const COLECOES_DA_OFICINA = ["ordens_servico", "veiculos", "funcionarios"];
// ==========================================
// 1. CONFIGURAÇÃO DO FIREBASE (Cole as suas chaves aqui)
// ==========================================
  const firebaseConfig = {
    apiKey: "AIzaSyCZ8ni2wDRPP3UzFEBCXpldSg9xcrhXvNg",
    authDomain: "oficinaberguemaier-d75a5.firebaseapp.com",
    projectId: "oficinaberguemaier-d75a5",
    storageBucket: "oficinaberguemaier-d75a5.firebasestorage.app",
    messagingSenderId: "563626978882",
    appId: "1:563626978882:web:0b48ff9ce91ca7e24047db",
    measurementId: "G-T3NSLZSZ28"
  };

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);

// ==========================================
// FUNÇÕES AUXILIARES DE TELA
// ==========================================
// Formata número como dinheiro: 1234.5 -> "R$ 1.234,50"
function formatarMoeda(valor) {
    return (Number(valor) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Número vindo do banco; qualquer coisa que não seja número vira 0
function num(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
}

// Data da OS no formato AAAA-MM-DD, ou "" se não houver.
// Usa a data escolhida (os.data) ou, em OS antigas, a data de entrada.
// Aceita qualquer coisa vinda do banco sem travar a tela (número, nulo, formato errado).
function dataDaOS(os) {
    const bruta = os?.data || os?.dataEntrada || "";
    return String(bruta).split("T")[0];
}

// Protege textos vindos do banco antes de colocar no HTML
function esc(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Cor fixa para cada funcionário (a mesma em todas as telas)
const CORES_EQUIPE = ["#2F80C9", "#E09A00", "#7B5CC4", "#1E9E8F", "#D0583A", "#5B7083", "#C2407D"];
function corFuncionario(id) {
    let soma = 0;
    for (const c of id) soma += c.charCodeAt(0);
    return CORES_EQUIPE[soma % CORES_EQUIPE.length];
}

// Aviso rápido no topo da tela (substitui o alert do navegador)
function mostrarToast(mensagem, tipo = "sucesso") {
    const area = document.getElementById("toastArea");
    const icones = { sucesso: "bi-check-circle-fill", erro: "bi-exclamation-octagon-fill", info: "bi-info-circle-fill" };
    const toast = document.createElement("div");
    toast.className = `app-toast ${tipo}`;
    toast.innerHTML = `<i class="bi ${icones[tipo] || icones.info}"></i><span></span>`;
    toast.querySelector("span").textContent = mensagem;
    area.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("saindo");
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// ==========================================
// 2. MEGA BANCO DE DADOS LOCAL (Cascata)
// ==========================================
const frotaBrasil = {
    "Chevrolet": {
        "Chevette": ["1.4", "1.6", "1.6 S"],
        "Opala / Caravan": ["2.5 (4 cil)", "4.1 (6 cil)"],
        "Monza": ["1.6", "1.8", "2.0"],
        "Kadett / Ipanema": ["1.8", "2.0", "2.0 GSi"],
        "Omega / Suprema": ["2.0", "2.2", "3.0 V6", "3.8 V6", "4.1 6 cil"],
        "Vectra": ["2.0", "2.0 16v", "2.2", "2.2 16v", "2.4 16v"],
        "Astra": ["1.8", "2.0", "2.0 16v"],
        "Zafira": ["2.0", "2.0 16v"],
        "Corsa / Corsa Classic": ["1.0", "1.0 16v", "1.4", "1.6", "1.6 16v", "1.8"],
        "Celta": ["1.0", "1.4"],
        "Prisma": ["1.0", "1.4"],
        "Onix": ["1.0", "1.0 Turbo", "1.4"],
        "Onix Plus": ["1.0", "1.0 Turbo"],
        "Cobalt": ["1.4", "1.8"],
        "Spin": ["1.8"],
        "Agile": ["1.4"],
        "Meriva": ["1.4", "1.8", "1.8 16v"],
        "Cruze": ["1.4 Turbo", "1.8"],
        "Montana": ["1.2 Turbo", "1.4", "1.8"],
        "Tracker": ["1.0 Turbo", "1.2 Turbo", "1.4 Turbo", "1.8", "2.0"],
        "S10": ["2.2", "2.4", "2.5", "2.8 Diesel", "4.3 V6"],
        "Blazer / Trailblazer": ["2.2", "2.4", "2.8 Diesel", "4.3 V6"],
        "Silverado / D20": ["4.1 6 cil", "4.2 Diesel", "Maxion Diesel"],
        "Equinox": ["1.5 Turbo", "2.0 Turbo"]
    },
    "Fiat": {
        "147 / Panorama / Oggi": ["1.05", "1.3"],
        "Uno / Mille": ["1.0", "1.3", "1.4", "1.5", "1.6", "1.6R", "1.4 Turbo"],
        "Premio / Elba": ["1.3", "1.5", "1.6"],
        "Fiorino": ["1.0", "1.3", "1.4", "1.5", "1.6"],
        "Tempra": ["2.0", "2.0 16v", "2.0 Turbo"],
        "Tipo": ["1.6", "2.0", "2.0 16v"],
        "Marea / Marea Weekend": ["1.6", "1.8", "2.0 20v", "2.0 20v Turbo", "2.4 20v"],
        "Brava": ["1.6", "1.8"],
        "Stilo": ["1.8", "1.8 16v", "2.4 20v"],
        "Bravo": ["1.4 Turbo", "1.8 16v"],
        "Palio / Palio Weekend": ["1.0", "1.0 16v", "1.3 16v", "1.4", "1.5", "1.6", "1.6 16v", "1.8"],
        "Siena / Grand Siena": ["1.0", "1.4", "1.5", "1.6", "1.6 16v", "1.8"],
        "Strada": ["1.3", "1.4", "1.5", "1.6", "1.6 16v", "1.8"],
        "Punto": ["1.4", "1.4 Turbo", "1.6", "1.8"],
        "Linea": ["1.4 Turbo", "1.8", "1.9"],
        "Idea": ["1.4", "1.6", "1.8"],
        "Doblo": ["1.3", "1.4", "1.6", "1.8"],
        "Mobi": ["1.0"],
        "Argo": ["1.0", "1.3", "1.8"],
        "Cronos": ["1.0", "1.3", "1.8"],
        "Pulse": ["1.0 Turbo", "1.3"],
        "Fastback": ["1.0 Turbo", "1.3 Turbo"],
        "Toro": ["1.3 Turbo", "1.8", "2.0 Diesel", "2.4"],
        "Ducato": ["2.3 Diesel", "2.8 Diesel", "2.8 Turbo Diesel"]
    },
    "Volkswagen": {
        "Fusca / Brasilia / Variant": ["1.3 (Ar)", "1.5 (Ar)", "1.6 (Ar)"],
        "Kombi": ["1.4 (Flex)", "1.5 (Ar)", "1.6 (Ar)", "1.6 Diesel"],
        "Passat (Antigo)": ["1.5", "1.6", "1.8"],
        "Gol": ["1.0", "1.0 16v", "1.0 16v Turbo", "1.6", "1.8", "2.0", "2.0 16v"],
        "Voyage": ["1.0", "1.5", "1.6", "1.8"],
        "Parati": ["1.0 16v", "1.0 16v Turbo", "1.5", "1.6", "1.8", "2.0", "2.0 16v"],
        "Saveiro": ["1.6", "1.8", "2.0"],
        "Santana / Quantum": ["1.8", "2.0"],
        "Apollo / Logus / Pointer": ["1.8", "2.0"],
        "Polo / Polo Classic": ["1.0", "1.0 Turbo", "1.4 Turbo", "1.6", "1.8", "2.0"],
        "Golf": ["1.0 TSI", "1.4 TSI", "1.6", "1.8", "1.8 Turbo", "2.0", "2.8 VR6"],
        "Bora / Jetta": ["1.4 Turbo", "2.0", "2.0 Turbo", "2.5"],
        "Passat (Importado) / Variant": ["1.8 Turbo", "2.0", "2.0 Turbo", "2.8 V6", "3.2 V6"],
        "Fox / CrossFox / SpaceFox": ["1.0", "1.6"],
        "Up!": ["1.0", "1.0 TSI (Turbo)"],
        "Virtus": ["1.0 Turbo", "1.4 Turbo", "1.6"],
        "Nivus": ["1.0 Turbo"],
        "T-Cross": ["1.0 Turbo", "1.4 Turbo"],
        "Taos": ["1.4 Turbo"],
        "Tiguan": ["1.4 Turbo", "2.0 Turbo"],
        "Touareg": ["3.2 V6", "3.6 V6", "4.2 V8"],
        "Amarok": ["2.0 Diesel", "3.0 V6 Diesel"]
    },
    "Ford": {
        "Corcel / Belina / Del Rey": ["1.4", "1.6", "1.8"],
        "Escort / Verona": ["1.6", "1.8", "1.8 16v", "2.0"],
        "Versailles / Royale": ["1.8", "2.0"],
        "Pampa": ["1.6", "1.8"],
        "Ka": ["1.0", "1.3", "1.5", "1.6", "1.0 3cil"],
        "Fiesta": ["1.0", "1.0 Supercharger", "1.3", "1.4 16v", "1.5", "1.6"],
        "Focus": ["1.6", "1.8 16v", "2.0 16v"],
        "Mondeo": ["1.8", "2.0", "2.5 V6"],
        "Fusion": ["2.0 Turbo", "2.3", "2.5", "3.0 V6"],
        "EcoSport": ["1.0 Supercharger", "1.5", "1.6", "2.0"],
        "Edge": ["3.5 V6"],
        "Territory": ["1.5 Turbo"],
        "Bronco Sport": ["2.0 Turbo"],
        "Ranger": ["2.2 Diesel", "2.3", "2.5", "3.0 Diesel", "3.2 Diesel", "4.0 V6"],
        "F-1000": ["3.6 6 cil", "3.9 Diesel", "4.3 Diesel", "4.9i 6 cil"],
        "F-250": ["3.9 Diesel", "4.2 V6", "4.2 Diesel"]
    },
    "Hyundai": {
        "HB20 / HB20S / HB20X": ["1.0", "1.0 Turbo", "1.6"],
        "Creta": ["1.0 Turbo", "1.6", "2.0"],
        "Tucson": ["1.6 Turbo", "2.0", "2.7 V6"],
        "ix35": ["2.0"],
        "Santa Fe / Vera Cruz": ["2.4", "2.7 V6", "3.3 V6", "3.5 V6", "3.8 V6"],
        "i30 / i30 CW": ["1.6", "1.8", "2.0"],
        "Elantra": ["1.8", "2.0"],
        "Sonata": ["2.4"],
        "Azera": ["3.0 V6", "3.3 V6"],
        "Veloster": ["1.6"],
        "HR": ["2.5 Diesel"]
    },
    "Toyota": {
        "Bandeirante": ["3.7 Diesel", "3.8 Diesel", "4.0 Diesel"],
        "Corolla / Fielder": ["1.6", "1.8", "1.8 Híbrido", "2.0"],
        "Corolla Cross": ["1.8 Híbrido", "2.0"],
        "Etios": ["1.3", "1.5"],
        "Yaris": ["1.3", "1.5"],
        "Camry": ["2.2", "2.4", "3.0 V6", "3.5 V6"],
        "RAV4": ["2.0", "2.4", "2.5 Híbrido"],
        "Hilux": ["2.4 Diesel", "2.5 Diesel", "2.7", "2.8 Diesel", "3.0 Diesel"],
        "SW4": ["2.7", "2.8 Diesel", "3.0 Diesel", "4.0 V6"]
    },
    "Honda": {
        "Civic": ["1.5 Turbo", "1.6", "1.7", "1.8", "2.0", "2.0 Turbo (Type R)"],
        "Fit": ["1.4", "1.5"],
        "City": ["1.5"],
        "HR-V": ["1.5", "1.5 Turbo", "1.8"],
        "CR-V": ["1.5 Turbo", "2.0", "2.4"],
        "WR-V": ["1.5"],
        "Accord": ["2.0", "2.0 Turbo", "2.4", "3.0 V6", "3.5 V6"]
    },
    "Renault": {
        "Clio": ["1.0", "1.0 16v", "1.6", "1.6 16v"],
        "Twingo": ["1.0", "1.2"],
        "Logan / Sandero": ["1.0", "1.0 16v", "1.6", "1.6 16v", "2.0"],
        "Kwid": ["1.0"],
        "Megane / Scenic": ["1.6", "2.0", "2.0 16v"],
        "Fluence": ["2.0", "2.0 Turbo"],
        "Duster / Oroch": ["1.3 Turbo", "1.6", "2.0"],
        "Captur": ["1.3 Turbo", "1.6", "2.0"],
        "Kangoo": ["1.0", "1.6"],
        "Master / Trafic": ["2.0", "2.2", "2.3 Diesel", "2.5 Diesel"]
    },
    "Peugeot": {
        "206 / 207 / Hoggar": ["1.0", "1.4", "1.6", "1.6 16v"],
        "208": ["1.0", "1.0 Turbo", "1.2", "1.5", "1.6"],
        "307 / 308": ["1.6", "1.6 THP (Turbo)", "2.0"],
        "408": ["1.6 THP (Turbo)", "2.0"],
        "2008 / 3008 / 5008": ["1.6", "1.6 THP (Turbo)"],
        "Partner / Boxer": ["1.6", "1.8", "2.3 Diesel", "2.8 Diesel"]
    },
    "Citroën": {
        "C3": ["1.0", "1.2", "1.4", "1.5", "1.6"],
        "C4 / Pallas / Lounge": ["1.6 THP (Turbo)", "2.0"],
        "C4 Cactus / Aircross": ["1.5", "1.6", "1.6 THP (Turbo)"],
        "Xsara / Xsara Picasso": ["1.6", "2.0"],
        "Berlingo / Jumper": ["1.6", "1.8", "2.3 Diesel", "2.8 Diesel"]
    },
    "Jeep": {
        "Willys / Rural": ["2.6 6 cil", "3.0 6 cil"],
        "Renegade": ["1.3 Turbo", "1.8", "2.0 Diesel"],
        "Compass": ["1.3 Turbo", "2.0", "2.0 Diesel"],
        "Commander": ["1.3 Turbo", "2.0 Diesel"],
        "Cherokee / Grand Cherokee": ["3.0 V6 Diesel", "3.2 V6", "3.6 V6", "3.7 V6", "4.0 6 cil", "4.7 V8", "5.2 V8"]
    },
    "Nissan": {
        "March / Versa": ["1.0", "1.6"],
        "Kicks": ["1.6"],
        "Sentra": ["2.0"],
        "Tiida / Livina": ["1.8"],
        "Frontier / Xterra": ["2.3 Diesel", "2.5 Diesel", "2.8 Diesel"],
        "Pathfinder": ["3.3 V6", "4.0 V6"]
    },
    "Mitsubishi": {
        "Lancer": ["2.0", "2.0 Turbo (Evo)"],
        "ASX / Outlander": ["2.0", "2.2 Diesel", "3.0 V6"],
        "Pajero (TR4 / Dakar / Full)": ["2.0", "2.4 Diesel", "3.2 Diesel", "3.5 V6", "3.8 V6"],
        "L200 (Triton / Savana)": ["2.4 Diesel", "2.5 Diesel", "3.2 Diesel", "3.5 V6"]
    }
};

// ==========================================
// 3. CAMADA DE BANCO DE DADOS
// ==========================================
class BancoDeDados {
    // Todos os dados ficam dentro da oficina: oficinas/{oficinaId}/{coleção}
    constructor(db, oficinaId) {
        this.db = db;
        this.oficinaId = oficinaId;
    }

    col(nome) {
        return collection(this.db, "oficinas", this.oficinaId, nome);
    }

    ref(nome, id) {
        return doc(this.db, "oficinas", this.oficinaId, nome, id);
    }

    async buscarVeiculoPorPlaca(placa) {
        try {
            const veiculosRef = this.col("veiculos");
            const q = query(veiculosRef, where("placa", "==", placa.toUpperCase()));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data();
            }
            return null; 
        } catch (error) {
            console.error("Erro ao buscar placa:", error);
            throw error;
        }
    }


    
    async salvarNovaOS(dadosOS) {
        try {
            // Salva a Ordem de Serviço
            const osRef = this.col("ordens_servico");
            await addDoc(osRef, dadosOS);

            // Atualiza ou Cria o cadastro do Veículo no banco para preencher sozinho na próxima vez
            const veiculoRef = this.ref("veiculos", dadosOS.placa);
            await setDoc(veiculoRef, {
                placa: dadosOS.placa,
                nomeCliente: dadosOS.nomeCliente,
                marcaCarro: dadosOS.marcaCarro,
                modeloCarro: dadosOS.modeloCarro,
                litragemCarro: dadosOS.litragemCarro,
                anoCarro: dadosOS.anoCarro
            }, { merge: true });

            return true;
        } catch (error) {
            console.error("Erro ao salvar OS:", error);
            throw error;
        }
    }

    async buscarUltimasOS() {
        try {
            const osRef = this.col("ordens_servico");
            // Busca as últimas 200 OSs ordenadas pela data de entrada
            const q = query(osRef, orderBy("dataEntrada", "desc"), limit(200));
            const querySnapshot = await getDocs(q);
            
            let listaOS = [];
            querySnapshot.forEach((doc) => {
                listaOS.push({ id: doc.id, ...doc.data() });
            });
            return listaOS;
        } catch (error) {
            console.error("Erro ao buscar histórico de OS:", error);
            throw error;
        }
    }

async atualizarOS(id, dadosOS) {
        try {
            const osRef = this.ref("ordens_servico", id);
            await updateDoc(osRef, dadosOS);
            
            // Atualiza também o cadastro do veículo para manter os dados sincronizados
            const veiculoRef = this.ref("veiculos", dadosOS.placa);
            await setDoc(veiculoRef, {
                placa: dadosOS.placa,
                nomeCliente: dadosOS.nomeCliente,
                marcaCarro: dadosOS.marcaCarro,
                modeloCarro: dadosOS.modeloCarro,
                litragemCarro: dadosOS.litragemCarro,
                anoCarro: dadosOS.anoCarro
            }, { merge: true });
            
            return true;
        } catch (error) {
            console.error("Erro ao atualizar OS:", error);
            throw error;
        }
    }

    async excluirOS(id) {
        try {
            const osRef = this.ref("ordens_servico", id);
            await deleteDoc(osRef);
            return true;
        } catch (error) {
            console.error("Erro ao excluir OS:", error);
            throw error;
        }
    }

    // ---------- FUNCIONÁRIOS ----------
    // O id do funcionário é a chave usada em os.comissao (ex: { carlos: 40 }).
    async listarFuncionarios() {
        const snapshot = await getDocs(this.col("funcionarios"));
        const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    }

    async adicionarFuncionario(nome) {
        await addDoc(this.col("funcionarios"), { nome, ativo: true, criadoEm: new Date().toISOString() });
    }

    async atualizarFuncionario(id, dados) {
        await updateDoc(this.ref("funcionarios", id), dados);
    }

    // ---------- OFICINA, USUÁRIOS E CONVITES ----------
    async atualizarOficina(dados) {
        await updateDoc(doc(this.db, "oficinas", this.oficinaId), dados);
    }

    async listarUsuarios() {
        const q = query(collection(this.db, "usuarios"), where("oficinaId", "==", this.oficinaId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
    }

    async removerUsuario(uid) {
        await deleteDoc(doc(this.db, "usuarios", uid));
    }

    async listarConvites() {
        const q = query(collection(this.db, "convites"), where("oficinaId", "==", this.oficinaId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ email: d.id, ...d.data() }));
    }

    async convidar(email, oficinaNome, convidadoPor) {
        await setDoc(doc(this.db, "convites", email), {
            oficinaId: this.oficinaId,
            oficinaNome,
            convidadoPor,
            criadoEm: new Date().toISOString()
        });
    }

    async cancelarConvite(email) {
        await deleteDoc(doc(this.db, "convites", email));
    }

    // ---------- BACKUP ----------
    // Junta todos os dados da oficina num objeto só (para baixar como arquivo)
    async gerarBackup() {
        const backup = { geradoEm: new Date().toISOString(), oficinaId: this.oficinaId };
        for (const nome of COLECOES_DA_OFICINA) {
            const snapshot = await getDocs(this.col(nome));
            backup[nome] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        return backup;
    }

    // ---------- DADOS DO SISTEMA ANTIGO ----------
    // Antes do login, os dados ficavam na raiz do banco (sem oficina).
    // Depois que as regras novas forem publicadas, a raiz fica bloqueada e isto devolve false.
    async existemDadosAntigos() {
        try {
            const jaImportado = await getDoc(doc(this.db, "migracao", "legado"));
            if (jaImportado.exists()) return false;
            const amostra = await getDocs(query(collection(this.db, "ordens_servico"), limit(1)));
            return !amostra.empty;
        } catch {
            return false;
        }
    }

    // Copia as coleções antigas da raiz para dentro da oficina, mantendo os mesmos ids
    async importarDadosAntigos(aoProgredir) {
        const resumo = {};
        for (const nome of COLECOES_DA_OFICINA) {
            const snapshot = await getDocs(collection(this.db, nome));
            resumo[nome] = snapshot.size;
            // O Firestore aceita até 500 gravações por lote
            for (let i = 0; i < snapshot.docs.length; i += 400) {
                const lote = writeBatch(this.db);
                snapshot.docs.slice(i, i + 400).forEach(d => lote.set(this.ref(nome, d.id), d.data()));
                await lote.commit();
                aoProgredir?.(`${nome}: ${Math.min(i + 400, snapshot.size)} de ${snapshot.size}`);
            }
        }
        // Marca como importado, para nenhuma outra conta importar de novo
        await setDoc(doc(this.db, "migracao", "legado"), { oficinaId: this.oficinaId, importadoEm: new Date().toISOString(), resumo });
        return resumo;
    }


}

// ==========================================
// 4. CAMADA DE INTERFACE
// ==========================================
class Interface {
    constructor() {
        this.formOS = document.getElementById("formOS");
        this.alertaBusca = document.getElementById("alertaBusca");
        this.areaHistorico = document.getElementById("areaHistorico");
        
        // Inputs
        this.inputPlaca = document.getElementById("placaBusca");
        this.inputNome = document.getElementById("nomeCliente");
        
        // Selects em Cascata
        this.selectMarca = document.getElementById("marcaCarro");
        this.inputOutraMarca = document.getElementById("outraMarca");
        
        this.selectModelo = document.getElementById("modeloCarro");
        this.inputOutroModelo = document.getElementById("outroModelo");
        
        this.selectLitragem = document.getElementById("litragemCarro");
        this.inputOutraLitragem = document.getElementById("outraLitragem");
        
        this.inputAno = document.getElementById("anoCarro");
        this.setarDataAtual();

        this.carregarMarcas();
    }

setarDataAtual() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        const campoData = document.getElementById("dataOS");
        if(campoData) {
            campoData.value = `${ano}-${mes}-${dia}`;
        }
    }

    carregarMarcas() {
        Object.keys(frotaBrasil).sort().forEach(marca => {
            const option = document.createElement("option");
            option.value = marca;
            option.textContent = marca;
            this.selectMarca.insertBefore(option, this.selectMarca.lastElementChild);
        });
    }

    mostrarCarregando(buscando) {
        const btn = document.getElementById("btnBuscarPlaca");
        if (buscando) {
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            btn.disabled = true;
        } else {
            btn.innerHTML = 'Buscar';
            btn.disabled = false;
        }
    }

    

    mostrarFormulario(veiculoExiste, dadosVeiculo = null) {
        this.formOS.classList.remove("d-none");
        
        if (veiculoExiste) {
            this.alertaBusca.innerHTML = `<span class="text-success"><i class="bi bi-check-circle-fill"></i> Veículo encontrado</span>`;
            this.inputNome.value = dadosVeiculo.nomeCliente || ""; 
            
            // Preenche a MARCA
            if (dadosVeiculo.marcaCarro) {
                if (!frotaBrasil[dadosVeiculo.marcaCarro]) {
                    this.selectMarca.value = "OUTRA";
                    this.inputOutraMarca.classList.remove("d-none");
                    this.inputOutraMarca.value = dadosVeiculo.marcaCarro;
                } else {
                    this.selectMarca.value = dadosVeiculo.marcaCarro;
                    this.selectMarca.dispatchEvent(new Event("change"));
                }
            }
            
            // Preenche o MODELO
            if (dadosVeiculo.modeloCarro) {
                if (this.selectMarca.value === "OUTRA" || !frotaBrasil[dadosVeiculo.marcaCarro][dadosVeiculo.modeloCarro]) {
                    this.selectModelo.value = "OUTRO";
                    this.inputOutroModelo.classList.remove("d-none");
                    this.inputOutroModelo.value = dadosVeiculo.modeloCarro;
                } else {
                    this.selectModelo.value = dadosVeiculo.modeloCarro;
                    this.selectModelo.dispatchEvent(new Event("change"));
                }
            }

            // Preenche a LITRAGEM
            if (dadosVeiculo.litragemCarro) {
                let motorNaLista = false;
                if (frotaBrasil[dadosVeiculo.marcaCarro] && frotaBrasil[dadosVeiculo.marcaCarro][dadosVeiculo.modeloCarro]) {
                    motorNaLista = frotaBrasil[dadosVeiculo.marcaCarro][dadosVeiculo.modeloCarro].includes(dadosVeiculo.litragemCarro);
                }

                if (!motorNaLista) {
                    this.selectLitragem.value = "OUTRO";
                    this.inputOutraLitragem.classList.remove("d-none");
                    this.inputOutraLitragem.value = dadosVeiculo.litragemCarro;
                } else {
                    this.selectLitragem.value = dadosVeiculo.litragemCarro;
                }
            }
            
            this.inputAno.value = dadosVeiculo.anoCarro || "";
            this.areaHistorico.classList.remove("d-none");
        } else {
            this.alertaBusca.innerHTML = `<span class="text-primary"><i class="bi bi-plus-circle-fill"></i> Veículo novo: preencha os dados</span>`;
            this.inputNome.value = "";
            this.selectMarca.value = "";
            this.inputOutraMarca.value = "";
            this.inputOutraMarca.classList.add("d-none");
            
            this.selectModelo.innerHTML = '<option value="">Aguardando marca...</option>';
            this.selectModelo.disabled = true;
            this.inputOutroModelo.value = "";
            this.inputOutroModelo.classList.add("d-none");
            
            this.selectLitragem.innerHTML = '<option value="">Aguardando modelo...</option>';
            this.selectLitragem.disabled = true;
            this.inputOutraLitragem.value = "";
            this.inputOutraLitragem.classList.add("d-none");
            
            this.inputAno.value = "";
            this.areaHistorico.classList.add("d-none");
        }
    }

    limparFormulario() {
        this.formOS.reset();
        this.formOS.classList.add("d-none");
        this.inputPlaca.value = "";
        this.alertaBusca.innerHTML = "";
        this.setarDataAtual();
        this.inputOutraMarca.classList.add("d-none");
        this.inputOutroModelo.classList.add("d-none");
        this.inputOutraLitragem.classList.add("d-none");
        
        this.selectModelo.disabled = true;
        this.selectModelo.innerHTML = '<option value="">Aguardando marca...</option>';
        this.selectLitragem.disabled = true;
        this.selectLitragem.innerHTML = '<option value="">Aguardando modelo...</option>';
        document.getElementById("containerOutrosRepasses").innerHTML = '<div class="row repasse-item mb-2"><div class="col-8"><input type="text" class="form-control repasse-desc" placeholder="Descrição do gasto (Ex: Peças)"></div><div class="col-4"><input type="number" step="0.01" class="form-control repasse-valor" placeholder="R$ 0.00"></div></div>';
    }
}

// ==========================================
// 5. CONTROLADOR PRINCIPAL
// ==========================================
class App {
    // sessao: { usuario, perfil, oficina, sair } vinda do login (acesso.js)
    constructor(sessao) {
        this.sessao = sessao;
        this.bd = new BancoDeDados(db, sessao.oficina.id);
        this.ui = new Interface();
        // Variáveis de controle para a Consulta
        this.todasAsOS = [];
        this.osFiltradas = [];
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
        this.osEmEdicaoId = null; // Guarda o ID da OS sendo editada
        this.osSelecionadaParaModal = null; // Guarda os dados da OS aberta no modal
        this.dadosFinanceirosAtuais = { oficina: [], gastos: [], funcionarios: {} };
        this.totaisFinanceiros = { oficina: 0, gastos: 0, funcionarios: {} };
        
        this.filaIA = []; // OS extraídas pela IA esperando para serem conferidas
        this.totalFilaIA = 0;
        this.funcionarios = []; // Equipe carregada do banco ({ id, nome, ativo })
        this.funcionarioEmEdicao = null;

        this.inicializarEventosConsulta();

        this.inicializarEventos();
        this.inicializarEquipe();
        this.inicializarConta();
        this.carregarFuncionarios();
        this.verificarDadosAntigos();

        this.assistente = new Assistente(
            frotaBrasil,
            (ordens) => this.receberOrdensIA(ordens),
            () => this.funcionarios.filter(f => f.ativo !== false).map(f => f.nome)
        );
        
        // Aquecimento silencioso da conexão
        this.bd.buscarVeiculoPorPlaca("AQUECIMENTO").catch(() => {});
    }

    inicializarEventos() {
        document.getElementById("btnBuscarPlaca").addEventListener("click", () => this.lidarComBuscaPlaca());
        document.getElementById("formOS").addEventListener("submit", (e) => this.lidarComSalvamento(e));
        document.getElementById("btnCancelar").addEventListener("click", () => {
            this.ui.limparFormulario();
            this.renderizarCamposRepasse();
            this.encerrarFilaIA();
            // Sai do modo de edição, senão a próxima OS nova sobrescreveria a editada
            this.osEmEdicaoId = null;
            document.getElementById("tituloPagina").textContent = "Nova Ordem de Serviço";
            document.querySelector("#formOS button[type='submit']").textContent = "Salvar Ordem";
        });
        this.ui.inputPlaca.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.lidarComBuscaPlaca();
        });
        document.getElementById("btnPularOSIA").addEventListener("click", () => this.carregarProximaOSIA());

        // Mudança na MARCA
        this.ui.selectMarca.addEventListener("change", (e) => {
            const marca = e.target.value;
            this.ui.selectModelo.innerHTML = '<option value="">Selecione o modelo...</option>';
            this.ui.selectLitragem.innerHTML = '<option value="">Aguardando modelo...</option>';
            this.ui.selectLitragem.disabled = true;
            
            this.ui.inputOutraMarca.classList.add("d-none");
            this.ui.inputOutroModelo.classList.add("d-none");
            this.ui.inputOutraLitragem.classList.add("d-none");

            if (marca === "OUTRA") {
                this.ui.inputOutraMarca.classList.remove("d-none");
                this.ui.selectModelo.disabled = true;
                this.ui.inputOutroModelo.classList.remove("d-none"); 
                this.ui.selectLitragem.disabled = true;
                this.ui.inputOutraLitragem.classList.remove("d-none");
            } else if (marca !== "") {
                this.ui.selectModelo.disabled = false;
                Object.keys(frotaBrasil[marca]).sort().forEach(modelo => {
                    const opt = document.createElement("option");
                    opt.value = modelo;
                    opt.textContent = modelo;
                    this.ui.selectModelo.appendChild(opt);
                });
                const optOutro = document.createElement("option");
                optOutro.value = "OUTRO";
                optOutro.textContent = "Outro modelo...";
                this.ui.selectModelo.appendChild(optOutro);
            } else {
                this.ui.selectModelo.disabled = true;
            }
        });

        // Mudança no MODELO
        this.ui.selectModelo.addEventListener("change", (e) => {
            const modelo = e.target.value;
            const marcaSelecionada = this.ui.selectMarca.value;
            this.ui.selectLitragem.innerHTML = '<option value="">Selecione o motor...</option>';
            
            this.ui.inputOutroModelo.classList.add("d-none");
            this.ui.inputOutraLitragem.classList.add("d-none");

            if (modelo === "OUTRO") {
                this.ui.inputOutroModelo.classList.remove("d-none");
                this.ui.selectLitragem.disabled = true;
                this.ui.inputOutraLitragem.classList.remove("d-none");
            } else if (modelo !== "") {
                this.ui.selectLitragem.disabled = false;
                const motores = frotaBrasil[marcaSelecionada][modelo];
                motores.forEach(motor => {
                    const opt = document.createElement("option");
                    opt.value = motor;
                    opt.textContent = motor;
                    this.ui.selectLitragem.appendChild(opt);
                });
                const optOutro = document.createElement("option");
                optOutro.value = "OUTRO";
                optOutro.textContent = "Outro motor...";
                this.ui.selectLitragem.appendChild(optOutro);
            } else {
                this.ui.selectLitragem.disabled = true;
            }
        });

        // Mudança na LITRAGEM
        this.ui.selectLitragem.addEventListener("change", (e) => {
            if (e.target.value === "OUTRO") {
                this.ui.inputOutraLitragem.classList.remove("d-none");
            } else {
                this.ui.inputOutraLitragem.classList.add("d-none");
            }
        });

        // Lógica para o botão "Ver Ordens Anteriores"
        document.getElementById("btnVerHistorico").addEventListener("click", (e) => {
            e.preventDefault(); // Impede o navegador de tentar validar/enviar o formulário
            
            const placaAtual = this.ui.inputPlaca.value.toUpperCase();
            
            // Simula o clique na aba de consulta para mudar a tela
            document.getElementById("btnAbaConsulta").click();
            
            // Preenche o campo de busca de placa na tela de consulta
            document.getElementById("filtroPlaca").value = placaAtual;
            
            // Aguarda um curto intervalo para dar tempo do banco carregar os dados iniciais
            // e então aplica o filtro focado apenas no veículo do cliente
            setTimeout(() => {
                this.aplicarFiltros();
            }, 800);
        });

        // Lógica para campos dinâmicos de repasse/gastos
        const containerRepasses = document.getElementById("containerOutrosRepasses");
        containerRepasses.addEventListener("input", (e) => {
            if (e.target.classList.contains("repasse-desc")) {
                const rows = containerRepasses.querySelectorAll(".repasse-item");
                const lastRow = rows[rows.length - 1];
                const lastInput = lastRow.querySelector(".repasse-desc");
                
                // Se o usuário digitou no último campo, cria uma nova linha automaticamente
                if (e.target === lastInput && e.target.value.trim() !== "") {
                    const newRow = document.createElement("div");
                    newRow.className = "row repasse-item mb-2";
                    newRow.innerHTML = `
                        <div class="col-8">
                            <input type="text" class="form-control repasse-desc" placeholder="Descrição do gasto">
                        </div>
                        <div class="col-4">
                            <input type="number" step="0.01" class="form-control repasse-valor" placeholder="R$ 0.00">
                        </div>
                    `;
                    containerRepasses.appendChild(newRow);
                }
            }
        });

// Formatar Quilometragem automaticamente (adicionar pontos)
        const inputKm = document.getElementById("quilometragem");
        inputKm.addEventListener("input", (e) => {
            // Remove tudo que não for número
            let valor = e.target.value.replace(/\D/g, ""); 
            if (valor !== "") {
                // Formata no padrão brasileiro (ex: 200.560)
                e.target.value = parseInt(valor, 10).toLocaleString('pt-BR');
            } else {
                e.target.value = "";
            }
        });


// Calcula o Grande Total automaticamente
        const atualizarGrandeTotal = () => {
            const maoDeObra = parseFloat(document.getElementById("valorMaoDeObra").value) || 0;
            let gastos = 0;
            document.querySelectorAll(".repasse-valor").forEach(input => {
                gastos += parseFloat(input.value) || 0;
            });
            const total = maoDeObra + gastos;
            document.getElementById("valorGrandeTotal").value = total.toFixed(2);
        };

        // Escuta digitação na Mão de Obra
        document.getElementById("valorMaoDeObra").addEventListener("input", atualizarGrandeTotal);
        
        // Escuta digitação nos Gastos/Peças
        document.getElementById("containerOutrosRepasses").addEventListener("input", (e) => {
            if (e.target.classList.contains("repasse-valor")) {
                atualizarGrandeTotal();
            }
        });


    }

    async lidarComBuscaPlaca() {
        const placa = this.ui.inputPlaca.value.trim();
        if (placa.length < 7) {
            mostrarToast("Digite uma placa válida.", "erro");
            return;
        }

        this.ui.mostrarCarregando(true);

        try {
            const veiculo = await this.bd.buscarVeiculoPorPlaca(placa);
            if (veiculo) {
                this.ui.mostrarFormulario(true, veiculo);
            } else {
                this.ui.mostrarFormulario(false);
            }
        } catch (error) {
            console.error("ERRO DETALHADO DO FIREBASE:", error);
            mostrarToast("Erro de conexão com o banco de dados.", "erro");
            this.ui.formOS.classList.add("d-none"); 
        } finally {
            this.ui.mostrarCarregando(false);
        }
    }

    async lidarComSalvamento(evento) {
        evento.preventDefault();

        // Extrai os valores finais dependendo de se o usuário usou as listas ou digitou
        let marcaFinal = this.ui.selectMarca.value === "OUTRA" ? this.ui.inputOutraMarca.value.trim().toUpperCase() : this.ui.selectMarca.value;
        let modeloFinal = (this.ui.selectMarca.value === "OUTRA" || this.ui.selectModelo.value === "OUTRO") ? this.ui.inputOutroModelo.value.trim().toUpperCase() : this.ui.selectModelo.value;
        let litragemFinal = (this.ui.selectMarca.value === "OUTRA" || this.ui.selectModelo.value === "OUTRO" || this.ui.selectLitragem.value === "OUTRO") ? this.ui.inputOutraLitragem.value.trim().toUpperCase() : this.ui.selectLitragem.value;

        // Repasses: { idDoFuncionario: valor } só para quem recebeu algo
        const comissao = {};
        document.querySelectorAll(".repasse-func").forEach(input => {
            const valor = parseFloat(input.value) || 0;
            if (valor > 0) comissao[input.dataset.id] = valor;
        });
        const maoDeObra = parseFloat(document.getElementById("valorMaoDeObra").value) || 0;
        const valorTotalFinal = parseFloat(document.getElementById("valorGrandeTotal").value) || 0;

        const dataSelecionada = document.getElementById("dataOS").value;

      // Coleta os repasses extras gerados dinamicamente
        const outrosRepasses = [];
        document.querySelectorAll(".repasse-item").forEach(row => {
            const desc = row.querySelector(".repasse-desc").value.trim();
            const valor = parseFloat(row.querySelector(".repasse-valor").value) || 0;
            if (desc !== "" || valor > 0) {
                outrosRepasses.push({ descricao: desc, valor: valor });
            }
        });
    const stringKmFormatada = document.getElementById("quilometragem").value.replace(/\D/g, "");
    const dadosNovaOS = {
            data: dataSelecionada, 
            placa: this.ui.inputPlaca.value.toUpperCase(),
            nomeCliente: document.getElementById("nomeCliente").value,
            marcaCarro: marcaFinal,
            modeloCarro: modeloFinal,
            litragemCarro: litragemFinal,
            anoCarro: parseInt(document.getElementById("anoCarro").value) || 0,
            quilometragem: parseInt(stringKmFormatada) || 0,
            descricao: document.getElementById("descricao").value,
            valorMaoDeObra: maoDeObra,
            valorTotal: valorTotalFinal,
            comissao: comissao,
            outrosRepasses: outrosRepasses, // <--- NOVO CAMPO ADICIONADO AQUI
            dataEntrada: new Date().toISOString()
        };

     try {
            if (this.osEmEdicaoId) {
                await this.bd.atualizarOS(this.osEmEdicaoId, dadosNovaOS);
                mostrarToast("Ordem de serviço atualizada.");
                this.osEmEdicaoId = null; // Reseta o estado
                document.querySelector("#formOS button[type='submit']").textContent = "Salvar Ordem"; // Volta o texto do botão
            } else {
                await this.bd.salvarNovaOS(dadosNovaOS);
                mostrarToast("Ordem de serviço salva.");
            }
            this.ui.limparFormulario();
            this.renderizarCamposRepasse();
            // Se a IA extraiu mais OS, abre a próxima em vez de ir para a consulta
            if (this.filaIA.length > 0) {
                this.carregarProximaOSIA();
                return;
            }
            this.encerrarFilaIA();
            // Volta para a tela de consulta e recarrega para ver a alteração
            document.getElementById("btnAbaConsulta").click();
        } catch (error) {
            console.error(error);
            mostrarToast("Erro ao salvar os dados. Tente de novo.", "erro");
        }
    }

    inicializarEventosConsulta() {
        const btnNova = document.getElementById("btnAbaNovaOS");
        const btnConsulta = document.getElementById("btnAbaConsulta");
        const btnFinanceiro = document.getElementById("btnAbaFinanceiro");
        const containerNova = document.getElementById("containerNovaOS");
        const containerConsulta = document.getElementById("containerConsultaOS");
        const containerFinanceiro = document.getElementById("containerFinanceiro");
        const btnEquipe = document.getElementById("btnAbaEquipe");
        const containerEquipe = document.getElementById("containerEquipe");
        const titulo = document.getElementById("tituloPagina");

        // Mostra uma tela e marca a aba correspondente como ativa
        const abrirTela = (botao, container, textoTitulo) => {
            [btnNova, btnConsulta, btnFinanceiro, btnEquipe].forEach(btn => btn.classList.remove("active"));
            [containerNova, containerConsulta, containerFinanceiro, containerEquipe].forEach(cont => cont.classList.add("d-none"));
            botao.classList.add("active");
            container.classList.remove("d-none");
            titulo.textContent = textoTitulo;
            window.scrollTo({ top: 0 });
        };

        // Alternar para tela de Nova OS
        btnNova.addEventListener("click", () => {
            abrirTela(btnNova, containerNova, "Nova Ordem de Serviço");
        });

        // Alternar para tela de Consulta
        btnConsulta.addEventListener("click", () => {
            abrirTela(btnConsulta, containerConsulta, "Ordens de Serviço");
            this.carregarDadosIniciaisConsulta();
        });

        // Alternar para tela Financeira
        btnFinanceiro.addEventListener("click", async () => {
            abrirTela(btnFinanceiro, containerFinanceiro, "Financeiro");
            
            // Seta o mês atual no filtro se estiver vazio
            const filtroMes = document.getElementById("filtroMesFinanceiro");
            if (!filtroMes.value) {
                const hoje = new Date();
                const ano = hoje.getFullYear();
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                filtroMes.value = `${ano}-${mes}`;
            }
            await this.processarFinanceiro(filtroMes.value);
        });

        // Evento de mudança de mês no financeiro
        document.getElementById("filtroMesFinanceiro").addEventListener("change", (e) => {
            this.processarFinanceiro(e.target.value);
        });

        // Alternar para tela da Equipe
        btnEquipe.addEventListener("click", () => {
            abrirTela(btnEquipe, containerEquipe, "Equipe");
            this.renderizarEquipe();
        });

        // Botões dos cartões do Financeiro (Detalhes e WhatsApp).
        // Um único ouvinte no grupo, porque os cartões dos funcionários são criados na hora.
        document.getElementById("splitGrid").addEventListener("click", (e) => {
            const btnDetalhes = e.target.closest(".btn-expandir-fin");
            const btnWhats = e.target.closest(".btn-whats-fin");
            if (btnDetalhes) this.abrirModalFinanceiro(btnDetalhes.dataset.tipo);
            if (btnWhats) this.exportarWhats(btnWhats.dataset.tipo);
        });
        document.getElementById("btnWhatsGeral").addEventListener("click", () => this.exportarWhats("geral"));

        // Enter na busca por placa já filtra
        document.getElementById("filtroPlaca").addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.aplicarFiltros();
        });

        // Botões de Filtro e Paginação
        document.getElementById("btnAplicarFiltros").addEventListener("click", () => this.aplicarFiltros());
        document.getElementById("btnLimparFiltros").addEventListener("click", () => {
            document.getElementById("filtroData").value = "";
            document.getElementById("filtroPlaca").value = "";
            document.getElementById("filtroMarca").value = "";
            document.getElementById("filtroModelo").value = "";
            this.aplicarFiltros();
        });

        document.getElementById("btnPaginaAnterior").addEventListener("click", () => {
            if (this.paginaAtual > 1) {
                this.paginaAtual--;
                this.renderizarTabelaOS();
            }
        });

        document.getElementById("btnPaginaProxima").addEventListener("click", () => {
            const maxPaginas = Math.ceil(this.osFiltradas.length / this.itensPorPagina);
            if (this.paginaAtual < maxPaginas) {
                this.paginaAtual++;
                this.renderizarTabelaOS();
            }
        });

        // Captura cliques nos botões "Ver" dentro da tabela
        document.getElementById("tabelaOSBody").addEventListener("click", (e) => {
            const btnVer = e.target.closest(".btn-ver-os");
            if (btnVer) {
                const id = btnVer.getAttribute("data-id");
                this.abrirModalDetalhes(id);
            }
        });

        // Ações do Modal
        document.getElementById("btnEditarOS").addEventListener("click", () => this.prepararEdicaoOS());
        document.getElementById("btnExcluirOS").addEventListener("click", () => this.confirmarExclusaoOS());
        document.getElementById("btnImprimirOS").addEventListener("click", () => this.imprimirReciboOS());
    }

   async carregarDadosIniciaisConsulta() {
        document.getElementById("tabelaOSBody").innerHTML = '<div class="empty-state"><span class="spinner-border spinner-border-sm me-2"></span>Carregando ordens de serviço...</div>';
        try {
            this.todasAsOS = await this.bd.buscarUltimasOS();
            
            // NOVA LÓGICA DE ORDENAÇÃO: Força a lista inteira a se organizar pela data da OS escolhida
            this.todasAsOS.sort((a, b) => {
                const dataA = (dataDaOS(a) || '0000-00-00');
                const dataB = (dataDaOS(b) || '0000-00-00');
                
                // Se as datas do serviço forem iguais, desempata pela hora exata de salvamento
                if (dataA === dataB) {
                    const horaA = String(a.dataEntrada || '0000');
                    const horaB = String(b.dataEntrada || '0000');
                    return horaB.localeCompare(horaA);
                }
                // Ordena de forma decrescente (Maior/Mais nova sempre no topo)
                return dataB.localeCompare(dataA); 
            });

            this.osFiltradas = [...this.todasAsOS]; // Começa mostrando todas
            this.paginaAtual = 1;
            this.renderizarTabelaOS();
        } catch (error) {
            document.getElementById("tabelaOSBody").innerHTML = '<div class="empty-state erro"><i class="bi bi-exclamation-triangle me-1"></i> Erro ao carregar do banco de dados.</div>';
        }
    }

    aplicarFiltros() {
        const dataBusca = document.getElementById("filtroData").value;
        const placaBusca = document.getElementById("filtroPlaca").value.toUpperCase().trim();
        const marcaBusca = document.getElementById("filtroMarca").value.toUpperCase().trim();
        const modeloBusca = document.getElementById("filtroModelo").value.toUpperCase().trim();

        // Filtra a lista mantida na memória
        this.osFiltradas = this.todasAsOS.filter(os => {
            let passa = true;
            // Valida a data nova (os.data) ou converte a data antiga (os.dataEntrada)
            if (dataBusca) {
                const dataOsFormatada = (dataDaOS(os) || null);
                if (dataOsFormatada !== dataBusca) passa = false;
            }
            if (placaBusca && !String(os.placa || "").toUpperCase().includes(placaBusca)) passa = false;
            if (marcaBusca && !String(os.marcaCarro || "").toUpperCase().includes(marcaBusca)) passa = false;
            if (modeloBusca && !String(os.modeloCarro || "").toUpperCase().includes(modeloBusca)) passa = false;
            
            return passa;
        });

        this.paginaAtual = 1; // Reseta para a página 1 após filtrar
        this.renderizarTabelaOS();
    }

   renderizarTabelaOS() {
        const tbody = document.getElementById("tabelaOSBody");
        tbody.innerHTML = "";

        if (this.osFiltradas.length === 0) {
            tbody.innerHTML = '<div class="empty-state"><i class="bi bi-inbox d-block fs-3 mb-2"></i>Nenhuma ordem de serviço encontrada.</div>';
            document.getElementById("textoPaginacao").textContent = "Página 1 de 1";
            document.getElementById("btnPaginaAnterior").disabled = true;
            document.getElementById("btnPaginaProxima").disabled = true;
            return;
        }

        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = inicio + this.itensPorPagina;
        const osPaginadas = this.osFiltradas.slice(inicio, fim);

        // Agrupa as OS por data no formato YYYY-MM-DD para o JavaScript não perder a ordem matemática
        const gruposPorData = {};
        osPaginadas.forEach(os => {
            const dataBase = (dataDaOS(os) || '0000-00-00');
            
            if (!gruposPorData[dataBase]) gruposPorData[dataBase] = [];
            gruposPorData[dataBase].push(os);
        });

        // Garante que a renderização na tela siga estritamente a ordem decrescente das datas agrupadas
        const datasOrdenadas = Object.keys(gruposPorData).sort((a, b) => b.localeCompare(a));

        // Renderiza separando por blocos de data
        datasOrdenadas.forEach(dataBase => {
            // Formata para exibição padrão brasileiro DD/MM/YYYY
            let dataExibicao = "Sem Data";
            if (dataBase !== '0000-00-00') {
                const partes = dataBase.split('-');
                if (partes.length === 3) dataExibicao = `${partes[2]}/${partes[1]}/${partes[0]}`;
            }

            // Cabeçalho do grupo de data
            const cabecalhoData = document.createElement("div");
            cabecalhoData.className = "os-group-date";
            cabecalhoData.textContent = dataExibicao;
            tbody.appendChild(cabecalhoData);

            // Cartões das OS (o cartão inteiro abre os detalhes)
            gruposPorData[dataBase].forEach(os => {
                const cartao = document.createElement("button");
                cartao.type = "button";
                cartao.className = "os-card btn-ver-os";
                cartao.dataset.id = os.id;
                const veiculo = [os.marcaCarro, os.modeloCarro].filter(Boolean).join(" ") || "Veículo";
                cartao.innerHTML = `
                    <div class="os-card-main">
                        <div class="os-card-top">
                            <span class="placa-tag">${esc(os.placa || '-')}</span>
                            <span class="os-card-car">${esc(veiculo)}</span>
                        </div>
                        <div class="os-card-desc">${esc(os.descricao || 'Sem descrição')}</div>
                        <div class="os-card-client"><i class="bi bi-person"></i> ${esc(os.nomeCliente || '-')}</div>
                    </div>
                    <div class="os-card-value">
                        ${formatarMoeda(os.valorTotal)}
                        <i class="bi bi-chevron-right"></i>
                    </div>
                `;
                tbody.appendChild(cartao);
            });
        });

        const maxPaginas = Math.ceil(this.osFiltradas.length / this.itensPorPagina);
        document.getElementById("textoPaginacao").textContent = `Página ${this.paginaAtual} de ${maxPaginas || 1}`;
        document.getElementById("btnPaginaAnterior").disabled = this.paginaAtual === 1;
        document.getElementById("btnPaginaProxima").disabled = this.paginaAtual === maxPaginas;
    }

abrirModalDetalhes(id) {
        this.osSelecionadaParaModal = this.todasAsOS.find(os => os.id === id);
        const os = this.osSelecionadaParaModal;
        if (!os) return;

        // Formata data para exibição
        let dataExibicao = "N/A";
        const dataBase = (dataDaOS(os) || null);
        if (dataBase) {
            const partes = dataBase.split('-');
            if (partes.length === 3) dataExibicao = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        let kmValor = os.quilometragem || os.kmEntrada || '';
        let kmFormatado = kmValor ? parseInt(kmValor).toLocaleString('pt-BR') + ' km' : '-';

        // Composição do valor: mão de obra, gastos e repasses
        const gastosOS = (Array.isArray(os.outrosRepasses) ? os.outrosRepasses : []).reduce((acc, rep) => acc + num(rep?.valor), 0);
        const maoDeObra = os.valorMaoDeObra !== undefined ? os.valorMaoDeObra : ((os.valorTotal || 0) - gastosOS);
        const linhasGastos = (Array.isArray(os.outrosRepasses) ? os.outrosRepasses : []).map(rep =>
            `<div class="sub"><span>${esc(rep.descricao || 'Gasto')}</span><span>${formatarMoeda(rep.valor)}</span></div>`
        ).join('');
        const linhasRepasses = Object.entries(os.comissao || {})
            .filter(([, valor]) => valor > 0)
            .map(([id, valor]) => `<div class="sub"><span>Repasse ${esc(this.nomeFuncionario(id))}</span><span>${formatarMoeda(valor)}</span></div>`)
            .join('');

        const veiculo = [os.marcaCarro, os.modeloCarro, os.litragemCarro].filter(Boolean).join(" ") || "Veículo";

        const conteudo = `
            <div class="detail-head">
                <div>
                    <div class="detail-car">${esc(veiculo)}</div>
                    <div class="text-secondary small">${esc(os.nomeCliente || '-')}</div>
                </div>
                <span class="placa-tag fs-6">${esc(os.placa || '-')}</span>
            </div>
            <div class="detail-grid">
                <div class="detail-item"><span>Data</span><strong>${dataExibicao}</strong></div>
                <div class="detail-item"><span>Quilometragem</span><strong>${kmFormatado}</strong></div>
                <div class="detail-item"><span>Ano</span><strong>${esc(os.anoCarro || '-')}</strong></div>
            </div>
            <div class="subsection-label">Serviço realizado</div>
            <div class="detail-desc">${esc(os.descricao || 'Sem descrição.')}</div>
            <div class="subsection-label">Valores</div>
            <div class="detail-values">
                <div><span>Mão de obra</span><span>${formatarMoeda(maoDeObra)}</span></div>
                ${linhasRepasses}
                ${gastosOS > 0 ? `<div><span>Peças e gastos</span><span>${formatarMoeda(gastosOS)}</span></div>${linhasGastos}` : ''}
                <div class="total"><span>Total</span><span>${formatarMoeda(os.valorTotal)}</span></div>
            </div>
        `;

        document.getElementById("conteudoDetalhesOS").innerHTML = conteudo;
        const modal = new bootstrap.Modal(document.getElementById("modalDetalhesOS"));
        modal.show();
    }

    prepararEdicaoOS() {
        const os = this.osSelecionadaParaModal;
        
        // Fecha o Modal
        const modalEl = document.getElementById('modalDetalhesOS');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();

        // Muda para a aba de Nova OS
        document.getElementById("btnAbaNovaOS").click();
        
        // Altera visualmente para modo de edição
        document.getElementById("tituloPagina").textContent = "Editando Ordem de Serviço";
        document.querySelector("#formOS button[type='submit']").textContent = "Salvar Alterações";
        this.osEmEdicaoId = os.id;

        // Preenche o formulário
        this.ui.inputPlaca.value = os.placa;
        this.ui.mostrarFormulario(true, os); // Reutiliza a lógica para preencher veículo
        this.preencherCamposServico(os);
    }

    // Preenche data, km, descrição e valores da OS (usado na edição e pela IA)
    preencherCamposServico(os) {
        document.getElementById("dataOS").value = (dataDaOS(os) || ''); // <-- ADICIONE ESTA LINHA 
        let kmOriginal = os.quilometragem || os.kmEntrada || '';
        document.getElementById("quilometragem").value = kmOriginal ? parseInt(kmOriginal).toLocaleString('pt-BR') : '';
        document.getElementById("descricao").value = os.descricao || '';
    // Cálculo retroativo: se a OS for antiga e não tiver Mão de Obra salva, ele deduz subtraindo as peças do valor total
        const gastosOS = (Array.isArray(os.outrosRepasses) ? os.outrosRepasses : []).reduce((acc, rep) => acc + num(rep?.valor), 0);
        const maoDeObraEdit = os.valorMaoDeObra !== undefined ? os.valorMaoDeObra : ((os.valorTotal || 0) - gastosOS);
        
        document.getElementById("valorMaoDeObra").value = maoDeObraEdit;
        
        // Dispara o cálculo para preencher o Grande Total na tela
        setTimeout(() => {
            document.getElementById("valorMaoDeObra").dispatchEvent(new Event("input"));
        }, 100);
        this.renderizarCamposRepasse(os.comissao || {});

        // Limpa e preenche repasses dinâmicos
        const containerRepasses = document.getElementById("containerOutrosRepasses");
        containerRepasses.innerHTML = '';
        
        if (Array.isArray(os.outrosRepasses) && os.outrosRepasses.length > 0) {
            os.outrosRepasses.forEach(rep => {
                const row = document.createElement("div");
                row.className = "row repasse-item mb-2";
                row.innerHTML = `
                    <div class="col-8"><input type="text" class="form-control repasse-desc"></div>
                    <div class="col-4"><input type="number" step="0.01" class="form-control repasse-valor"></div>
                `;
                // Atribui via .value para aspas na descrição não quebrarem o HTML
                row.querySelector(".repasse-desc").value = rep.descricao || '';
                row.querySelector(".repasse-valor").value = rep.valor ?? '';
                containerRepasses.appendChild(row);
            });
        }
        // Deixa sempre uma última linha em branco para adições
        const blankRow = document.createElement("div");
        blankRow.className = "row repasse-item mb-2";
        blankRow.innerHTML = `
            <div class="col-8"><input type="text" class="form-control repasse-desc" placeholder="Descrição do gasto"></div>
            <div class="col-4"><input type="number" step="0.01" class="form-control repasse-valor" placeholder="R$ 0.00"></div>
        `;
        containerRepasses.appendChild(blankRow);
    }

    // ==========================================
    // OS EXTRAÍDAS PELA IA (Ditado / Foto)
    // ==========================================
    receberOrdensIA(ordens) {
        this.filaIA = [...ordens];
        this.totalFilaIA = ordens.length;
        this.carregarProximaOSIA();
    }

    async carregarProximaOSIA() {
        const ordem = this.filaIA.shift();
        if (!ordem) {
            this.ui.limparFormulario();
            this.encerrarFilaIA();
            return;
        }

        // Garante que está na aba Nova OS e fora do modo de edição
        document.getElementById("btnAbaNovaOS").click();
        this.osEmEdicaoId = null;
        document.querySelector("#formOS button[type='submit']").textContent = "Salvar Ordem";
        this.ui.limparFormulario();

        const placa = (ordem.placa || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
        this.ui.inputPlaca.value = placa;

        // Se o carro já está cadastrado, completa o que a IA não pegou
        // (tenta também com traço, caso a placa tenha sido salva como ABC-1234)
        let cadastro = null;
        if (placa.length >= 7) {
            try {
                cadastro = await this.bd.buscarVeiculoPorPlaca(placa)
                    || await this.bd.buscarVeiculoPorPlaca(`${placa.slice(0, 3)}-${placa.slice(3)}`);
            } catch (error) {
                console.error("Erro ao buscar placa:", error);
            }
        }
        if (cadastro) this.ui.inputPlaca.value = cadastro.placa;
        const veiculo = {
            nomeCliente: ordem.nomeCliente || cadastro?.nomeCliente || "",
            marcaCarro: ordem.marca || cadastro?.marcaCarro || "",
            modeloCarro: ordem.modelo || cadastro?.modeloCarro || "",
            litragemCarro: ordem.motor || cadastro?.litragemCarro || "",
            anoCarro: ordem.ano || cadastro?.anoCarro || ""
        };
        this.ui.mostrarFormulario(true, veiculo);
        if (!cadastro) {
            this.ui.areaHistorico.classList.add("d-none");
            this.ui.alertaBusca.innerHTML = `<span class="text-primary"><i class="bi bi-plus-circle-fill"></i> Veículo novo: confira os dados</span>`;
        }

        // A IA devolve o nome do funcionário; aqui vira o id usado na OS
        const comissaoIA = {};
        const repassesSemDono = [];
        (ordem.repasses || []).forEach(rep => {
            const func = this.acharFuncionarioPorNome(rep.funcionario);
            if (func) comissaoIA[func.id] = (comissaoIA[func.id] || 0) + rep.valor;
            else if (rep.valor > 0) repassesSemDono.push(`${rep.funcionario} (${formatarMoeda(rep.valor)})`);
        });

        this.preencherCamposServico({
            data: ordem.data || document.getElementById("dataOS").value,
            quilometragem: ordem.quilometragem,
            descricao: ordem.descricao,
            valorMaoDeObra: ordem.valorMaoDeObra || '',
            comissao: comissaoIA,
            outrosRepasses: ordem.outrosGastos
        });

        // Mostra o aviso para conferir
        const numero = this.totalFilaIA - this.filaIA.length;
        document.getElementById("textoFilaIA").textContent = this.totalFilaIA > 1
            ? `OS ${numero} de ${this.totalFilaIA} preenchida pela IA. Confira tudo antes de salvar.`
            : "OS preenchida pela IA. Confira tudo antes de salvar.";
        const avisos = [];
        if (placa.length < 7) avisos.push("Placa não identificada: digite a placa.");
        if (repassesSemDono.length) avisos.push(`Repasse para quem não está na equipe: ${repassesSemDono.join(", ")}.`);
        if (ordem.observacoes) avisos.push(ordem.observacoes);
        document.getElementById("observacoesIA").textContent = avisos.join(" ");
        document.getElementById("btnPularOSIA").classList.toggle("d-none", this.totalFilaIA <= 1);
        const aviso = document.getElementById("avisoFilaIA");
        aviso.classList.remove("d-none");
        aviso.scrollIntoView({ behavior: "smooth" });
    }

    encerrarFilaIA() {
        this.filaIA = [];
        this.totalFilaIA = 0;
        document.getElementById("avisoFilaIA").classList.add("d-none");
    }

    async confirmarExclusaoOS() {
        const os = this.osSelecionadaParaModal;
        if (confirm(`Tem certeza que deseja EXCLUIR permanentemente a OS do veículo ${os.placa}?`)) {
            try {
                await this.bd.excluirOS(os.id);
                mostrarToast("Ordem de serviço excluída.");
                
                // Fecha modal
                const modalEl = document.getElementById('modalDetalhesOS');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                // Recarrega a lista
                this.carregarDadosIniciaisConsulta();
            } catch (error) {
                mostrarToast("Erro ao excluir a ordem de serviço.", "erro");
            }
        }
    }





    

    async processarFinanceiro(anoMes) {
        // Busca as OS atualizadas
        this.todasAsOS = await this.bd.buscarUltimasOS();

        // Zera os dados. "funcionarios" é { idDoFuncionario: [...] } / { idDoFuncionario: total }
        this.dadosFinanceirosAtuais = { oficina: [], gastos: [], funcionarios: {} };
        this.totaisFinanceiros = { oficina: 0, gastos: 0, funcionarios: {} };

        // Filtra as OS pelo mês selecionado (formato YYYY-MM)
        const osDoMes = this.todasAsOS.filter(os => {
            const dataBase = (dataDaOS(os) || '');
            return dataBase.startsWith(anoMes);
        });

        osDoMes.forEach(os => {
            // num(): valores gravados errado (texto, nulo) contam como 0 em vez de travar a soma
            const valorTotal = num(os.valorTotal);
            const repasses = Object.entries(os.comissao || {})
                .map(([id, valor]) => [id, num(valor)])
                .filter(([, valor]) => valor > 0);
            const totalRepasses = repasses.reduce((acc, [, valor]) => acc + valor, 0);

            // Calcula gastos extras (Peças, Retífica)
            const listaGastos = Array.isArray(os.outrosRepasses) ? os.outrosRepasses : [];
            const gastosOS = listaGastos.reduce((acc, rep) => acc + num(rep?.valor), 0);

            // O líquido da oficina é a Mão de Obra menos os repasses
            // (Fazemos um fallback para não quebrar OS antigas)
            const maoDeObra = os.valorMaoDeObra !== undefined ? num(os.valorMaoDeObra) : (valorTotal - gastosOS);
            const valorLiquidoOficina = maoDeObra - totalRepasses;
            // Formatação de data para exibição
            const dataParts = dataDaOS(os).split('-');
            const dataStr = `${dataParts[2]}/${dataParts[1]}`;
            const descricaoVeiculo = `${os.marcaCarro} ${os.modeloCarro} (${os.placa})`;
            const item = { data: dataStr, veiculo: descricaoVeiculo, cliente: os.nomeCliente, id: os.id };

            // Registra ganhos da Oficina
            if (valorLiquidoOficina > 0) {
                this.dadosFinanceirosAtuais.oficina.push({ ...item, valor: valorLiquidoOficina });
                this.totaisFinanceiros.oficina += valorLiquidoOficina;
            }

            // Registra os ganhos de cada funcionário
            repasses.forEach(([idFunc, valor]) => {
                (this.dadosFinanceirosAtuais.funcionarios[idFunc] ??= []).push({ ...item, valor });
                this.totaisFinanceiros.funcionarios[idFunc] = (this.totaisFinanceiros.funcionarios[idFunc] || 0) + valor;
            });

            // Registra as despesas
            if (gastosOS > 0) {
                this.dadosFinanceirosAtuais.gastos.push({ veiculo: descricaoVeiculo, valor: gastosOS, desc: listaGastos.map(r => r?.descricao).join(", ") });
                this.totaisFinanceiros.gastos += gastosOS;
            }
        });

        // Atualiza a tela
        document.getElementById("totalOficina").textContent = formatarMoeda(this.totaisFinanceiros.oficina);
        this.renderizarCartoesFuncionarios();

        // Indicadores do mês
        const faturado = osDoMes.reduce((acc, os) => acc + num(os.valorTotal), 0);
        document.getElementById("totalFaturado").textContent = formatarMoeda(faturado);
        document.getElementById("qtdOS").textContent = osDoMes.length;
        document.getElementById("totalGastos").textContent = formatarMoeda(this.totaisFinanceiros.gastos);
    }

    // Funcionários que aparecem no financeiro: os ativos e quem recebeu algo no mês
    idsFuncionariosNoFinanceiro() {
        const ids = this.funcionarios.filter(f => f.ativo !== false).map(f => f.id);
        Object.keys(this.totaisFinanceiros.funcionarios || {}).forEach(id => {
            if (!ids.includes(id)) ids.push(id);
        });
        return ids;
    }

    renderizarCartoesFuncionarios() {
        const grid = document.getElementById("splitGrid");
        grid.querySelectorAll(".split-func").forEach(card => card.remove());

        this.idsFuncionariosNoFinanceiro().forEach(id => {
            const card = document.createElement("div");
            card.className = "split-card split-func";
            card.style.setProperty("--split-color", corFuncionario(id));
            card.innerHTML = `
                <div class="split-head">
                    <span class="split-icon"><i class="bi bi-person"></i></span>
                    <span class="split-name">${esc(this.nomeFuncionario(id))}</span>
                </div>
                <div class="split-value">${formatarMoeda(this.totaisFinanceiros.funcionarios[id])}</div>
                <div class="split-actions">
                    <button type="button" class="btn btn-light btn-sm btn-expandir-fin" data-tipo="${esc(id)}"><i class="bi bi-list-ul"></i> Detalhes</button>
                    <button type="button" class="btn btn-light btn-sm btn-whats-fin" data-tipo="${esc(id)}"><i class="bi bi-whatsapp"></i> Enviar</button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // tipo é "oficina" ou o id de um funcionário
    listaFinanceira(tipo) {
        return tipo === "oficina" ? this.dadosFinanceirosAtuais.oficina : (this.dadosFinanceirosAtuais.funcionarios[tipo] || []);
    }

    totalFinanceiro(tipo) {
        return tipo === "oficina" ? this.totaisFinanceiros.oficina : (this.totaisFinanceiros.funcionarios[tipo] || 0);
    }

    abrirModalFinanceiro(tipo) {
        const titulo = tipo === "oficina" ? "Oficina (líquido)" : `Repasses de ${this.nomeFuncionario(tipo)}`;
        document.getElementById("tituloModalFinanceiro").textContent = titulo;

        const tbody = document.getElementById("tabelaFinanceiroBody");
        const lista = this.listaFinanceira(tipo);

        if (lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary py-4">Nenhum serviço registrado neste mês.</td></tr>';
        } else {
            tbody.innerHTML = lista.map(item => `
                <tr>
                    <td class="text-nowrap">${esc(item.data)}</td>
                    <td>${esc(item.veiculo)}</td>
                    <td>${esc(item.cliente || '-')}</td>
                    <td class="text-end text-nowrap fw-semibold">${formatarMoeda(item.valor)}</td>
                </tr>
            `).join('');
        }

        document.getElementById("totalModalFinanceiro").textContent = `Total: ${formatarMoeda(this.totalFinanceiro(tipo))}`;

        const modal = new bootstrap.Modal(document.getElementById("modalDetalhesFinanceiro"));
        modal.show();
    }

    exportarWhats(tipo) {
        const mesRef = document.getElementById("filtroMesFinanceiro").value.split('-').reverse().join('/');
        let texto = "";

        if (tipo === "geral") {
            const totalRepasses = Object.values(this.totaisFinanceiros.funcionarios).reduce((acc, v) => acc + v, 0);
            const faturamentoBruto = this.totaisFinanceiros.oficina + totalRepasses + this.totaisFinanceiros.gastos;
            texto = `*FECHAMENTO GERAL - OFICINA* \n*Mês de Referência:* ${mesRef}\n\n`;
            texto += `*Resumo Financeiro:*\n`;
            texto += `[+] Faturamento Bruto: R$ ${faturamentoBruto.toFixed(2)}\n`;
            texto += `[=] Oficina (Caixa Líquido): R$ ${this.totaisFinanceiros.oficina.toFixed(2)}\n`;
            this.idsFuncionariosNoFinanceiro().forEach(id => {
                texto += `[-] Repasses ${this.nomeFuncionario(id)}: R$ ${this.totalFinanceiro(id).toFixed(2)}\n`;
            });
            texto += `[!] Gastos Extras (Peças/Etc): R$ ${this.totaisFinanceiros.gastos.toFixed(2)}\n\n`;

            texto += `*DETALHES - CAIXA DA OFICINA:*\n`;
            this.dadosFinanceirosAtuais.oficina.forEach(i => texto += `• ${i.data} | ${i.veiculo} - R$ ${i.valor.toFixed(2)}\n`);

            if (this.dadosFinanceirosAtuais.gastos.length > 0) {
                texto += `\n*DETALHES - GASTOS EXTRAS:*\n`;
                this.dadosFinanceirosAtuais.gastos.forEach(g => texto += `• ${g.veiculo} (${g.desc}) - R$ ${g.valor.toFixed(2)}\n`);
            }
        } else {
            const nome = tipo === "oficina" ? "CAIXA DA OFICINA" : this.nomeFuncionario(tipo).toUpperCase();
            texto = `*RESUMO DE GANHOS - ${nome}* \n*Mês de Referência:* ${mesRef}\n\n`;
            this.listaFinanceira(tipo).forEach(item => {
                texto += `${item.data} - ${item.veiculo}\n Cliente: ${item.cliente}\n Valor: R$ ${item.valor.toFixed(2)}\n\n`;
            });
            texto += `*VALOR TOTAL A RECEBER: R$ ${this.totalFinanceiro(tipo).toFixed(2)}*`;
        }

        const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
        window.open(url, '_blank');
    }

    // ==========================================
    // CONTA: oficina, acessos, backup e sair
    // ==========================================
    get ehDono() {
        return this.sessao.perfil.papel === "dono";
    }

    inicializarConta() {
        const { usuario, oficina } = this.sessao;
        document.getElementById("nomeOficinaHeader").textContent = oficina.nome;
        document.getElementById("contaEmail").textContent = usuario.email;
        document.getElementById("contaPapel").textContent = this.ehDono ? "Dono da oficina" : "Membro da oficina";

        // Só o dono muda o nome e convida pessoas
        const inputNome = document.getElementById("inputNomeOficina");
        const inputCidade = document.getElementById("inputCidadeOficina");
        inputNome.value = oficina.nome;
        inputCidade.value = oficina.cidade || "";
        inputNome.disabled = !this.ehDono;
        inputCidade.disabled = !this.ehDono;
        document.getElementById("btnSalvarNomeOficina").classList.toggle("d-none", !this.ehDono);
        document.getElementById("formConvite").classList.toggle("d-none", !this.ehDono);

        document.getElementById("modalConta").addEventListener("show.bs.modal", () => this.renderizarAcessos());

        document.getElementById("formNomeOficina").addEventListener("submit", async (e) => {
            e.preventDefault();
            const nome = inputNome.value.trim();
            const cidade = inputCidade.value.trim();
            if (!nome) return;
            try {
                await this.bd.atualizarOficina({ nome, cidade });
                Object.assign(this.sessao.oficina, { nome, cidade });
                document.getElementById("nomeOficinaHeader").textContent = nome;
                mostrarToast("Dados da oficina atualizados.");
            } catch (error) {
                console.error(error);
                mostrarToast("Erro ao salvar o nome.", "erro");
            }
        });

        document.getElementById("formConvite").addEventListener("submit", async (e) => {
            e.preventDefault();
            const input = document.getElementById("emailConvite");
            const email = input.value.trim().toLowerCase();
            if (!email) return;
            if (email === usuario.email.toLowerCase()) {
                mostrarToast("Esse é o seu próprio e-mail.", "erro");
                return;
            }
            try {
                await this.bd.convidar(email, this.sessao.oficina.nome, usuario.email);
                input.value = "";
                mostrarToast("Convite criado. Peça para a pessoa criar a conta com esse e-mail.");
                this.renderizarAcessos();
            } catch (error) {
                console.error(error);
                mostrarToast("Erro ao criar o convite.", "erro");
            }
        });

        // Remover acesso / cancelar convite
        document.getElementById("listaAcessos").addEventListener("click", async (e) => {
            const botao = e.target.closest("[data-acao]");
            if (!botao) return;
            try {
                if (botao.dataset.acao === "remover-usuario") {
                    if (!confirm(`Tirar o acesso de ${botao.dataset.nome} ao sistema?`)) return;
                    await this.bd.removerUsuario(botao.dataset.uid);
                    mostrarToast("Acesso removido.");
                }
                if (botao.dataset.acao === "cancelar-convite") {
                    await this.bd.cancelarConvite(botao.dataset.email);
                    mostrarToast("Convite cancelado.");
                }
                this.renderizarAcessos();
            } catch (error) {
                console.error(error);
                mostrarToast("Erro ao atualizar os acessos.", "erro");
            }
        });

        document.getElementById("btnBackup").addEventListener("click", (e) => this.baixarBackup(e.currentTarget));

        document.getElementById("btnSair").addEventListener("click", async () => {
            if (!confirm("Sair da sua conta neste aparelho?")) return;
            await this.sessao.sair();
        });
    }

    async renderizarAcessos() {
        const lista = document.getElementById("listaAcessos");
        lista.innerHTML = '<div class="text-secondary small py-2"><span class="spinner-border spinner-border-sm me-2"></span>Carregando...</div>';
        try {
            const [usuarios, convites] = await Promise.all([this.bd.listarUsuarios(), this.bd.listarConvites()]);
            const linhasUsuarios = usuarios.map(u => {
                const nome = u.nome || u.email;
                const voce = u.uid === this.sessao.usuario.uid ? ' <span class="text-secondary">(você)</span>' : "";
                const acao = this.ehDono && u.papel !== "dono"
                    ? `<button type="button" class="btn btn-light btn-sm text-danger" data-acao="remover-usuario" data-uid="${esc(u.uid)}" data-nome="${esc(nome)}">Remover</button>`
                    : `<span class="acesso-papel">${u.papel === "dono" ? "Dono" : "Membro"}</span>`;
                return `
                    <div class="acesso-linha">
                        <div class="acesso-info"><strong>${esc(nome)}${voce}</strong><span>${esc(u.email)}</span></div>
                        ${acao}
                    </div>`;
            });
            const linhasConvites = convites.map(c => `
                <div class="acesso-linha">
                    <div class="acesso-info"><strong>${esc(c.email)}</strong><span>Convite pendente</span></div>
                    ${this.ehDono ? `<button type="button" class="btn btn-light btn-sm" data-acao="cancelar-convite" data-email="${esc(c.email)}">Cancelar</button>` : ""}
                </div>`);
            lista.innerHTML = [...linhasUsuarios, ...linhasConvites].join("");
        } catch (error) {
            console.error("Erro ao listar acessos:", error);
            lista.innerHTML = '<div class="text-danger small py-2">Não foi possível carregar os acessos.</div>';
        }
    }

    async baixarBackup(botao) {
        botao.disabled = true;
        try {
            const backup = await this.bd.gerarBackup();
            backup.oficina = this.sessao.oficina.nome;
            const arquivo = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
            const link = document.createElement("a");
            const hoje = new Date().toISOString().slice(0, 10);
            link.href = URL.createObjectURL(arquivo);
            link.download = `backup-parafusa-${hoje}.json`;
            link.click();
            URL.revokeObjectURL(link.href);
            mostrarToast(`Backup baixado: ${backup.ordens_servico.length} ordens de serviço.`);
        } catch (error) {
            console.error("Erro no backup:", error);
            mostrarToast("Erro ao gerar o backup.", "erro");
        } finally {
            botao.disabled = false;
        }
    }

    // Oferece importar os dados do sistema antigo (só para o dono, só uma vez)
    async verificarDadosAntigos() {
        if (!this.ehDono || !(await this.bd.existemDadosAntigos())) return;
        const aviso = document.getElementById("avisoDadosAntigos");
        aviso.classList.remove("d-none");
        document.getElementById("btnImportarAntigos").addEventListener("click", async (e) => {
            const botao = e.currentTarget;
            const progresso = document.getElementById("progressoImportacao");
            if (!confirm(`Copiar todas as OS, veículos e funcionários do sistema antigo para "${this.sessao.oficina.nome}"?`)) return;
            botao.disabled = true;
            try {
                const resumo = await this.bd.importarDadosAntigos(texto => progresso.textContent = `Copiando ${texto}...`);
                aviso.classList.add("d-none");
                mostrarToast(`Importado: ${resumo.ordens_servico} OS, ${resumo.veiculos} veículos e ${resumo.funcionarios} funcionários.`);
                await this.carregarFuncionarios();
            } catch (error) {
                console.error("Erro na importação:", error);
                progresso.textContent = "Erro ao importar. Nada foi perdido; tente de novo.";
                botao.disabled = false;
            }
        });
    }

    // ==========================================
    // EQUIPE (FUNCIONÁRIOS)
    // ==========================================
    inicializarEquipe() {
        document.getElementById("btnNovoFuncionario").addEventListener("click", () => this.abrirModalFuncionario(null));
        document.getElementById("formFuncionario").addEventListener("submit", (e) => this.salvarFuncionario(e));

        const modalEl = document.getElementById("modalFuncionario");
        modalEl.addEventListener("shown.bs.modal", () => document.getElementById("nomeFuncionario").focus());

        // Botões Editar / Remover / Reativar de cada linha
        document.getElementById("containerEquipe").addEventListener("click", (e) => {
            const botao = e.target.closest("[data-acao]");
            if (!botao) return;
            const func = this.funcionarios.find(f => f.id === botao.dataset.id);
            if (!func) return;
            if (botao.dataset.acao === "editar") this.abrirModalFuncionario(func);
            if (botao.dataset.acao === "remover") this.alterarSituacaoFuncionario(func, false);
            if (botao.dataset.acao === "reativar") this.alterarSituacaoFuncionario(func, true);
        });
    }

    async carregarFuncionarios() {
        try {
            this.funcionarios = await this.bd.listarFuncionarios();
        } catch (error) {
            console.error("Erro ao carregar funcionários:", error);
            mostrarToast("Erro ao carregar a equipe.", "erro");
        }
        this.renderizarCamposRepasse();
        this.renderizarEquipe();
    }

    nomeFuncionario(id) {
        const func = this.funcionarios.find(f => f.id === id);
        return func ? func.nome : id.charAt(0).toUpperCase() + id.slice(1);
    }

    // Compara nomes sem acento e sem diferença de maiúsculas ("Zé" = "ze")
    acharFuncionarioPorNome(nome) {
        const normalizar = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
        const alvo = normalizar(nome);
        if (!alvo) return null;
        const ativos = this.funcionarios.filter(f => f.ativo !== false);
        return ativos.find(f => normalizar(f.nome) === alvo) || null;
    }

    // Campos de repasse da OS: um por funcionário ativo,
    // mais os removidos que têm valor nesta OS (para editar OS antigas sem perder nada)
    renderizarCamposRepasse(comissao = {}) {
        const container = document.getElementById("containerRepassesFuncionarios");
        const ids = this.funcionarios.filter(f => f.ativo !== false).map(f => f.id);
        Object.entries(comissao).forEach(([id, valor]) => {
            if (valor > 0 && !ids.includes(id)) ids.push(id);
        });

        if (ids.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="form-text mb-0">Nenhum funcionário ativo. Cadastre a equipe na aba Equipe.</p></div>';
            return;
        }

        container.innerHTML = "";
        ids.forEach(id => {
            const coluna = document.createElement("div");
            coluna.className = "col-6";
            coluna.innerHTML = `
                <label class="form-label"></label>
                <div class="input-prefix">
                    <span>R$</span>
                    <input type="number" step="0.01" class="form-control repasse-func" placeholder="0,00">
                </div>
            `;
            const input = coluna.querySelector("input");
            input.id = `repasse-${id}`;
            input.dataset.id = id;
            input.value = comissao[id] || "";
            const label = coluna.querySelector("label");
            label.htmlFor = input.id;
            label.textContent = this.nomeFuncionario(id);
            container.appendChild(coluna);
        });
    }

    renderizarEquipe() {
        const ativos = this.funcionarios.filter(f => f.ativo !== false);
        const inativos = this.funcionarios.filter(f => f.ativo === false);
        document.getElementById("listaFuncionarios").innerHTML = ativos.map(f => this.linhaFuncionario(f)).join("");
        document.getElementById("listaInativos").innerHTML = inativos.map(f => this.linhaFuncionario(f)).join("");
        document.getElementById("blocoInativos").classList.toggle("d-none", inativos.length === 0);
    }

    linhaFuncionario(func) {
        const iniciais = func.nome.split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join("").toUpperCase();
        const inativo = func.ativo === false;
        const acoes = inativo
            ? `<button type="button" class="btn btn-light btn-sm" data-acao="reativar" data-id="${esc(func.id)}"><i class="bi bi-arrow-counterclockwise"></i> Reativar</button>`
            : `<button type="button" class="btn btn-light btn-square" data-acao="editar" data-id="${esc(func.id)}" title="Editar" aria-label="Editar ${esc(func.nome)}"><i class="bi bi-pencil"></i></button>
               <button type="button" class="btn btn-light btn-square text-danger" data-acao="remover" data-id="${esc(func.id)}" title="Remover" aria-label="Remover ${esc(func.nome)}"><i class="bi bi-trash3"></i></button>`;
        return `
            <div class="team-row${inativo ? " inativo" : ""}">
                <span class="avatar" style="--avatar-color: ${corFuncionario(func.id)}">${esc(iniciais)}</span>
                <span class="team-name">${esc(func.nome)}</span>
                <div class="team-actions">${acoes}</div>
            </div>
        `;
    }

    abrirModalFuncionario(func) {
        this.funcionarioEmEdicao = func;
        document.getElementById("tituloModalFuncionario").textContent = func ? "Editar funcionário" : "Adicionar funcionário";
        document.getElementById("nomeFuncionario").value = func ? func.nome : "";
        bootstrap.Modal.getOrCreateInstance(document.getElementById("modalFuncionario")).show();
    }

    async salvarFuncionario(evento) {
        evento.preventDefault();
        const nome = document.getElementById("nomeFuncionario").value.trim().replace(/\s+/g, " ");
        if (!nome) return;

        // Evita dois funcionários ativos com o mesmo nome (a IA e o WhatsApp usam o nome)
        const repetido = this.acharFuncionarioPorNome(nome);
        if (repetido && repetido.id !== this.funcionarioEmEdicao?.id) {
            mostrarToast(`Já existe alguém chamado ${repetido.nome} na equipe.`, "erro");
            return;
        }

        const botao = document.getElementById("btnSalvarFuncionario");
        botao.disabled = true;
        try {
            if (this.funcionarioEmEdicao) {
                await this.bd.atualizarFuncionario(this.funcionarioEmEdicao.id, { nome });
                mostrarToast("Funcionário atualizado.");
            } else {
                await this.bd.adicionarFuncionario(nome);
                mostrarToast(`${nome} foi adicionado à equipe.`);
            }
            bootstrap.Modal.getInstance(document.getElementById("modalFuncionario"))?.hide();
            await this.carregarFuncionarios();
        } catch (error) {
            console.error("Erro ao salvar funcionário:", error);
            mostrarToast("Erro ao salvar o funcionário.", "erro");
        } finally {
            botao.disabled = false;
        }
    }

    async alterarSituacaoFuncionario(func, ativo) {
        if (!ativo && !confirm(`Remover ${func.nome} da equipe?\n\nEle deixa de aparecer nas novas OS. Os serviços antigos continuam no histórico e no financeiro.`)) {
            return;
        }
        try {
            await this.bd.atualizarFuncionario(func.id, { ativo });
            mostrarToast(ativo ? `${func.nome} voltou para a equipe.` : `${func.nome} foi removido da equipe.`);
            await this.carregarFuncionarios();
        } catch (error) {
            console.error("Erro ao alterar funcionário:", error);
            mostrarToast("Erro ao atualizar a equipe.", "erro");
        }
    }


imprimirReciboOS() {
        const os = this.osSelecionadaParaModal;
        if (!os) return;

        // Formatação da Data
        let dataExibicao = "N/A";
        const dataBase = (dataDaOS(os) || null);
        if (dataBase) {
            const partes = dataBase.split('-');
            if (partes.length === 3) dataExibicao = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        // Formatação do KM
        let kmValor = os.quilometragem || os.kmEntrada || '';
        let kmFormatado = kmValor ? parseInt(kmValor).toLocaleString('pt-BR') + ' km' : '-';

        // Formatação dos Gastos Extras / Peças
        let repassesExtrasHTML = '';
        if (Array.isArray(os.outrosRepasses) && os.outrosRepasses.length > 0) {
            repassesExtrasHTML = '<br><strong>PEÇAS E OUTROS:</strong><br>';
            os.outrosRepasses.forEach(rep => {
                repassesExtrasHTML += `<div style="display: flex; justify-content: space-between;"><span>${esc(rep.descricao)}</span> <span>R$ ${(Number(rep.valor) || 0).toFixed(2).replace('.', ',')}</span></div>`;
            });
        }

        // Estrutura do Recibo (Estilo Cupom)
        const reciboHTML = `
            <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
                <h2 style="margin: 0; font-weight: bold; text-transform: uppercase;">${esc(this.sessao.oficina.nome)}</h2>
                ${this.sessao.oficina.cidade ? `<p style="margin: 5px 0 0 0; font-size: 16px;">${esc(this.sessao.oficina.cidade)}</p>` : ""}
                <p style="margin: 5px 0 0 0; font-size: 14px;">Documento Auxiliar de Prestação de Serviço</p>
                <p style="margin: 0; font-size: 12px;">(Sem Valor Fiscal)</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <strong>OS Nº: ${esc(os.id.substring(0, 8).toUpperCase())}</strong>
                <strong>DATA: ${dataExibicao}</strong>
            </div>
            
            <div style="border-bottom: 1px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
                <strong>CLIENTE:</strong> ${esc(os.nomeCliente || '-')}<br>
                <strong>VEÍCULO:</strong> ${esc(os.marcaCarro)} ${esc(os.modeloCarro)} (${esc(os.litragemCarro)})<br>
                <strong>PLACA:</strong> ${esc(os.placa || '-')} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>ANO:</strong> ${esc(os.anoCarro || '-')}<br>
                <strong>QUILOMETRAGEM:</strong> ${kmFormatado}
            </div>

            <div style="border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
                <strong>MÃO DE OBRA / SERVIÇOS EXECUTADOS:</strong><br>
                <div style="white-space: pre-wrap; margin-top: 8px;">${esc(os.descricao || 'Sem descrição.')}</div>
                ${repassesExtrasHTML}
            </div>

            <div style="text-align: right; font-size: 22px; margin-bottom: 40px;">
                <strong>TOTAL GERAL: R$ ${(Number(os.valorTotal) || 0).toFixed(2).replace('.', ',')}</strong>
            </div>

            <div style="text-align: center; margin-top: 80px;">
                <p style="margin: 0;">____________________________________________________</p>
                <p style="margin: 5px 0 0 0;">Assinatura do Cliente / Recebedor</p>
                <p style="margin-top: 20px; font-size: 12px; font-style: italic;">Agradecemos a preferência!</p>
            </div>
        `;

        // Injeta o HTML na div invisível
        const containerRecibo = document.getElementById("reciboImpressao");
        containerRecibo.innerHTML = reciboHTML;
        
        // Remove as classes de "esconder" apenas durante a execução do script
        containerRecibo.classList.remove("d-none");
        
        // Chama a janela de impressão nativa do navegador/celular
        window.print();
        
        // Esconde a div novamente após a tela de impressão fechar
        containerRecibo.classList.add("d-none");
    }


}

// Inicia pelo login; o sistema só abre depois de entrar
iniciarAcesso({
    appFirebase,
    db,
    aoEntrar: (sessao) => new App(sessao)
});