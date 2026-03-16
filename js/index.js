import { CreateWebWorkerMLCEngine } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/+esm"
import { prebuiltAppConfig } from "https://esm.run/@mlc-ai/web-llm";

const $ = elemento => document.querySelector(elemento)

const formulario = $("form")
const input = $("input")
const template = $("#Mensaje-template")
const mensajes = $("ul")
const contenedor = $("main")
const boton = $("button")
const small = $("small")

let conversacion = []

const worker = new Worker("./js/worker.js")
worker.postMessage("")

// const modeloIA = "Llama-3-8B-Instruct-q4f32_1-MLC-1k" // Modelo potente
// const modeloIA = "DeepSeek-R1-Distill-Llama-8B-q4f32_1-MLC" // Modelo chino
const modeloIA = "Phi-3-mini-4k-instruct-q4f16_1-MLC" // Modelo pequeño

// console.log(prebuiltAppConfig.model_list.map(m => m.model_id));

const engine = await CreateWebWorkerMLCEngine(
    new Worker("./js/worker.js", {type: "module"}),
    modeloIA,
    {
        initProgressCallback: (info) => {
            // console.log(info);
            
            if(info.progress === 1) { small.textContent = `✅ Ready` }
            else { small.textContent = `🛠 Loading: ${info.text}` }
            boton.removeAttribute("disabled")
        }
    }
)

/* ADDEVENLISTENER submit
    Cuando se le da submit
    Obtiene el mensaje del usuario y lo muestra en el chat.
    Luego llama a la IA, y se le envia el texto del usuario.
    Luego se obtiene la respuesta de la IA, para mostrar.
*/
formulario.addEventListener("submit", async (event) => {
    event.preventDefault()
    const mensaje = input.value.trim()

    if(mensaje !== "") {
        input.value = " "
    }

    AgregarMensaje("Usuario", mensaje)
    boton.setAttribute("disabled", true)

    //Envio de mensaje a la IA
    const mensajeUsu = {
        role: "user",
        content: mensaje
    }

    conversacion.push(mensajeUsu)

    const chunks = await engine.chat.completions.create({
        messages: conversacion,
        stream: true
    })

    let reply = ""
    const mensajeBot = AgregarMensaje("Bot", "")

    for await (const chunk of chunks) {
        const choice = chunk.choices[0]
        const content = choice?.delta?.content ?? ""
        reply += content
        mensajeBot.textContent = reply
    }

    boton.removeAttribute("disabled")
    conversacion.push({
        role: "assistant",
        content: reply
    })
    contenedor.scrollTop = contenedor.scrollHeight
})

/* FUNCION
    Agregar un mensaje tipo texto
    Clona el template, y le asigna sus valores
*/
function AgregarMensaje(emisor, texto) {
    const clon = template.content.cloneNode(true)

    const nuevoMensaje = clon.querySelector(".Mensaje")
    const quien = nuevoMensaje.querySelector("span")
    const men = nuevoMensaje.querySelector("p")

    quien.textContent = (emisor == "Bot"? "🤖" : "🤓")
    men.textContent = texto
    console.log(emisor);
    
    nuevoMensaje.classList.add((emisor == "Bot"? "Bot" : "Usuario"))

    mensajes.appendChild(nuevoMensaje)
    contenedor.scrollTop = contenedor.scrollHeight // Hacer scroll automatico hacia abajo

    return men
}