// Impede que outro site carregue o Parafusa escondido dentro de um quadro (clickjacking:
// a pessoa acha que clica no site do golpista, mas clica no Parafusa invisível por cima).
// O GitHub Pages não deixa configurar o cabeçalho X-Frame-Options, então é feito aqui.
// Precisa rodar antes de tudo, por isso é um script comum (não módulo) no <head>.
(function () {
    if (window.top === window.self) return;

    // Quadro do próprio Parafusa (mesmo endereço) é permitido
    let mesmoSite = false;
    try {
        mesmoSite = window.top.location.origin === window.location.origin;
    } catch {
        // Ler o endereço da janela de cima falha quando ela é de outro site
    }
    if (mesmoSite) return;

    // Esconde a página e tenta abrir o Parafusa na janela inteira
    document.documentElement.style.display = "none";
    try {
        window.top.location = window.location.href;
    } catch {
        // Se o navegador não deixar, a página continua escondida
    }
})();
