import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 1. CONFIGURAÇÃO DO FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);

// ==========================================
// 2. CAMADA DE BANCO DE DADOS (Model)
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
                // Retorna o primeiro veículo encontrado e seus dados
                return querySnapshot.docs[0].data();
            }
            return null; // Primeira vez na oficina
        } catch (error) {
            console.error("Erro ao buscar placa:", error);
            throw error;
        }
    }

    async salvarNovaOS(dadosOS) {
        try {
            const osRef = collection(this.db, "ordens_servico");
            await addDoc(osRef, dadosOS);
            // Aqui você também implementaria a lógica de salvar Cliente/Veiculo 
            // caso seja a primeira vez deles.
            return true;
        } catch (error) {
            console.error("Erro ao salvar OS:", error);
            throw error;
        }
    }
}

// ==========================================
// 3. CAMADA DE INTERFACE (View)
// ==========================================
class Interface {
    constructor() {
        this.formOS = document.getElementById("formOS");
        this.alertaBusca = document.getElementById("alertaBusca");
        this.areaHistorico = document.getElementById("areaHistorico");
        
        // Inputs
        this.inputPlaca = document.getElementById("placaBusca");
        this.inputNome = document.getElementById("nomeCliente");
        this.inputModelo = document.getElementById("modeloCarro");
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
            this.inputNome.value = dadosVeiculo.nome_cliente; // Supondo que venha na query
            this.inputModelo.value = dadosVeiculo.modelo;
            this.areaHistorico.classList.remove("d-none");
        } else {
            this.alertaBusca.innerHTML = `<span class="text-primary fw-bold">Veículo novo. Preencha os dados.</span>`;
            this.inputNome.value = "";
            this.inputModelo.value = "";
            this.areaHistorico.classList.add("d-none");
        }
    }

    limparFormulario() {
        this.formOS.reset();
        this.formOS.classList.add("d-none");
        this.inputPlaca.value = "";
        this.alertaBusca.innerHTML = "";
    }
}

// ==========================================
// 4. CONTROLADOR DA APLICAÇÃO (Controller)
// ==========================================
class App {
    constructor() {
        this.bd = new BancoDeDados(db);
        this.ui = new Interface();
        
        this.inicializarEventos();
    }

    inicializarEventos() {
        // Evento: Botão de buscar placa
        document.getElementById("btnBuscarPlaca").addEventListener("click", () => this.lidarComBuscaPlaca());
        
        // Evento: Submeter o formulário principal
        document.getElementById("formOS").addEventListener("submit", (e) => this.lidarComSalvamento(e));
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
            alert("Erro de conexão ao buscar a placa.");
        } finally {
            this.ui.mostrarCarregando(false);
        }
    }

    async lidarComSalvamento(evento) {
        evento.preventDefault(); // Impede a página de recarregar

        // Coleta os dados do DOM
        const dadosNovaOS = {
            placa: this.ui.inputPlaca.value.toUpperCase(),
            nomeCliente: document.getElementById("nomeCliente").value,
            modeloCarro: document.getElementById("modeloCarro").value,
            kmEntrada: document.getElementById("kmEntrada").value,
            kmSaida: document.getElementById("kmSaida").value,
            descricao: document.getElementById("descricao").value,
            valorTotal: document.getElementById("valorTotal").value,
            mecanico: document.getElementById("mecanico").value,
            valorRepasse: document.getElementById("valorRepasse").value || 0,
            dataEntrada: new Date().toISOString()
        };

        try {
            await this.bd.salvarNovaOS(dadosNovaOS);
            alert("Ordem de serviço salva com sucesso!");
            this.ui.limparFormulario();
        } catch (error) {
            alert("Erro ao salvar os dados.");
        }
    }
}

// Inicia a aplicação
const oficinaApp = new App();