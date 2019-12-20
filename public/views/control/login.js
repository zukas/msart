function performLogin() {
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  debug("performLogin");
  fetch(`/login`, {
    method: "POST",
    body: JSON.stringify({
      username: username.value,
      password: password.value
    }),
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(r => {
      debug(r);
      if (r.success) {
        location.assign(`/`);
      } else {
        password.value = "";
        password.setAttribute("error", 1);
      }
    });
}

function passwordBeginEdit(e) {
  e.target.removeAttribute("error");
}

function quickKey(e) {
  const key = e.which || e.keyCode;
  debug(e);
  debug(key);
  if (key == 13) {
    e.preventDefault();
    performLogin();
  }
}
