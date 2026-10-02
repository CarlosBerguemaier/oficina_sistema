// ==========================================
// ACESSO: login, cadastro, criação da oficina e convites
// ==========================================
// Só depois de logado, com perfil e oficina carregados, o sistema principal é aberto (aoEntrar).

import {
    getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    sendPasswordResetEmail, sendEmailVerification, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc, getDoc, collection, writeBatch, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const MENSAGENS_ERRO = {
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/invalid-email": "Este e-mail não é válido.",
    "auth/email-already-in-use": "Já existe uma conta com este e-mail. Tente entrar.",
    "auth/weak-password": "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.",
    "auth/password-does-not-meet-requirements": "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.",
    "auth/too-many-requests": "Muitas tentativas. Espere alguns minutos e tente de novo.",
    "auth/network-request-failed": "Sem conexão com a internet.",
    "auth/operation-not-allowed": "Login por e-mail ainda não foi ativado no Firebase."
};

function traduzirErro(erro) {
    return MENSAGENS_ERRO[erro?.code] || "Algo deu errado. Tente de novo.";
}

export function iniciarAcesso({ appFirebase, db, aoEntrar }) {
    const auth = getAuth(appFirebase);
    auth.languageCode = "pt-BR"; // e-mails de senha/confirmação em português

    const tela = document.getElementById("telaAcesso");
    const mensagem = document.getElementById("acessoMensagem");
    let usuarioAtual = null;
    let conviteAtual = null;
    let entrou = false;

    const mostrarEtapa = (nome) => {
        tela.querySelectorAll("[data-etapa]").forEach(el => el.classList.toggle("d-none", el.dataset.etapa !== nome));
        mostrarMensagem("");
    };

    const mostrarMensagem = (texto, tipo = "erro") => {
        mensagem.className = texto ? `acesso-msg ${tipo}` : "acesso-msg";
        mensagem.textContent = texto;
    };

    // Desabilita o botão enquanto a ação acontece
    const comCarregando = async (botao, acao) => {
        const textoOriginal = botao.innerHTML;
        botao.disabled = true;
        botao.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        try {
            await acao();
        } finally {
            botao.disabled = false;
            botao.innerHTML = textoOriginal;
        }
    };

    // ---------- Navegação entre as etapas ----------
    tela.addEventListener("click", (e) => {
        const link = e.target.closest("[data-ir]");
        if (!link) return;
        e.preventDefault();
        const destino = link.dataset.ir;
        if (destino === "sair") {
            signOut(auth);
            return;
        }
        if (destino === "confirmar") {
            prepararConfirmacao();
            return;
        }
        mostrarEtapa(destino);
    });

    // ---------- Entrar ----------
    document.getElementById("formLogin").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const senha = document.getElementById("loginSenha").value;
        comCarregando(e.submitter || e.target.querySelector("[type=submit]"), async () => {
            try {
                await signInWithEmailAndPassword(auth, email, senha);
            } catch (erro) {
                mostrarMensagem(traduzirErro(erro));
            }
        });
    });

    // ---------- Criar conta ----------
    document.getElementById("formCadastro").addEventListener("submit", (e) => {
        e.preventDefault();
        const nome = document.getElementById("cadastroNome").value.trim();
        const email = document.getElementById("cadastroEmail").value.trim();
        const senha = document.getElementById("cadastroSenha").value;
        comCarregando(e.submitter || e.target.querySelector("[type=submit]"), async () => {
            try {
                const { user } = await createUserWithEmailAndPassword(auth, email, senha);
                await updateProfile(user, { displayName: nome });
                // Confirmação de e-mail: necessária para aceitar convite de outra oficina
                sendEmailVerification(user).catch(() => {});
                await verificarPerfil(user);
            } catch (erro) {
                mostrarMensagem(traduzirErro(erro));
            }
        });
    });

    // ---------- Esqueci a senha ----------
    document.getElementById("formRecuperar").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("recuperarEmail").value.trim();
        comCarregando(e.submitter || e.target.querySelector("[type=submit]"), async () => {
            try {
                await sendPasswordResetEmail(auth, email);
                mostrarMensagem("Pronto! Se este e-mail tiver conta, chegará um link para criar uma nova senha. Veja também o spam.", "ok");
            } catch (erro) {
                mostrarMensagem(traduzirErro(erro));
            }
        });
    });

    // ---------- Criar a oficina (primeiro acesso do dono) ----------
    document.getElementById("formCriarOficina").addEventListener("submit", (e) => {
        e.preventDefault();
        const nomeOficina = document.getElementById("nomeOficinaNova").value.trim();
        if (!nomeOficina) return;
        comCarregando(e.submitter || e.target.querySelector("[type=submit]"), async () => {
            try {
                const oficinaRef = doc(collection(db, "oficinas"));
                const agora = new Date().toISOString();
                // Oficina e perfil são gravados juntos: ou os dois, ou nenhum
                const lote = writeBatch(db);
                lote.set(oficinaRef, { nome: nomeOficina, donoUid: usuarioAtual.uid, criadoEm: agora });
                lote.set(doc(db, "usuarios", usuarioAtual.uid), {
                    oficinaId: oficinaRef.id,
                    nome: usuarioAtual.displayName || "",
                    email: usuarioAtual.email.toLowerCase(),
                    papel: "dono",
                    criadoEm: agora
                });
                await lote.commit();
                await verificarPerfil(usuarioAtual);
            } catch (erro) {
                console.error("Erro ao criar oficina:", erro);
                mostrarMensagem("Não foi possível criar a oficina. Tente de novo.");
            }
        });
    });

    // ---------- Convite ----------
    document.getElementById("btnAceitarConvite").addEventListener("click", (e) => {
        comCarregando(e.currentTarget, async () => {
            try {
                await writeBatch(db)
                    .set(doc(db, "usuarios", usuarioAtual.uid), {
                        oficinaId: conviteAtual.oficinaId,
                        nome: usuarioAtual.displayName || "",
                        email: usuarioAtual.email.toLowerCase(),
                        papel: "membro",
                        criadoEm: new Date().toISOString()
                    })
                    .commit();
                // O convite já foi usado
                await deleteDoc(doc(db, "convites", usuarioAtual.email.toLowerCase())).catch(() => {});
                await verificarPerfil(usuarioAtual);
            } catch (erro) {
                console.error("Erro ao aceitar convite:", erro);
                mostrarMensagem("Não foi possível entrar na oficina. Peça um novo convite.");
            }
        });
    });

    // Tela "confirme seu e-mail" (para quem foi convidado)
    const prepararConfirmacao = () => {
        document.getElementById("emailConfirmacao").textContent = usuarioAtual.email;
        mostrarEtapa("confirmar");
    };

    document.getElementById("btnReenviarConfirmacao").addEventListener("click", (e) => {
        comCarregando(e.currentTarget, async () => {
            try {
                await sendEmailVerification(usuarioAtual);
                mostrarMensagem("Enviamos o link de novo. Veja também o spam.", "ok");
            } catch (erro) {
                mostrarMensagem(traduzirErro(erro));
            }
        });
    });

    document.getElementById("btnJaConfirmei").addEventListener("click", (e) => {
        comCarregando(e.currentTarget, async () => {
            await usuarioAtual.reload();
            // Token novo, para o banco enxergar o e-mail como confirmado
            await usuarioAtual.getIdToken(true);
            if (!usuarioAtual.emailVerified) {
                mostrarMensagem("Ainda não aparece como confirmado. Abra o link do e-mail e tente de novo.");
                return;
            }
            await verificarPerfil(usuarioAtual);
            if (!entrou && !conviteAtual) {
                mostrarEtapa("oficina");
                mostrarMensagem("E-mail confirmado, mas não encontramos convite para ele. Peça para o dono da oficina convidar este e-mail.");
            }
        });
    });

    // ---------- Decide o que mostrar para o usuário logado ----------
    async function verificarPerfil(user) {
        usuarioAtual = user;
        const perfilSnap = await getDoc(doc(db, "usuarios", user.uid));

        if (perfilSnap.exists()) {
            const perfil = perfilSnap.data();
            const oficinaSnap = await getDoc(doc(db, "oficinas", perfil.oficinaId));
            entrou = true;
            tela.classList.add("d-none");
            document.body.classList.remove("sem-sessao");
            aoEntrar({
                auth,
                usuario: user,
                perfil,
                oficina: { id: oficinaSnap.id, ...oficinaSnap.data() },
                sair: async () => {
                    await signOut(auth);
                }
            });
            return;
        }

        // Sem perfil: pode ter convite (só dá para ler com e-mail confirmado)
        conviteAtual = null;
        if (user.emailVerified) {
            try {
                const conviteSnap = await getDoc(doc(db, "convites", user.email.toLowerCase()));
                if (conviteSnap.exists()) conviteAtual = conviteSnap.data();
            } catch (erro) {
                console.warn("Não foi possível ler convite:", erro);
            }
        }

        if (conviteAtual) {
            document.getElementById("nomeOficinaConvite").textContent = conviteAtual.oficinaNome || "uma oficina";
            mostrarEtapa("convite");
        } else {
            document.getElementById("saudacaoNovaOficina").textContent = user.displayName ? `Olá, ${user.displayName.split(" ")[0]}!` : "Olá!";
            mostrarEtapa("oficina");
        }
    }

    onAuthStateChanged(auth, async (user) => {
        // Trocou de usuário com o sistema já aberto: recarrega do zero
        if (entrou) {
            location.reload();
            return;
        }
        tela.classList.remove("d-none");
        document.body.classList.add("sem-sessao");
        if (!user) {
            mostrarEtapa("login");
            return;
        }
        mostrarEtapa("carregando");
        try {
            await verificarPerfil(user);
        } catch (erro) {
            console.error("Erro ao carregar perfil:", erro);
            mostrarEtapa("login");
            mostrarMensagem("Não foi possível carregar sua conta. Verifique a internet e tente de novo.");
        }
    });
}
