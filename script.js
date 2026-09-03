let paredeAtual = 0; 
let paredeAnterior = 0; 
let inventario = []; 
let itemSelecionado = null; 
let girando = false; 
let noMenu = true; 

// Variáveis do Tutorial e Terror
const paginasLivroImagens = ['livro_pag1_2', 'livro_pag3'];
let paginaAtualTutorial = 0;
let errosCofre = 0;

let estado = {
    tapeteMovido: false, gavetaAberta: false, vidroQuebrado: false,
    quadroRevelado: false, almofadaRasgada: false, caixaMesaAberta: false,
    cofreAberto: false
};

// ==========================================
// SISTEMA DE ÁUDIO
// ==========================================
const audioMenu = new Audio('midia/musica_menu.mp3'); 
audioMenu.loop = true; audioMenu.volume = 0.8; 

const audioFundo = new Audio('midia/musica.mp3');
audioFundo.loop = true; audioFundo.volume = 1; 

const audioLivro = new Audio('midia/livro.mp3'); audioLivro.volume = 1; 
const audioItem = new Audio('midia/pegar_inventario.mp3'); audioItem.volume = 0.2; 
const audioPorta = new Audio('midia/porta.mp3'); audioPorta.volume = 0.8;

let somMutado = false;

document.addEventListener('click', () => {
    if (!somMutado && noMenu) {
        audioMenu.play().catch(e => console.log("Áudio aguardando interação:", e));
    }
}, { once: true }); 

function alternarAudio() {
    somMutado = !somMutado;
    if (somMutado) {
        audioFundo.pause(); audioMenu.pause(); 
        document.getElementById('btn-audio').innerText = "🔇";
    } else {
        if (noMenu) audioMenu.play();
        else audioFundo.play();
        document.getElementById('btn-audio').innerText = "🔊";
    }
}

function tocarSomEfeito(audioObj) {
    if (!somMutado) {
        audioObj.currentTime = 0; 
        audioObj.play().catch(e => console.log("Áudio bloqueado:", e));
    }
}

// ==========================================
// INÍCIO DO JOGO E TRANSIÇÃO (PRÓLOGO)
// ==========================================
function iniciarJogo() {
    try {
        noMenu = false;      
        audioMenu.pause();   
        document.getElementById('start-screen').classList.add('hidden-overlay');
        document.getElementById('prologue-screen').classList.remove('hidden-overlay');
        if (!somMutado) {
            audioFundo.play().catch(e => console.log("Navegador bloqueou o autoplay:", e));
        }
    } catch (erro) {
        alert("Erro ao carregar o jogo: " + erro.message);
    }
}

function entrarNaSala() {
    tocarSomEfeito(audioPorta);
    document.getElementById('prologue-screen').classList.add('hidden-overlay');
    document.getElementById('ui-layer').style.display = 'flex';
    atualizarVisao();
    
    // Inicia o ciclo de sustos aleatórios!
    agendarProximoSusto();
}

// ==========================================
// MÁQUINA DE ESCREVER (DIÁLOGOS)
// ==========================================
let intervaloDigitacao = null; 
const velocidadeTexto = 25;   

function digitarTextoElemento(elementoId, textoCompleto) {
    let elemento = document.getElementById(elementoId);
    elemento.innerText = ""; 
    let i = 0;
    if (intervaloDigitacao) clearInterval(intervaloDigitacao);
    intervaloDigitacao = setInterval(() => {
        if (i < textoCompleto.length) {
            elemento.innerText += textoCompleto.charAt(i);
            i++;
        } else {
            clearInterval(intervaloDigitacao);
            intervaloDigitacao = null;
        }
    }, velocidadeTexto);
}

function mostrarDialogo(texto) {
    document.getElementById('dialogue-box').style.display = 'block';
    digitarTextoElemento('dialogue-text', texto);
}

function fecharDialogo() { 
    if (intervaloDigitacao) {
        clearInterval(intervaloDigitacao); intervaloDigitacao = null;
    }
    document.getElementById('dialogue-box').style.display = 'none'; 
}

// ==========================================
// SISTEMA DE INVENTÁRIO
// ==========================================
const imagensItens = {
    'lanterna_vazia': 'midia/lampada_escura.png',
    'lanterna_uv': 'midia/lampada_acessa.png',
    'metade_chave1': 'midia/pedaco_chave1.png', 
    'metade_chave2': 'midia/pedaco_chave2.png',
    'cola': 'midia/cola.png',
    'martelo': 'midia/martelo.png',
    'estilete': 'midia/estilete.png',
    'pilhas': 'midia/pilhas.png',
    'chave_sem_cola': 'midia/chave_inteira.png', 
    'chave_montada': 'midia/chave_inteira.png'
};

const combinacoes = {
    'lanterna_vazia+pilhas': 'lanterna_uv',
    'pilhas+lanterna_vazia': 'lanterna_uv',
    'metade_chave1+metade_chave2': 'chave_sem_cola',
    'metade_chave2+metade_chave1': 'chave_sem_cola',
    'chave_sem_cola+cola': 'chave_montada',
    'cola+chave_sem_cola': 'chave_montada'
};

const nomesItens = {
    'lanterna_uv': 'Lanterna UV Ligada',
    'chave_sem_cola': 'Chave (Descolada)',
    'chave_montada': 'Chave Pronta'
};

function adicionarAoInventario(item, nomeExibicao) {
    if (!inventario.includes(item)) {
        inventario.push(item);
        let div = document.createElement('div');
        div.className = 'inventory-item'; div.id = 'inv-' + item; div.setAttribute('data-name', nomeExibicao); 
        if (imagensItens[item]) { div.style.backgroundImage = `url('${imagensItens[item]}')`; } else { div.innerText = nomeExibicao; }
        div.onclick = function() { selecionarItem(item); };
        document.getElementById('inventory-bar').appendChild(div);
        tocarSomEfeito(audioItem);
    }
}

function removerDoInventario(item) {
    let index = inventario.indexOf(item);
    if (index > -1) inventario.splice(index, 1);
    let div = document.getElementById('inv-' + item);
    if (div) div.remove();
    itemSelecionado = null; 
}

function selecionarItem(item) {
    if (itemSelecionado === item) {
        itemSelecionado = null; document.getElementById('inv-' + item).classList.remove('selected-item');
    } else if (itemSelecionado) {
        let tentativaComb = itemSelecionado + '+' + item;
        if (combinacoes[tentativaComb]) {
            let novoItem = combinacoes[tentativaComb];
            mostrarDialogo("Você combinou os itens e formou: " + nomesItens[novoItem] + "!");
            removerDoInventario(itemSelecionado); removerDoInventario(item); adicionarAoInventario(novoItem, nomesItens[novoItem]);
        } else {
            document.getElementById('inv-' + itemSelecionado).classList.remove('selected-item');
            itemSelecionado = item; document.getElementById('inv-' + item).classList.add('selected-item');
        }
    } else {
        itemSelecionado = item; document.getElementById('inv-' + item).classList.add('selected-item');
    }
}

// ==========================================
// NAVEGAÇÃO DA SALA
// ==========================================
function atualizarFundoParede1() {
    let v = estado.vidroQuebrado; let c = estado.caixaMesaAberta; let g = estado.gavetaAberta;
    let fundo = 'midia/2.png'; 

    if (v && c && g) { fundo = 'midia/parede2_caixa_quebrada_cofre_aberto_gaveta_aberta.jpg'; } 
    else if (!v && c && g) { fundo = 'midia/parede2_cofre_aberto_gaveta_aberta.jpg'; } 
    else if (v && c && !g) { fundo = 'midia/parede2_caixa_quebrada_cofre_aberto.jpg'; } 
    else if (v && !c && !g) { fundo = 'midia/parede2_caixa_quebrada.jpg'; } 
    else if (!v && c && !g) { fundo = 'midia/parede2_cofre_aberto.jpg'; } 
    else if (!v && !c && g) { fundo = 'midia/parede2_gaveta_aberta.jpg'; } 
    else if (v && !c && g) { fundo = 'midia/parede2_gaveta_aberta.jpg'; }

    document.getElementById('wall-1').style.backgroundImage = `url('${fundo}')`;
}

function atualizarVisao() {
    for (let i = 0; i <= 4; i++) document.getElementById('wall-' + i).classList.remove('active-view');
    document.getElementById('wall-' + paredeAtual).classList.add('active-view');
}

function mudarParede(direcao) {
    if (girando) return;
    fecharDialogo(); girando = true; document.getElementById('room-transition').style.opacity = '1';

    setTimeout(() => {
        if (paredeAtual === 4) paredeAtual = paredeAnterior;
        if (direcao === 'direita') paredeAtual = (paredeAtual + 1) % 4;
        else if (direcao === 'esquerda') paredeAtual = (paredeAtual - 1 + 4) % 4;
        
        atualizarVisao(); document.getElementById('room-transition').style.opacity = '0';
        setTimeout(() => { girando = false; }, 250);
    }, 250); 
}

function olharTeto() {
    if (girando) return;
    fecharDialogo(); girando = true; document.getElementById('room-transition').style.opacity = '1';

    setTimeout(() => {
        if (paredeAtual !== 4) { paredeAnterior = paredeAtual; paredeAtual = 4; } 
        else { paredeAtual = paredeAnterior; }
        
        atualizarVisao(); document.getElementById('room-transition').style.opacity = '0';
        setTimeout(() => { girando = false; }, 250);
    }, 250);
}

// ==========================================
// FUNÇÕES DE ZOOM NO COFRE E ITENS
// ==========================================
let cofreEmFoco = null;
let senhaDigitada = "";

function abrirZoomCofre(tipo) {
    fecharDialogo(); cofreEmFoco = tipo; senhaDigitada = "";
    
    let container = document.getElementById('examine-container');
    let display = document.getElementById('examine-display');
    let keypad = document.getElementById('examine-keypad');
    let examineText = document.getElementById('examine-text');
    let bookControls = document.getElementById('book-controls');
    
    container.className = ""; container.classList.add('layout-' + tipo); 
    container.style.backgroundImage = `url('midia/cofre_de_perto_${tipo}.png')`;
    
    display.style.display = 'flex'; keypad.style.display = 'grid';
    examineText.style.display = 'none'; bookControls.style.display = 'none';
    
    display.innerText = ""; display.style.color = (tipo === 'cinza') ? "#2ecc71" : "#e74c3c"; 
    
    document.getElementById('examine-view').classList.remove('hidden-overlay');
}

function abrirZoomItem(imagem, textoDescricao) {
    fecharDialogo();
    let container = document.getElementById('examine-container');
    let display = document.getElementById('examine-display');
    let keypad = document.getElementById('examine-keypad');
    let examineText = document.getElementById('examine-text');
    let bookControls = document.getElementById('book-controls');
    
    display.style.display = 'none'; keypad.style.display = 'none';
    
    if (imagem === 'livro') {
        paginaAtualTutorial = 0; container.style.backgroundImage = `url('midia/${paginasLivroImagens[paginaAtualTutorial]}.png')`;
        examineText.style.display = 'none'; bookControls.style.display = 'flex'; 
        document.getElementById('book-page-indicator').innerText = `1/${paginasLivroImagens.length}`;
    } else if (textoDescricao) {
        container.style.backgroundImage = `url('midia/${imagem}.png')`;
        examineText.style.display = 'block'; bookControls.style.display = 'none';
        document.getElementById('book-content').innerHTML = textoDescricao;
    } else {
        container.style.backgroundImage = `url('midia/${imagem}.png')`;
        examineText.style.display = 'none'; bookControls.style.display = 'none';
    }
    container.className = ""; document.getElementById('examine-view').classList.remove('hidden-overlay');
}

function mudarPaginaTutorial(direcao) {
    let novaPagina = paginaAtualTutorial + direcao;
    if (novaPagina >= 0 && novaPagina < paginasLivroImagens.length) {
        paginaAtualTutorial = novaPagina; tocarSomEfeito(audioLivro);
        document.getElementById('examine-container').style.backgroundImage = `url('midia/${paginasLivroImagens[paginaAtualTutorial]}.png')`;
        document.getElementById('book-page-indicator').innerText = `${paginaAtualTutorial + 1}/${paginasLivroImagens.length}`;
    }
}

function fecharZoom() {
    if (intervaloDigitacao) { clearInterval(intervaloDigitacao); intervaloDigitacao = null; }
    document.getElementById('examine-view').classList.add('hidden-overlay'); cofreEmFoco = null;
    document.getElementById('examine-text').style.display = 'none';
    document.getElementById('examine-container').classList.remove('shake-animation'); fecharDialogo();
}

function digitarCofre(num) {
    if (senhaDigitada === "ERRO" || senhaDigitada === "OK" || senhaDigitada === "NÃO ADIANTA") return; 
    let limite = (cofreEmFoco === 'cinza') ? 4 : 3;
    if (senhaDigitada.length < limite) {
        senhaDigitada += num; let display = document.getElementById('examine-display');
        if (display) display.innerText = senhaDigitada;
    }
    if (senhaDigitada.length === limite) { verificarSenhaCofre(); }
}

function verificarSenhaCofre() {
    let display = document.getElementById('examine-display');
    let container = document.getElementById('examine-container');
    let viewPrincipal = document.getElementById('examine-view');
    
    if (cofreEmFoco === 'cinza' && senhaDigitada === "6532") {
        display.innerText = "OK";
        setTimeout(() => { fecharZoom(); mostrarDialogo("O cofre destrancou! Você encontrou os documentos da herança.\n(A porta da sala foi trancada eletronicamente)."); estado.cofreAberto = true; }, 1000);
    } else if (cofreEmFoco === 'vermelho' && senhaDigitada === "121") {
        display.innerText = "OK";
        setTimeout(() => { fecharZoom(); mostrarDialogo("O cofre vermelho destrancou! Lá dentro você encontrou um pedaço de uma Chave e um Tubo de Cola!");
            adicionarAoInventario('metade_chave2', 'Base da Chave'); adicionarAoInventario('cola', 'Tubo de Cola'); estado.caixaMesaAberta = true; atualizarFundoParede1(); }, 1000);
    } else {
        display.innerText = "ERRO"; container.classList.add('shake-animation'); errosCofre++; viewPrincipal.classList.add('damage-flash');
        if (errosCofre >= 3) { setTimeout(() => { display.innerText = "A"; display.style.color = "#ff0000"; }, 200); }
        setTimeout(() => { senhaDigitada = ""; display.innerText = ""; display.style.color = (cofreEmFoco === 'cinza') ? "#2ecc71" : "#e74c3c";
            container.classList.remove('shake-animation'); viewPrincipal.classList.remove('damage-flash'); }, 1000); 
    }
}

// ==========================================
// INTERAÇÕES DA SALA
// ==========================================
function interagir(itemClicado) {
    switch(itemClicado) {
       case 'diario-lore': 
            tocarSomEfeito(audioLivro);
            abrirZoomItem('diario', "DIÁRIO DE ARTHUR V.\n\n04 de Setembro: 'Eles acham que a riqueza da família veio da bolsa de valores. Tolos. O crescimento exponencial que descobri se aplica a algo muito mais assustador.'\n\n12 de Outubro: 'Estão me vigiando. Tranquei a fórmula. Dividi os logaritmos pelo escritório. Se eles entrarem, o cofre destrói tudo.'\n\n23 de Outubro (Ontem): 'Minha mente está em decaimento. O herdeiro precisa entender o poder do tempo e dos expoentes. Só o sangue do meu sangue sobreviverá à verdade.'"); 
            break;
            
        case 'lanterna-vazia': 
            mostrarDialogo("Encontrei uma Lanterna na estante. Infelizmente, está sem pilhas."); 
            adicionarAoInventario('lanterna_vazia', 'Lanterna (Sem pilhas)'); 
            document.getElementById('lanterna-vazia').style.display = 'none'; 
            document.getElementById('wall-0').style.backgroundImage = "url('midia/1.png')";
            break;
            
        case 'estante-cofre': 
            mostrarDialogo("Uma estante cheia de livros antigos e poeira. O cofre está bem no meio."); 
            break;
        
        case 'cofre':
            if (estado.cofreAberto) { mostrarDialogo("O cofre já está aberto. Recuperei os documentos da herança! Agora preciso de encontrar uma forma de abrir a porta da sala."); } 
            else { abrirZoomCofre('cinza'); } 
            break;

        case 'janela': 
            mostrarDialogo("A janela está trancada... pelo lado de fora. A floresta escura parece estar me observando de volta. Um calafrio sobe pela minha espinha."); 
            break;
        
        case 'caixa-trancada':
            if (estado.caixaMesaAberta) { mostrarDialogo("O cofre vermelho já está aberto."); } 
            else { abrirZoomCofre('vermelho'); } 
            break;

        case 'caixa-vidro':
            if (estado.vidroQuebrado) { mostrarDialogo("O vidro está estilhaçado. A nota diz:\n'3º Dígito: Descobre o expoente na equação 3^(x-1) = 9.'\n[Valor = x]"); } 
            else if (itemSelecionado === 'martelo') {
                mostrarDialogo("Você quebrou o vidro! Pegou a Pista:\n'3º Dígito: Descobre o expoente na equação 3^(x-1) = 9.'\nE junto caiu um Estilete!");
                estado.vidroQuebrado = true; removerDoInventario('martelo'); adicionarAoInventario('estilete', 'Estilete'); atualizarFundoParede1(); 
            } else { mostrarDialogo("Esta caixa preta no chão tem um vidro muito resistente. Preciso de algo pesado para quebrar."); }
            break;

        case 'mesa-cabeceira': 
            mostrarDialogo("Um criado-mudo de madeira escura com duas gavetas."); 
            break;
            
        case 'livro-formulas': 
            tocarSomEfeito(audioLivro); abrirZoomItem('livro'); 
            break;
        
        case 'gaveta':
            if (estado.gavetaAberta) { mostrarDialogo("Bilhete na gaveta:\n'1º Dígito: O meu patrimônio dobrou todos os anos segundo a função V(t) = 2^t.\nEm que ano (t) atingiu o valor de 64?'\n[Valor = t]"); } 
            else if (itemSelecionado === 'chave_montada') {
                mostrarDialogo("A chave colada funcionou perfeitamente! A gaveta revelou um bilhete:\n'1º Dígito: O meu patrimônio dobrou todos os anos segundo a função V(t) = 2^t. Em que ano (t) atingiu o valor de 64?'");
                estado.gavetaAberta = true; removerDoInventario('chave_montada'); atualizarFundoParede1(); 
            } else if (itemSelecionado === 'chave_sem_cola') { mostrarDialogo("As metades estão soltas. Se eu tentar usar assim, vão cair e se partir lá dentro. Preciso de cola."); } 
            else { mostrarDialogo("A gaveta do criado-mudo está trancada com chave."); }
            break;

        case 'estante-sec': 
            mostrarDialogo("Uma estante cheia de livros de física quântica, ocultismo e... criptografia avançada. Tem algo muito errado com o que o vovô andava estudando."); 
            break;
            
        case 'quadro-carro':
            if (estado.quadroRevelado) { mostrarDialogo("A tinta UV brilha com a Pista:\n'2º Dígito: Use a propriedade da soma para resolver: log₂(8) + log₂(4).'"); } 
            else if (itemSelecionado === 'lanterna_uv') {
                mostrarDialogo("A luz UV revelou uma equação neon na pintura do carro!\n'2º Dígito: Use a propriedade da soma para resolver: log₂(8) + log₂(4).'\nA lanterna descarregou e pifou.");
                estado.quadroRevelado = true; document.getElementById('quadro-carro').style.color = "#00ffcc"; document.getElementById('quadro-carro').innerText = "log₂(8) + log₂(4)"; removerDoInventario('lanterna_uv'); 
            } else { mostrarDialogo("Um belo quadro de um carro antigo. Parece normal a olho nu."); }
            break;

        case 'tapete':
            if (!estado.tapeteMovido) {
                mostrarDialogo("Você arrastou o tapete para o lado! Havia a ponta de uma chave escondida por baixo!");
                document.getElementById('tapete').style.transform = "translate(-30px, -15px)"; 
                document.getElementById('chave-chao').style.display = "block"; 
                document.getElementById('tapete').style.pointerEvents = "none"; 
                estado.tapeteMovido = true;
            }
            break;
            
        case 'chave-chao':
            mostrarDialogo("Peguei a Ponta da Chave!"); adicionarAoInventario('metade_chave1', 'Ponta da Chave'); document.getElementById('chave-chao').style.display = "none"; break;
        
        case 'sofa':
            if (!inventario.includes('martelo') && !estado.vidroQuebrado) { 
                mostrarDialogo("Tateando o sofá no escuro... Sinto algo pesado escondido entre as almofadas. Peguei um Martelo! Por que ele esconderia uma arma aqui?"); 
                adicionarAoInventario('martelo', 'Martelo Pesado'); 
            } else { 
                mostrarDialogo("As almofadas estão frias. Há marcas de unhas no estofado, como se alguém tivesse sido arrastado daqui."); 
            }
            break;
        
        case 'almofada':
            if (estado.almofadaRasgada) { mostrarDialogo("A almofada branca está rasgada. A nota diz:\n'4º Dígito: Aplique a propriedade da potência para achar x em: log₅(25^x) = 4.'"); } 
            else if (itemSelecionado === 'estilete') {
                mostrarDialogo("Cortei o tecido! Lá dentro estava uma nota:\n'4º Dígito: Aplique a propriedade da potência para achar x em: log₅(25^x) = 4.'\nE também encontrei Pilhas!");
                estado.almofadaRasgada = true; removerDoInventario('estilete'); adicionarAoInventario('pilhas', 'Pilhas');
                document.getElementById('wall-3').style.backgroundImage = "url('midia/parede4_almofada_rasgada.png')";
            } else { mostrarDialogo("Esta almofada branca tem uma costura grossa e um volume estranho lá dentro."); }
            break;
        
        case 'porta-saida':
            if (estado.cofreAberto) { mostrarDialogo("Porta destrancada! Consegui sair com as escrituras da herança!"); setTimeout(() => vencerJogo(), 500); } 
            else { mostrarDialogo("A porta de madeira está bloqueada eletronicamente."); }
            break;
        
        case 'lampada': 
            mostrarDialogo("No teto, perto da lâmpada, há uma marcação com a ordem correta dos dígitos do cofre vermelho:\n\n1º: Criados\n2º: Almofadas\n3º: Janelas\n"); 
            break;
    }
}

function vencerJogo() {
    document.getElementById('ui-layer').style.display = 'none';
    document.getElementById('end-screen').classList.remove('hidden-overlay');
}

// EFEITO PARALLAX NO TÍTULO DO MENU
document.getElementById('start-screen').addEventListener('mousemove', function(e) {
    let wrapper = document.getElementById('title-wrapper');
    if (!wrapper) return;
    let largura = window.innerWidth; let altura = window.innerHeight;
    let moverX = (e.clientX - largura / 2) / 45; let moverY = (e.clientY - altura / 2) / 45;
    wrapper.style.transform = `translate(${moverX}px, ${moverY}px)`;
});

// ==========================================
// FUNÇÕES DO SUSTO RELÂMPAGO
// ==========================================
function darSustoRelampago() {
    let criatura = document.getElementById('criatura-susto');
    
    // 1. O bicho aparece do nada
    criatura.classList.add('aparecer-bicho');
    
    // 2. Some depois de 100ms
    setTimeout(() => {
        criatura.classList.remove('aparecer-bicho');
        
        // 3. Agenda quando vai ser o próximo susto aleatório
        agendarProximoSusto();
    }, 200); 
}

function agendarProximoSusto() {
    // Sorteia um tempo entre 15 e 45 segundos para aparecer de novo
    let tempoSorteado = Math.floor(Math.random() * (300000 - 120000 + 1)) + 120000;
    setTimeout(darSustoRelampago, tempoSorteado);
}