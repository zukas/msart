(function () {
	"use strict";

	var languages = {
		"en" : {
			about : "About",
			shop : "Shop",
			orders : "Orders",
			gallery : "Gallery",
			contact : "Contact",
			description : "Description",
			title : "Title",
			type : "Type",
			availability : "Availability",
			process : "Order Process",
			price : "Price",
			quantity : "Quantity",
			shipping : "Shipping",
			qandp : "Quantity & Price",
			payment_opt : "Payment methods",
			lead : "Lead times",
			individual : "Individual",
			common : "Common",
			available : "Available",
			demand : "On-Demand",
			keep : "Keep in Shop",
			move : "Move to Gallery",
			remove : "Remove",
			delete : "Delete",
			save : "Save",
			close : "Close",
			order : "Order",
			aboutus : "About Us",
			office : "Our Office",
			contactus : "Contact Us",
			name : "Name",
			surname: "Surname",
			email : "E-mail",
			address : "Address",
			country : "Country",
			postcode : "Post Code",
			message : "Message"
		},
		"pl" : {
			about : "Pracownia",
			shop : "Sklep",
			orders : "Zamówienie",
			order : "Zamów",
			gallery : "Galeria",
			contact : "Kontakt",
			description : "Opis",
			title : "Nazwa",
			type : "Rodzaj",
			availability : "Dostępność",
			process : "Akcja",
			price : "Cena",
			close : "Zamknij",
			save : "Zapisz",
			delete: "Kasuj",
			payment_opt : "Forma płatności",
			lead : "Czas realizacji",
			quantity : "Ilość",
			shipping : "Transport",
			total : "Koszt całkowity",
			checkout : "Dalej",
			about_us : "O nas",
			office : "Dane kontaktowe",
			about_us_value :  "",
			send : "Wyślij",
			personal_details : "Dane osobowe",
			forename: "Imię",
			surname: "Nazwisko",
			email: "Email",
			phone : "Numer telefonu",
			shipping_address: "Adres wysyłki",
			company: "Nazwa firmy",
			address: "Ulica",
			city: "Miasto",
			county: "Województwo",
			post_code: "Kod pocztowy",
			country: "Kraj",
			next : "Kontynuuj",
			back : "Wróć",
			payment_type : "Rodzaj płatności",
			card_details: "Szczegóły karty kredytowej",
			card_no: "Numer karty",
			cvv: "CVV",
			expiry: "Termin ważności",
			billing_address: "Adres fakturowania",
			vat: "NIP",
			full_name: "Imię i nazwisko",
			price_summary: "Podsumowanie",
			pay: "Zapłać",
			message: "Wiadomość",
			individual : "Pojedynczy",
			common : "Zbiorowy",
			advert : "Ogłoszenie",
			available : "Dostępny",
			demand : "Na zamówienie",
			keep : "Sklep",
			move : "Galeria",
			remove : "Usuń",
			today : "Dzisiaj",
			l_3_day : "3 dni",
			l_week : "Tydzień",
			l_month : "Miesiąc",
			l_time : "Cały czas",
			lead_avail : "- Realizacja zamówienia: 1 dzień roboczy\n- Czas dostawy: 2 - 3 dni robocze",
			lead_wait: "- Realizacja zamówienia: 2 - 3 tygodnie\n- Czas dostawy: 2 - 3 dni robocze",
			components: "Nazwa",
			none: "Bez nazwy",
			labeled: "Oznaczona",
			projects: "Projekt",
			category: "Kategoria",
            allitems: "Wszystkie",
            lowprice: "Cena malejąco",
            hightprice: "Cena rosnąco",
            iagree: "Akceptuję", 
            terms: "Regulamin sklepu",
            workshop: "Warsztaty",
            duration: "Czas trwania",
            timetable: "Terminy zajęć"
		}
	}

    function Language () {
    	var self 		= this,
    		current 	= "en",
    		controls 	= {},
    		inputs 		= {};

    	function applyValue (item, value) {
            if(item.controller) {
                item.controller.setValue(value);
            } else if(item.firstChild && 
                item.firstChild.nodeType == 3 &&
                item.firstChild.nodeValue) {
                item.firstChild.nodeValue = value;
            } else {
                var txt = document.createTextNode(value);
                if(item.firstChild) {
                    item.insertBefore(txt, item.firstChild);
                } else {
                    item.appendChild(txt);
                }
            }
    	}

    	function applyPlacehonder (item, value) {
    		item.placeholder = value;
    	}

    	self.bind = function (category, control) {
			applyValue(control, languages[current][category]);
    		var cc = controls[category];
			if(cc) {
    			cc[cc.length] = control;
			} else {
    			controls[category] = [ control ];
			}
    	}

    	self.bindInput = function (category, control) {
			applyPlacehonder(control, languages[current][category]);
    		var cc = inputs[category];
			if(cc) {
    			cc[cc.length] = control;
			} else {
    			inputs[category] = [ control ];
			}
    	}

    	self.unbind = function (control) {
    		for(var key in controls) {
    			if(controls.hasOwnProperty(key) && 
    				controls[key].length > 0 ) {
    				var idx = controls[key].indexOf(control);
    				if(idx != -1) {
    					controls[key].splice(idx, 1);
    				}
    			}
    		}
    	}

    	self.unbindInput = function (control) {
    		for(var key in inputs) {
    			if(inputs.hasOwnProperty(key) && 
    				inputs[key].length > 0 ) {
    				var idx = inputs[key].indexOf(control);
    				if(idx != -1) {
    					inputs[hey].splice(idx, 1);
    				}
    			}
    		}
    	}

    	self.change = function (language) {
    		if(languages[language] && current != language) {
    			current = language;
    			for(var key in controls) {
    				if(controls.hasOwnProperty(key) && controls[key].length > 0) {
    					var tmp = controls[key],
    						l 	= tmp.length;

    					for(var i = 0; i < l; ++i) {
    						applyValue(tmp[i], languages[current][key]);
    					}
    				}
    			}

    			for(var key in inputs) {
    				if(inputs.hasOwnProperty(key) && inputs[key].length > 0) {
    					var tmp = inputs[key],
    						l 	= tmp.length;

    					for(var i = 0; i < l; ++i) {
    						applyPlacehonder(tmp[i], languages[current][key]);
    					}
    				}
    			}
    		}
    	}

    	{
    		var elements    = document.getElementsByTagName("*");
	        for(var i = 0; i < elements.length; ++i) {
	            if(elements[i].hasAttribute("lang")) {
	            	var term = elements[i].getAttribute("lang");
	                self.bind(term, elements[i]);
	            } else if (elements[i].hasAttribute("placeholder-lang")) {
	            	var term = elements[i].getAttribute("placeholder-lang");
	                self.bindInput(term, elements[i]);
	            }
	        }
    	}

    	self.change("pl");


    }

     window.addEventListener("load", function () {
        window.language = new Language();
    })
 
}());
