const bouton = document.getElementById("btn-salut");
const message = document.getElementById("message");

bouton.addEventListener("click", () => {
  const heure = new Date().toLocaleTimeString("fr-FR");
  message.textContent = `Bonjour ! Il est ${heure}.`;
});
