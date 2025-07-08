const API_KEY = 'sec_XCivwuL9mqxeNaqO86lwGjyEHHUZOEYr';

document.getElementById('enviar').addEventListener('click', async function() {
    const input = document.getElementById('upload');
    const file = input.files[0];
    const msg = document.getElementById('msg');

    if (!file || file.type !== 'application/pdf') {
        alert('Por favor, selecione um arquivo PDF válido.');
        return;
    }

    try {

        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('https://api.chatpdf.com/v1/sources/add-file', {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY
            },
            body: formData
        });

        if (!uploadResponse.ok) {
            throw new Error('Erro ao enviar o PDF para upload.');
        }

        const uploadData = await uploadResponse.json();
        console.log('Upload Response:', uploadData);
        const sourceId = uploadData.sourceId;

        if (!sourceId) {
            throw new Error('sourceId não retornado no upload.');
        }

        const pergunta = `
Extraia APENAS os valores monetários dos campos abaixo, diretamente da seção "Cálculo do Imposto" da Nota Fiscal. NÃO inclua alíquotas, porcentagens ou explicações.

❗ ATENÇÃO: Não traga alíquota (%), apenas valores em reais (ex: 12,34).

Campos obrigatórios:

- Chave de acesso (44 dígitos)
- Número da Nota Fiscal
- Valor do ICMS
- Valor do ICMS ST
- Valor do IPI
- Valor do Frete
- Valor do Desconto

Formato exato da resposta (não mude):

Chave de Acesso: 1234 5678 9012 3456 7890 1234 5678 9012 3456 7890 1234  
Número da Nota Fiscal: 123456  
Valor do ICMS: 32,76  
Valor do ICMS ST: 0,00  
Valor do IPI: 12,34  
Valor do Frete: 5,40  
Valor do Desconto: 0,00
`;

        const chatResponse = await fetch('https://api.chatpdf.com/v1/chats/message', {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sourceId: sourceId,
                messages: [
                    {
                        role: "user",
                        content: pergunta
                    }
                ],
                referenceSources: true
            })
        });

        if (!chatResponse.ok) {
            throw new Error('Erro ao enviar a pergunta para o chat.');
        }

        const chatData = await chatResponse.json();
        console.log('Chat Response:', chatData);

        const respostaTexto = chatData.content;
        msg.textContent = 'Resposta do PDF: ' + respostaTexto;

        const linhas = respostaTexto.split('\n');

        linhas.forEach(linha => {
            const [campoBruto, valorBruto] = linha.split(':');
            if (!campoBruto || !valorBruto) return;

            const campo = campoBruto.trim().toLowerCase();
            const valor = valorBruto.trim();

            if (campo.includes('chave de acesso')) {
                document.getElementById('chave_acesso').value = valor;
            }

            else if (campo.includes('número da nota fiscal')) {
                document.getElementById('informacoes_complementares').value = `Refere-se à NF:${valor}`;
            }

            else if (campo.includes('icms') && !campo.includes('st')) {
                const num = parseFloat(valor.replace('.', '').replace(',', '.'));
                if (num > 0) document.getElementById('icmsCheckBox').checked = true;
            }

            else if (campo.includes('icms st')) {
                const num = parseFloat(valor.replace('.', '').replace(',', '.'));
                if (num > 0) document.getElementById('icmsStCheckBox').checked = true;
            }

            else if (campo.includes('ipi')) {
                const num = parseFloat(valor.replace('.', '').replace(',', '.'));
                if (num > 0) document.getElementById('ipiCheckBox').checked = true;
                
            }

            else if (campo.includes('frete')) {
                const num = parseFloat(valor.replace('.', '').replace(',', '.'));
                if (num > 0) document.getElementById('freteCheckBox').checked = true;
            }

            else if (campo.includes('desconto')) {
                const num = parseFloat(valor.replace('.', '').replace(',', '.'));
                if (num > 0) document.getElementById('descontoCheckBox').checked = true;
            }
            });

    }catch(error){
        console.error(error);
        alert('Erro: ' + error.message); 
    }

});

function gerarTexto() {
    const empresa_id = document.getElementById("empresa_id").value;
    const obs = document.getElementById("obs").value;
    const cfop = document.getElementById("cfop").value;
    const pedido = document.getElementById("pedido").value;
    const informacoes_complementares = document.getElementById("informacoes_complementares").value;
    const chave_acesso = document.getElementById("chave_acesso").value.replace(/\s/g, '');

    const checkboxes = [
    { id: "icmsCheckBox", label: "ICMS" },
    { id: "ipiCheckBox", label: "IPI" },
    { id: "icmsStCheckBox", label: "ICMS ST" },
    { id: "freteCheckBox", label: "Frete" },
    { id: "descontoCheckBox", label: "Desconto" }
    ];

    const destacados = checkboxes
    .filter(cb => document.getElementById(cb.id).checked)
    .map(cb => cb.label);

    const outroDestaque = document.getElementById("outroDestaque").value.trim();
    if (outroDestaque) destacados.push(outroDestaque);

    let destaqueFormatted = "nenhum";
    if (destacados.length === 1) destaqueFormatted = destacados[0];
    else if (destacados.length > 1) {
    const ultimo = destacados.pop();
    destaqueFormatted = destacados.join(", ") + " e " + ultimo;
    }

    const texto = `- Empresa_id *${empresa_id}*\n- Preciso devolver o seguinte pedido com destaque de ${destaqueFormatted}\n- OBS: ${obs}\n- CFOP *${cfop}*\n- Pedido *${pedido}*\n- Chave de Acesso *${chave_acesso}*\n- Informacoes complementares: *Refere-se a NF:${informacoes_complementares}*`;

    document.getElementById("resultado").innerText = texto;
}