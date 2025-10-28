// Copiar Discord
function copiarTexto() {
  const texto = "miyainc";
  navigator.clipboard
    .writeText(texto)
    .then(() => {
      alert("Texto copiado: " + texto);
    })
    .catch((err) => {
      console.error("Erro ao copiar o texto: ", err);
    });
}

// Copiar Email
function copiarEmail() {
  const texto2 = "vinicius.meloin@gmail.com";
  navigator.clipboard
    .writeText(texto2)
    .then(() => {
      alert("Texto copiado: " + texto2);
    })
    .catch((err) => {
      console.error("Erro ao copiar o texto: ", err);
    });
}

// Som ao clicar
const somClique = new Audio("../sons/switch-sound.mp3");

function tocarSom() {
  somClique.currentTime = 0;
  somClique.play();
}

// Trocar de página ao clicar
if (window.location.pathname.endsWith("index.html")) {
  document.addEventListener("keydown", function () {
    window.location.href = "html/switch-home.html";
  });
}

// Texto sublinhado na navbar
const currentPage = window.location.pathname.split("/").pop();
document.querySelectorAll("header#navbar a").forEach((link) => {
  if (link.getAttribute("href").includes(currentPage)) {
    link.classList.add("active");
  }
});
