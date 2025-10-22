// --- FUNÇÕES DE VALIDAÇÃO E CÁLCULO ---

/**
 * Converte uma string de IP/Máscara para um número de 32 bits.
 * Facilita cálculos bit-a-bit.
 */
function ipToLong(ip) {
    return ip.split('.').reduce((acc, octeto) => (acc << 8) + parseInt(octeto, 10), 0);
}

/**
 * Valida se uma string segue o formato de um endereço IPv4.
 */
function validarFormatoIP(ip) {
    const regexIP = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return regexIP.test(ip);
}

/**
 * **CORRIGIDO**: Valida se uma máscara de sub-rede é conceitualmente válida.
 * Uma máscara válida é uma sequência de bits '1' seguida por '0's.
 */
function validarMascara(mascara) {
    if (!validarFormatoIP(mascara)) return false;
    const mascaraLong = ipToLong(mascara);
    // Inverte os bits e adiciona 1. Se o resultado for uma potência de 2,
    // significa que a máscara original era uma sequência de 1s seguida por 0s.
    const inverted = ~mascaraLong;
    const isPowerOfTwo = (inverted + 1) & inverted;
    return isPowerOfTwo === 0;
}

/**
 * Calcula o endereço de rede a partir de um IP e uma máscara.
 */
function calcularEnderecoRede(ip, mascara) {
    const ipLong = ipToLong(ip);
    const mascaraLong = ipToLong(mascara);
    return ipLong & mascaraLong;
}

/**
 * Calcula o endereço de broadcast a partir de um IP e uma máscara.
 */
function calcularEnderecoBroadcast(ip, mascara) {
    const redeLong = calcularEnderecoRede(ip, mascara);
    const mascaraLong = ipToLong(mascara);
    return redeLong | (~mascaraLong);
}

/**
 * Verifica se um endereço IP é o endereço de rede ou de broadcast.
 */
function ehEnderecoReservado(ip, mascara) {
    const ipLong = ipToLong(ip);
    const redeLong = calcularEnderecoRede(ip, mascara);
    const broadcastLong = calcularEnderecoBroadcast(ip, mascara);
    return ipLong === redeLong || ipLong === broadcastLong;
}

// --- LÓGICA PRINCIPAL ---

function configurarRede() {
    const ip1 = document.getElementById("ip1").value.trim();
    const mascara1 = document.getElementById("mascara1").value.trim();
    const ip2 = document.getElementById("ip2").value.trim();
    const mascara2 = document.getElementById("mascara2").value.trim();
    const gateway = document.getElementById("gateway").value.trim();
    const resultadoDiv = document.getElementById("resultado");
    
    let erros = [];

    // 1. Validação de Formato e Conceito
    if (!validarFormatoIP(ip1)) erros.push("Máquina 1: Formato de IP inválido.");
    if (!validarMascara(mascara1)) erros.push("Máquina 1: Máscara de sub-rede inválida.");
    if (!validarFormatoIP(ip2)) erros.push("Máquina 2: Formato de IP inválido.");
    if (!validarMascara(mascara2)) erros.push("Máquina 2: Máscara de sub-rede inválida.");
    if (!validarFormatoIP(gateway)) erros.push("Gateway: Formato de IP inválido.");

    // Se houver erros de formato, para a verificação aqui.
    if (erros.length > 0) {
        resultadoDiv.innerHTML = `<span class="error">${erros.join("<br>")}</span>`;
        return;
    }

    // 2. Validações de Conflito e Configuração Lógica
    if (ip1 === ip2) erros.push("Conflito: Os IPs das máquinas não podem ser iguais.");
    if (ip1 === gateway) erros.push("Conflito: O IP da Máquina 1 não pode ser igual ao do Gateway.");
    if (ip2 === gateway) erros.push("Conflito: O IP da Máquina 2 não pode ser igual ao do Gateway.");

    if (mascara1 !== mascara2) {
        erros.push("Aviso: As máscaras de sub-rede são diferentes. Para comunicação direta, elas geralmente devem ser iguais.");
    }

    // 3. Validações de Sub-rede
    const rede1 = calcularEnderecoRede(ip1, mascara1);
    const rede2 = calcularEnderecoRede(ip2, mascara2);
    const redeGateway = calcularEnderecoRede(gateway, mascara1); // Gateway deve ser validado com a máscara da rede

    if (rede1 !== redeGateway) {
        erros.push("Máquina 1: O Gateway não pertence à mesma sub-rede.");
    }
    if (rede2 !== redeGateway) {
        erros.push("Máquina 2: Não está na mesma sub-rede que o Gateway.");
    }
    if (rede1 !== rede2) {
        erros.push("As máquinas não estão na mesma sub-rede e não poderão se comunicar diretamente.");
    }

    // 4. Validação de Endereços Reservados (Rede/Broadcast)
    if (ehEnderecoReservado(ip1, mascara1)) erros.push("Máquina 1: O IP é um endereço reservado (rede ou broadcast).");
    if (ehEnderecoReservado(ip2, mascara2)) erros.push("Máquina 2: O IP é um endereço reservado (rede ou broadcast).");
    if (ehEnderecoReservado(gateway, mascara1)) erros.push("Gateway: O IP é um endereço reservado (rede ou broadcast).");

    // --- EXIBIÇÃO DO RESULTADO ---

    if (erros.length > 0) {
        resultadoDiv.innerHTML = `<span class="error">${erros.join("<br>")}</span>`;
    } else {
        let sucessoMsg = `<span class="success">Configuração de rede válida!</span><br><br>`;
        sucessoMsg += `--- Simulação de Ping ---<br>`;
        sucessoMsg += `Pingando ${ip2} a partir de ${ip1}... Resposta recebida.<br>`;
        sucessoMsg += `Pingando ${ip1} a partir de ${ip2}... Resposta recebida.<br>`;
        resultadoDiv.innerHTML = sucessoMsg;
    }
}