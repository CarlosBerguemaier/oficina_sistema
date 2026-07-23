import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, doc, setDoc, query, where, getDocs, orderBy, limit, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";// ==========================================
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
    constructor(db) {
        this.db = db;
    }

    async buscarVeiculoPorPlaca(placa) {
        try {
            const veiculosRef = collection(this.db, "veiculos");
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
            const osRef = collection(this.db, "ordens_servico");
            await addDoc(osRef, dadosOS);

            // Atualiza ou Cria o cadastro do Veículo no banco para preencher sozinho na próxima vez
            const veiculoRef = doc(this.db, "veiculos", dadosOS.placa);
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
            const osRef = collection(this.db, "ordens_servico");
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
            const osRef = doc(this.db, "ordens_servico", id);
            await updateDoc(osRef, dadosOS);
            
            // Atualiza também o cadastro do veículo para manter os dados sincronizados
            const veiculoRef = doc(this.db, "veiculos", dadosOS.placa);
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
            const osRef = doc(this.db, "ordens_servico", id);
            await deleteDoc(osRef);
            return true;
        } catch (error) {
            console.error("Erro ao excluir OS:", error);
            throw error;
        }
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
            this.alertaBusca.innerHTML = `<span class="text-success fw-bold">Veículo encontrado!</span>`;
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
            this.alertaBusca.innerHTML = `<span class="text-primary fw-bold">Veículo novo. Preencha os dados.</span>`;
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
    constructor() {
        this.bd = new BancoDeDados(db);
        this.ui = new Interface();
        // Variáveis de controle para a Consulta
        this.todasAsOS = [];
        this.osFiltradas = [];
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
        this.osEmEdicaoId = null; // Guarda o ID da OS sendo editada
        this.osSelecionadaParaModal = null; // Guarda os dados da OS aberta no modal
        this.dadosFinanceirosAtuais = { oficina: [], carlos: [], ratinho: [], gastos: [] };
        this.totaisFinanceiros = { oficina: 0, carlos: 0, ratinho: 0, gastos: 0 };
        
        this.inicializarEventosConsulta();
        
        this.inicializarEventos();
        
        // Aquecimento silencioso da conexão
        this.bd.buscarVeiculoPorPlaca("AQUECIMENTO").catch(() => {});
    }

    inicializarEventos() {
        document.getElementById("btnBuscarPlaca").addEventListener("click", () => this.lidarComBuscaPlaca());
        document.getElementById("formOS").addEventListener("submit", (e) => this.lidarComSalvamento(e));
        document.getElementById("btnCancelar").addEventListener("click", () => this.ui.limparFormulario());

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


    }

    async lidarComBuscaPlaca() {
        const placa = this.ui.inputPlaca.value.trim();
        if (placa.length < 7) {
            alert("Digite uma placa válida.");
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
            alert("Erro de conexão com o banco de dados. Verifique o Console (F12).");
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

        const repasseCarlos = parseFloat(document.getElementById("repasseCarlos").value) || 0;
        const repasseRatinho = parseFloat(document.getElementById("repasseRatinho").value) || 0;
        const valorTotal = parseFloat(document.getElementById("valorTotal").value) || 0;

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
            valorTotal: valorTotal,
            comissao: {
                carlos: repasseCarlos,
                ratinho: repasseRatinho
            },
            outrosRepasses: outrosRepasses, // <--- NOVO CAMPO ADICIONADO AQUI
            dataEntrada: new Date().toISOString()
        };

     try {
            if (this.osEmEdicaoId) {
                await this.bd.atualizarOS(this.osEmEdicaoId, dadosNovaOS);
                alert("Ordem de serviço atualizada com sucesso!");
                this.osEmEdicaoId = null; // Reseta o estado
                document.querySelector("#formOS button[type='submit']").textContent = "Salvar Ordem"; // Volta o texto do botão
            } else {
                await this.bd.salvarNovaOS(dadosNovaOS);
                alert("Ordem de serviço salva com sucesso!");
            }
            this.ui.limparFormulario();
            // Volta para a tela de consulta e recarrega para ver a alteração
            document.getElementById("btnAbaConsulta").click();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar os dados.");
        }
    }

    inicializarEventosConsulta() {
        const btnNova = document.getElementById("btnAbaNovaOS");
        const btnConsulta = document.getElementById("btnAbaConsulta");
        const btnFinanceiro = document.getElementById("btnAbaFinanceiro");
        const containerNova = document.getElementById("containerNovaOS");
        const containerConsulta = document.getElementById("containerConsultaOS");
        const containerFinanceiro = document.getElementById("containerFinanceiro");
        const titulo = document.getElementById("tituloPagina");

        const resetarBotoes = () => {
            [btnNova, btnConsulta, btnFinanceiro].forEach(btn => btn.classList.replace("btn-primary", "btn-outline-primary"));
            [containerNova, containerConsulta, containerFinanceiro].forEach(cont => cont.classList.add("d-none"));
        };

        // Alternar para tela de Nova OS
        btnNova.addEventListener("click", () => {
            resetarBotoes();
            containerNova.classList.remove("d-none");
            btnNova.classList.replace("btn-outline-primary", "btn-primary");
            titulo.textContent = "Nova Ordem de Serviço";
        });

        // Alternar para tela de Consulta
        btnConsulta.addEventListener("click", () => {
            resetarBotoes();
            containerConsulta.classList.remove("d-none");
            btnConsulta.classList.replace("btn-outline-primary", "btn-primary");
            titulo.textContent = "Consultar Ordens de Serviço";
            this.carregarDadosIniciaisConsulta();
        });

        // Alternar para tela Financeira
        btnFinanceiro.addEventListener("click", async () => {
            resetarBotoes();
            containerFinanceiro.classList.remove("d-none");
            btnFinanceiro.classList.replace("btn-outline-primary", "btn-primary");
            titulo.textContent = "Resumo Financeiro";
            
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

        // Eventos dos botões do Financeiro (Expandir e WhatsApp)
        document.querySelectorAll(".btn-expandir-fin").forEach(btn => {
            btn.addEventListener("click", (e) => this.abrirModalFinanceiro(e.target.dataset.tipo));
        });
        document.querySelectorAll(".btn-whats-fin").forEach(btn => {
            btn.addEventListener("click", (e) => this.exportarWhats(e.target.dataset.tipo));
        });
        document.getElementById("btnWhatsGeral").addEventListener("click", () => this.exportarWhats("geral"));

        // ... MANTENHA O RESTANTE DOS EVENTOS DE CONSULTA (btnAplicarFiltros, etc) ABAIXO DESTA LINHA ...

        // Alternar para tela de Nova OS
        btnNova.addEventListener("click", () => {
            containerNova.classList.remove("d-none");
            containerConsulta.classList.add("d-none");
            btnNova.classList.replace("btn-outline-primary", "btn-primary");
            btnConsulta.classList.replace("btn-primary", "btn-outline-primary");
            titulo.textContent = "Nova Ordem de Serviço";
        });

        // Alternar para tela de Consulta
        btnConsulta.addEventListener("click", () => {
            containerConsulta.classList.remove("d-none");
            containerNova.classList.add("d-none");
            btnConsulta.classList.replace("btn-outline-primary", "btn-primary");
            btnNova.classList.replace("btn-primary", "btn-outline-primary");
            titulo.textContent = "Consultar Ordens de Serviço";
            this.carregarDadosIniciaisConsulta();
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
        document.getElementById("tabelaOSBody").innerHTML = '<tr><td colspan="5" class="text-center py-3"><span class="spinner-border spinner-border-sm"></span> Carregando informações...</td></tr>';
        try {
            this.todasAsOS = await this.bd.buscarUltimasOS();
            
            // NOVA LÓGICA DE ORDENAÇÃO: Força a lista inteira a se organizar pela data da OS escolhida
            this.todasAsOS.sort((a, b) => {
                const dataA = a.data || (a.dataEntrada ? a.dataEntrada.split('T')[0] : '0000-00-00');
                const dataB = b.data || (b.dataEntrada ? b.dataEntrada.split('T')[0] : '0000-00-00');
                
                // Se as datas do serviço forem iguais, desempata pela hora exata de salvamento
                if (dataA === dataB) {
                    const horaA = a.dataEntrada || '0000';
                    const horaB = b.dataEntrada || '0000';
                    return horaB.localeCompare(horaA);
                }
                // Ordena de forma decrescente (Maior/Mais nova sempre no topo)
                return dataB.localeCompare(dataA); 
            });

            this.osFiltradas = [...this.todasAsOS]; // Começa mostrando todas
            this.paginaAtual = 1;
            this.renderizarTabelaOS();
        } catch (error) {
            document.getElementById("tabelaOSBody").innerHTML = '<tr><td colspan="5" class="text-center py-3 text-danger">Erro ao carregar do banco de dados.</td></tr>';
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
                const dataOsFormatada = os.data || (os.dataEntrada ? os.dataEntrada.split('T')[0] : null);
                if (dataOsFormatada !== dataBusca) passa = false;
            }
            if (placaBusca && (!os.placa || !os.placa.includes(placaBusca))) passa = false;
            if (marcaBusca && (!os.marcaCarro || !os.marcaCarro.toUpperCase().includes(marcaBusca))) passa = false;
            if (modeloBusca && (!os.modeloCarro || !os.modeloCarro.toUpperCase().includes(modeloBusca))) passa = false;
            
            return passa;
        });

        this.paginaAtual = 1; // Reseta para a página 1 após filtrar
        this.renderizarTabelaOS();
    }

   renderizarTabelaOS() {
        const tbody = document.getElementById("tabelaOSBody");
        tbody.innerHTML = "";

        if (this.osFiltradas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-muted">Nenhuma ordem de serviço encontrada.</td></tr>';
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
            const dataBase = os.data || (os.dataEntrada ? os.dataEntrada.split('T')[0] : '0000-00-00');
            
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

            // Linha de Cabeçalho da Data
            const trData = document.createElement("tr");
            trData.className = "table-secondary";
            trData.innerHTML = `<td colspan="5" class="fw-bold text-center text-dark">📅 ${dataExibicao}</td>`;
            tbody.appendChild(trData);

            // Linhas das OS
            gruposPorData[dataBase].forEach(os => {
                const tr = document.createElement("tr");
                
                // Encurta a descrição para não quebrar o layout
                let descCurta = os.descricao || '';
                if (descCurta.length > 30) descCurta = descCurta.substring(0, 30) + '...';

                tr.innerHTML = `
                    <td class="text-center align-middle">
                        <button class="btn btn-sm btn-outline-primary border-0 fs-5 btn-ver-os p-1" data-id="${os.id}" title="Ver Detalhes">👁️</button>
                    </td>
                    <td class="align-middle lh-sm"><strong>${os.placa || '-'}</strong><br><small class="text-muted">${os.marcaCarro || '-'} ${os.modeloCarro || '-'}</small></td>
                    <td class="align-middle text-muted" style="max-width: 200px;">${descCurta}</td>
                    <td class="align-middle">${os.nomeCliente || '-'}</td>
                    <td class="text-success fw-bold align-middle">R$ ${(os.valorTotal || 0).toFixed(2)}</td>
                `;
                tbody.appendChild(tr);
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
        const dataBase = os.data || (os.dataEntrada ? os.dataEntrada.split('T')[0] : null);
        if (dataBase) {
            const partes = dataBase.split('-');
            if (partes.length === 3) dataExibicao = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

          let repassesExtrasHTML = '';
        if (os.outrosRepasses && os.outrosRepasses.length > 0) {
            repassesExtrasHTML = '<div class="col-12 mt-2 text-end"><strong>Outros Gastos/Repasses:</strong><ul class="list-unstyled mb-0 text-muted small">';
            os.outrosRepasses.forEach(rep => {
                repassesExtrasHTML += `<li>${rep.descricao}: R$ ${(rep.valor || 0).toFixed(2)}</li>`;
            });
            repassesExtrasHTML += '</ul></div>';
        }

        // Insira ${repassesExtrasHTML} na sua string literal (conteudo) logo após os repasses fixos.

        let kmValor = os.quilometragem || os.kmEntrada || '';
        let kmFormatado = kmValor ? parseInt(kmValor).toLocaleString('pt-BR') + ' km' : '-';
        
        const conteudo = `
            <div class="row">
                <div class="col-md-6 mb-3"><strong>Placa:</strong> ${os.placa || '-'}</div>
                <div class="col-md-6 mb-3"><strong>Cliente:</strong> ${os.nomeCliente || '-'}</div>
                <div class="col-md-6 mb-3"><strong>Veículo:</strong> ${os.marcaCarro} ${os.modeloCarro} (${os.litragemCarro})</div>
                <div class="col-md-6 mb-3"><strong>Ano:</strong> ${os.anoCarro || '-'}</div>
                <div class="col-md-6 mb-3"><strong>Data da OS:</strong> ${dataExibicao}</div>
                <div class="col-md-6 mb-3"><strong>Quilometragem:</strong> ${kmFormatado}</div>
            </div>
            <hr>
            <div class="mb-3">
                <strong>Descrição do Serviço:</strong><br>
                <div class="p-2 bg-light border rounded mt-1" style="white-space: pre-wrap;">${os.descricao || 'Sem descrição.'}</div>
            </div>
            <hr>
            <div class="row text-end">
                <div class="col-12 text-success fs-5"><strong>Valor Total:</strong> R$ ${(os.valorTotal || 0).toFixed(2)}</div>
                <div class="col-12 text-muted small">
                    Repasse Carlos: R$ ${(os.comissao?.carlos || 0).toFixed(2)} | Repasse Ratinho: R$ ${(os.comissao?.ratinho || 0).toFixed(2)} ${repassesExtrasHTML}
                </div>
                
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
        
        // Preenche os dados específicos da OS
        document.getElementById("dataOS").value = os.data || (os.dataEntrada ? os.dataEntrada.split('T')[0] : ''); // <-- ADICIONE ESTA LINHA 
        let kmOriginal = os.quilometragem || os.kmEntrada || '';
        document.getElementById("quilometragem").value = kmOriginal ? parseInt(kmOriginal).toLocaleString('pt-BR') : '';
        document.getElementById("descricao").value = os.descricao || '';
        document.getElementById("valorTotal").value = os.valorTotal || '';
        document.getElementById("repasseCarlos").value = os.comissao?.carlos || '';
        document.getElementById("repasseRatinho").value = os.comissao?.ratinho || '';

        // Limpa e preenche repasses dinâmicos
        const containerRepasses = document.getElementById("containerOutrosRepasses");
        containerRepasses.innerHTML = '';
        
        if (os.outrosRepasses && os.outrosRepasses.length > 0) {
            os.outrosRepasses.forEach(rep => {
                const row = document.createElement("div");
                row.className = "row repasse-item mb-2";
                row.innerHTML = `
                    <div class="col-8"><input type="text" class="form-control repasse-desc" value="${rep.descricao}"></div>
                    <div class="col-4"><input type="number" step="0.01" class="form-control repasse-valor" value="${rep.valor}"></div>
                `;
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

    async confirmarExclusaoOS() {
        const os = this.osSelecionadaParaModal;
        if (confirm(`Tem certeza que deseja EXCLUIR permanentemente a OS do veículo ${os.placa}?`)) {
            try {
                await this.bd.excluirOS(os.id);
                alert("Ordem de serviço excluída com sucesso.");
                
                // Fecha modal
                const modalEl = document.getElementById('modalDetalhesOS');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                // Recarrega a lista
                this.carregarDadosIniciaisConsulta();
            } catch (error) {
                alert("Erro ao tentar excluir a ordem de serviço.");
            }
        }
    }

    async processarFinanceiro(anoMes) {
        // Busca as OS atualizadas
        this.todasAsOS = await this.bd.buscarUltimasOS();
        
        // Zera os dados
        this.dadosFinanceirosAtuais = { oficina: [], carlos: [], ratinho: [], gastos: [] };
        this.totaisFinanceiros = { oficina: 0, carlos: 0, ratinho: 0, gastos: 0 };

        // Filtra as OS pelo mês selecionado (formato YYYY-MM)
        const osDoMes = this.todasAsOS.filter(os => {
            const dataBase = os.data || (os.dataEntrada ? os.dataEntrada.split('T')[0] : '');
            return dataBase.startsWith(anoMes);
        });

        osDoMes.forEach(os => {
            const valorTotal = os.valorTotal || 0;
            const comissaoCarlos = os.comissao?.carlos || 0;
            const comissaoRatinho = os.comissao?.ratinho || 0;
            
            // Calcula gastos extras (Peças, Retífica)
            const gastosOS = (os.outrosRepasses || []).reduce((acc, rep) => acc + (rep.valor || 0), 0);
            
            // O líquido da oficina é o valor cobrado menos as comissões e menos os gastos de peças
            const valorLiquidoOficina = valorTotal - comissaoCarlos - comissaoRatinho - gastosOS;

            // Formatação de data para exibição
            const dataParts = (os.data || os.dataEntrada.split('T')[0]).split('-');
            const dataStr = `${dataParts[2]}/${dataParts[1]}`;
            const descricaoVeiculo = `${os.marcaCarro} ${os.modeloCarro} (${os.placa})`;

            // Registra ganhos da Oficina
            if (valorLiquidoOficina > 0) {
                this.dadosFinanceirosAtuais.oficina.push({ data: dataStr, veiculo: descricaoVeiculo, cliente: os.nomeCliente, valor: valorLiquidoOficina, id: os.id });
                this.totaisFinanceiros.oficina += valorLiquidoOficina;
            }

            // Registra ganhos do Carlos
            if (comissaoCarlos > 0) {
                this.dadosFinanceirosAtuais.carlos.push({ data: dataStr, veiculo: descricaoVeiculo, cliente: os.nomeCliente, valor: comissaoCarlos, id: os.id });
                this.totaisFinanceiros.carlos += comissaoCarlos;
            }

            // Registra ganhos do Ratinho
            if (comissaoRatinho > 0) {
                this.dadosFinanceirosAtuais.ratinho.push({ data: dataStr, veiculo: descricaoVeiculo, cliente: os.nomeCliente, valor: comissaoRatinho, id: os.id });
                this.totaisFinanceiros.ratinho += comissaoRatinho;
            }

            // Registra as despesas
            if (gastosOS > 0) {
                this.dadosFinanceirosAtuais.gastos.push({ veiculo: descricaoVeiculo, valor: gastosOS, desc: os.outrosRepasses.map(r => r.descricao).join(", ") });
                this.totaisFinanceiros.gastos += gastosOS;
            }
        });

        // Atualiza a tela
        document.getElementById("totalOficina").textContent = `R$ ${this.totaisFinanceiros.oficina.toFixed(2).replace('.', ',')}`;
        document.getElementById("totalCarlos").textContent = `R$ ${this.totaisFinanceiros.carlos.toFixed(2).replace('.', ',')}`;
        document.getElementById("totalRatinho").textContent = `R$ ${this.totaisFinanceiros.ratinho.toFixed(2).replace('.', ',')}`;
    }

    abrirModalFinanceiro(tipo) {
        const titulos = { oficina: "Detalhes: Caixa da Oficina (Líquido)", carlos: "Detalhes: Serviços Carlos", ratinho: "Detalhes: Serviços Ratinho" };
        document.getElementById("tituloModalFinanceiro").textContent = titulos[tipo];
        
        const tbody = document.getElementById("tabelaFinanceiroBody");
        tbody.innerHTML = "";
        
        const lista = this.dadosFinanceirosAtuais[tipo];
        
        if (lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum serviço registrado neste mês.</td></tr>';
        } else {
            lista.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td>${item.data}</td>
                        <td>${item.veiculo}</td>
                        <td>${item.cliente}</td>
                        <td class="text-success fw-bold">R$ ${item.valor.toFixed(2).replace('.', ',')}</td>
                    </tr>
                `;
            });
        }
        
        document.getElementById("totalModalFinanceiro").textContent = `Total: R$ ${this.totaisFinanceiros[tipo].toFixed(2).replace('.', ',')}`;
        
        const modal = new bootstrap.Modal(document.getElementById("modalDetalhesFinanceiro"));
        modal.show();
    }

    exportarWhats(tipo) {
        const mesRef = document.getElementById("filtroMesFinanceiro").value.split('-').reverse().join('/');
        let texto = "";

        if (tipo === "geral") {
            const faturamentoBruto = this.totaisFinanceiros.oficina + this.totaisFinanceiros.carlos + this.totaisFinanceiros.ratinho + this.totaisFinanceiros.gastos;
            texto = `*FECHAMENTO GERAL - OFICINA* \n*Mês de Referência:* ${mesRef}\n\n`;
            texto += `*Resumo Financeiro:*\n`;
            texto += `[+] Faturamento Bruto: R$ ${faturamentoBruto.toFixed(2)}\n`;
            texto += `[=] Oficina (Caixa Líquido): R$ ${this.totaisFinanceiros.oficina.toFixed(2)}\n`;
            texto += `[-] Repasses Carlos: R$ ${this.totaisFinanceiros.carlos.toFixed(2)}\n`;
            texto += `[-] Repasses Ratinho: R$ ${this.totaisFinanceiros.ratinho.toFixed(2)}\n`;
            texto += `[!] Gastos Extras (Peças/Etc): R$ ${this.totaisFinanceiros.gastos.toFixed(2)}\n\n`;
            
            texto += `*DETALHES - CAIXA DA OFICINA:*\n`;
            this.dadosFinanceirosAtuais.oficina.forEach(i => texto += `• ${i.data} | ${i.veiculo} - R$ ${i.valor.toFixed(2)}\n`);
            
            if (this.dadosFinanceirosAtuais.gastos.length > 0) {
                texto += `\n*DETALHES - GASTOS EXTRAS:*\n`;
                this.dadosFinanceirosAtuais.gastos.forEach(g => texto += `• ${g.veiculo} (${g.desc}) - R$ ${g.valor.toFixed(2)}\n`);
            }
        } else {
            const nomes = { oficina: "CAIXA DA OFICINA", carlos: "CARLOS", ratinho: "RATINHO" };
            texto = `*RESUMO DE GANHOS - ${nomes[tipo]}* \n*Mês de Referência:* ${mesRef}\n\n`;
            this.dadosFinanceirosAtuais[tipo].forEach(item => {
                texto += `${item.data} - ${item.veiculo}\n Cliente: ${item.cliente}\n Valor: R$ ${item.valor.toFixed(2)}\n\n`;
            });
            texto += `*VALOR TOTAL A RECEBER: R$ ${this.totaisFinanceiros[tipo].toFixed(2)}*`;
        }

        const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
        window.open(url, '_blank');
    }


imprimirReciboOS() {
        const os = this.osSelecionadaParaModal;
        if (!os) return;

        // Formatação da Data
        let dataExibicao = "N/A";
        const dataBase = os.data || (os.dataEntrada ? os.dataEntrada.split('T')[0] : null);
        if (dataBase) {
            const partes = dataBase.split('-');
            if (partes.length === 3) dataExibicao = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        // Formatação do KM
        let kmValor = os.quilometragem || os.kmEntrada || '';
        let kmFormatado = kmValor ? parseInt(kmValor).toLocaleString('pt-BR') + ' km' : '-';

        // Formatação dos Gastos Extras / Peças
        let repassesExtrasHTML = '';
        if (os.outrosRepasses && os.outrosRepasses.length > 0) {
            repassesExtrasHTML = '<br><strong>PEÇAS E OUTROS:</strong><br>';
            os.outrosRepasses.forEach(rep => {
                repassesExtrasHTML += `<div style="display: flex; justify-content: space-between;"><span>${rep.descricao}</span> <span>R$ ${(rep.valor || 0).toFixed(2).replace('.', ',')}</span></div>`;
            });
        }

        // Estrutura do Recibo (Estilo Cupom)
        const reciboHTML = `
            <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
                <h2 style="margin: 0; font-weight: bold; text-transform: uppercase;">Oficina do Evandro</h2>
                <p style="margin: 5px 0 0 0; font-size: 16px;">São Francisco de Assis - RS</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Documento Auxiliar de Prestação de Serviço</p>
                <p style="margin: 0; font-size: 12px;">(Sem Valor Fiscal)</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <strong>OS Nº: ${os.id.substring(0, 8).toUpperCase()}</strong>
                <strong>DATA: ${dataExibicao}</strong>
            </div>
            
            <div style="border-bottom: 1px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
                <strong>CLIENTE:</strong> ${os.nomeCliente || '-'}<br>
                <strong>VEÍCULO:</strong> ${os.marcaCarro} ${os.modeloCarro} (${os.litragemCarro})<br>
                <strong>PLACA:</strong> ${os.placa || '-'} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>ANO:</strong> ${os.anoCarro || '-'}<br>
                <strong>QUILOMETRAGEM:</strong> ${kmFormatado}
            </div>

            <div style="border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
                <strong>MÃO DE OBRA / SERVIÇOS EXECUTADOS:</strong><br>
                <div style="white-space: pre-wrap; margin-top: 8px;">${os.descricao || 'Sem descrição.'}</div>
                ${repassesExtrasHTML}
            </div>

            <div style="text-align: right; font-size: 22px; margin-bottom: 40px;">
                <strong>TOTAL GERAL: R$ ${(os.valorTotal || 0).toFixed(2).replace('.', ',')}</strong>
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

// Inicia a aplicação
const oficinaApp = new App();