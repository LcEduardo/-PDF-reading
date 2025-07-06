const API_KEY = 'sec_w6ehnsByXDiaHmKvyiqtkBgN4xasye2C';

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

        const pergunta = "Qual é o resumo deste documento?";

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

        msg.textContent = 'Resposta do PDF: ' + chatData.content;

    }catch(error){
        console.error(error);
        alert('Erro: ' + error.message); 
    }

});