(function () {
	"use strict";
    function Contact () {
    	var self 	= this,
    		name 	= document.getElementById("contact_name"),
    		email 	= document.getElementById("contact_email"),
    		message	= document.getElementById("contact_message"),
    		send 	= document.getElementById("contact_send");

    	function focus () {
    		this.removeAttribute("error");
    		this.onfocus = null;
    	}

    	send.onclick = function () {
    		window.ajax({
    			type: "POST",
    			data: { name : name.value, email: email.value, message: message.value },
    			url: '/async/contact',
    		}).done(function (result) {
    			 if(result.status) {
    				name.value = "";
    				email.value = "";
    				message.value = "";
    			} else {
    				for(var key in result.error) {
    					if(key == "name") {
    						name.setAttribute("error", true);
    						name.onfocus = focus;
    					} else if(key == "email") {
    						email.setAttribute("error", true);
    						email.onfocus = focus;
    					} else if(key == "message") {
    						message.setAttribute("error", true);
    						message.onfocus = focus;
    					}
    				}
    			}
    		});
    	}
    }

     window.addEventListener("load", function () {
        window.cantact = new Contact();
    })
 
}());