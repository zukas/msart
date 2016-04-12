(function () {
    "use strict";
    function Login () {
        var user_input      = document.getElementById("username_input"),
            pass_input      = document.getElementById("password_input"),
            login_btn       = document.getElementById("login"),
            can_login       = function () {
                var valid   = user_input.value.length > 4 && 
                              pass_input.value.length > 6;

                if(valid) {
                    login_btn.style.display = "block";
                } else {
                    login_btn.style.display = "none";
                }

                return valid;
            },
            login           = function () {
                window.ajax({
                    type: "POST",
                    data: { username: user_input.value, password: pass_input.value },
                    url: "/async/user/login",
                }).done(function (data) {
                    if(data.status) {
                        window.location.href = "/";
                    } else {
                        pass_input.value = ""
                        can_login();
                        pass_input.focus();
                    }
                });
            };

        user_input.focus();

        user_input.onkeyup = function () {
            can_login();
        }

        pass_input.onkeyup = function (key) {
            if(can_login()) {
                if(key.keyCode == 13) {
                    login();
                }
            }
        }
    }

     window.addEventListener("load", function () {
        window.login = new Login();
    })
 
}());