document
  .getElementById("loginForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("errorMessage");

    const correctEmail = "teste@exe";
    const correctPassword = "123";

    if (email === correctEmail && password === correctPassword) {
      errorMessage.style.display = "none";

      window.location.href = "/frontend/dashboard.html";
    } else {
      errorMessage.textContent = "E-mail ou senha incorretos.";
      errorMessage.style.display = "block";
    }
  });
