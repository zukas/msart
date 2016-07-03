(function () {
	"use strict";


    function compileInputData(parent) {
        var elements    = parent.getElementsByTagName("*"),
            data        = {};

        for(var i = 0; i < elements.length; ++i) {
            if(elements[i].hasAttribute("user-input")) {
                var type = elements[i].getAttribute("user-input");
                if(elements[i].controller) {
                    data[type] = elements[i].controller.value();
                } else if(elements[i].value) {
                    data[type] = elements[i].value;
                } else if(elements[i].firstChild && 
                    elements[i].firstChild.nodeType == 3 && 
                    elements[i].firstChild.nodeValue) {
                    data[type] = elements[i].firstChild.nodeValue;
                }
            }
        }
        return data;
    }

    function applyInputValue (item, value) {
        value = value || "";
        if(item.nodeName == "INPUT") {
            item.value = value;
        } else if(item.nodeName == "DIV") {
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
    }

    function clearValues(parent) {
        var elements    = parent.getElementsByTagName("*");
        for(var i = 0; i < elements.length; ++i) {
            if(elements[i].hasAttribute("user-input")) {
                elements[i].parentNode.removeAttribute("unset");
                applyInputValue(elements[i], "");
            }
        }
    }

    function applyInputData(parent, data) {
        var elements    = parent.getElementsByTagName("*"),
            unset       = [],
            set         = [];
        for(var i = 0; i < elements.length; ++i) {
            if(elements[i].hasAttribute("user-input")) {
                elements[i].parentNode.removeAttribute("unset");
                var type = elements[i].getAttribute("user-input");
                if(data[type]) {
                    var idx = unset.indexOf(elements[i].parentNode);
                    if(idx >= 0) {
                        unset.splice(idx, 1);
                    }
                    set[set.length] = elements[i].parentNode;
                    applyInputValue(elements[i], data[type]);
                } else {
                    var idx = set.indexOf(elements[i].parentNode);
                    if(idx == -1) {
                        unset[unset.length] = elements[i].parentNode;
                    }
                    applyInputValue(elements[i], "");
                }
            }
        }

        for(var i = 0; i < unset.length; ++i) {
            unset[i].setAttribute("unset", true);
        }
    }

    function markInputError (parent, data) {
        if(data) {
            var elements    = parent.getElementsByTagName("*");

            for(var i = 0; i < elements.length; ++i) {
                if(elements[i].hasAttribute("user-input")) {
                    var type = elements[i].getAttribute("user-input");
                    if(data[type]) {
                        (function(elem) {
                            elem.setAttribute("error",true);
                            elem.onfocus = function () {
                                elem.removeAttribute("error");
                            }
                        })(elements[i]);
                    }
                }
            } 
        }
    }

    function PaymentTypePrevew(ctl) {
        var self    = this,
            control = ctl;

        ctl.controller = self;

        self.setValue = function (data) {
            control.setAttribute("option", data);
        }
    }

    function CardNumberPrevew(ctl) {
        var self    = this,
            control = ctl;


        ctl.controller = self;

        self.setValue = function (data) {
            var elems = control.getElementsByClassName("preview-data");
            if(elems && elems.length > 0) {
                applyInputValue(elems[0], data.number);
            }
            if(data) {
                control.removeAttribute("unset");
            } else {
                control.setAttribute("unset", true);
            }
        }
    }


    function CreditCardControl (ctl) {

        function CardDetector(){
            var self    = this,
                types   = {
                    "visa" : { 
                        values : [
                            { 
                                type: 0, 
                                value : 4 
                            }
                        ]
                    },
                    "mastercard" : { 
                        values : [
                            {
                                type: 1, 
                                range : { 
                                    min: 51, 
                                    max: 55 
                                } 
                            }
                        ]
                    }, 
                    "discover" : { 
                        values : [
                            { 
                                type: 0, 
                                value : 65 
                            },
                            { 
                                type: 0, 
                                value : 6011 
                            },
                            {
                                type: 1, 
                                range : { 
                                    min: 644, 
                                    max: 649 
                                } 
                            },
                            {
                                type: 1, 
                                range : { 
                                    min: 622126, 
                                    max: 622925 
                                } 
                            }
                        ]
                    },
                    "amex" : { 
                        values : [
                            { 
                                type: 0, 
                                value : 34 
                            },
                            { 
                                type: 0, 
                                value : 37
                            }
                        ]
                    }
                }

            self.run = function (text) {
                for(var key in types){
                    if(types.hasOwnProperty(key)) {
                        var tmp = types[key];
                        for(var i = 0; i < tmp.values.length; ++i) {
                            if(tmp.values[i].type == 0) {
                                var value = String(tmp.values[i].value);
                                if(text.substr(0, value.length) === value) {
                                    return key;
                                }
                            } else if(tmp.values[i].type == 1) {
                                for(var j = tmp.values[i].range.min; j <= tmp.values[i].range.max; ++j) {
                                    var value = String(j);
                                    if(text.substr(0, value.length) === value) {
                                        return key;
                                    }
                                }
                            }
                        }
                    }
                }
                return null;
            }
        }

        var self        = this,
            control     = ctl,
            detector    = new CardDetector();

        function validate_and_detect () {

            var value = detector.run(control.value);

            if(value) {
                control.setAttribute("card", value);
            } else {
                control.removeAttribute("card");
            }

        }

        control.onkeydown = function (e) {
            
            var set     = [8, 9, 37, 38, 39, 40, 46],
                meta    = set.indexOf(e.keyCode) >= 0,
                num     = !isNaN(parseInt(e.key)) && control.value.length < 16;

            if(meta) {
                return;
            } else if(num) {
                return;
            } else {
                e.preventDefault();
            }
        }

        control.onkeyup = validate_and_detect;

        control.onfocus = validate_and_detect;

        control.onblue = validate_and_detect;

        control.onchange = validate_and_detect;

        control.controller = self;

        self.value = function () {
            return { type: detector.run(control.value), number: control.value };
        }
    }


    function RunControlManager (root) {


        function county_fn (control) {

            var values  = [
                    "dolnośląskie",
                    "kujawsko-pomorskie",
                    "lubelskie",
                    "lubuskie",
                    "łódzkie",
                    "małopolskie",
                    "mazowieckie",
                    "opolskie",
                    "podkarpackie",
                    "podlaskie",
                    "pomorskie",
                    "śląskie",
                    "świętokrzyskie",
                    "warmińsko-mazurskie",
                    "wielkopolskie",
                    "zachodniopomorskie"
                ],
                ctl     = new DropDown({}, control);
            
            for(var i = 0; i < values.length; ++i) {
                ctl.addItem(values[i], true);
            }

        }

        function country_fn (control) {
            var ctl = new DropDown({}, control);

            ctl.addItem("Polska", true);
        }

        function expiry_year_fn (control) {

            var year    = new Date().getFullYear(),
                ctl     = new DropDown({ }, control);

            for(var i = year; i <= year + 10; ++i) {
                ctl.addItem(i, true);
            }

            
        }

        function expiry_month_fn (control) {

            var ctl = new DropDown({}, control);

            for(var i = 1; i <= 12; ++i) {
                ctl.addItem(i, true);
            }

            
        }

        function card_fn (control) {
            new CreditCardControl(control);
        }

        function paymentType_fn (control) {
            new PaymentTypePrevew(control);
        }

        function cardNumber_fn (control) {
            new CardNumberPrevew(control);
        }

        var mapper      = {
                country: country_fn,
                county: county_fn,
                expiry_month: expiry_month_fn,
                expiry_year: expiry_year_fn,
                card_number: card_fn,
                paymentType: paymentType_fn,
                cardNumber: cardNumber_fn
            },
            elements    = root.getElementsByTagName("*");

        for(var i = 0; i < elements.length; ++i) {
            if(elements[i].hasAttribute("control")) {
                var type = elements[i].getAttribute("control");
                if(mapper[type]) {
                    async(mapper[type], [elements[i]]);
                }
            }
        }
    }

    function OrderItem(data) {

        var self        = this,
            row         = document.createElement("tr"),
            pic         = document.createElement("td"),
            picture     = new MSDivObject(),
            title       = document.createElement("td"),
            quantity    = document.createElement("td"),
            price       = document.createElement("td"),
            shipping    = document.createElement("td"),
            remove      = document.createElement("td"),
            rem_btn     = document.createElement("div");

        pic.className = "text";
        picture.el.className = "order-thumb";
        title.className = "text";
        quantity.className = "text";
        price.className = "text";
        shipping.className = "text";
        remove.className = "text";
        rem_btn.className = "remove-btn";

        price.setAttribute("currency", "zł");
        shipping.setAttribute("currency", "zł");

        pic.appendChild(picture.el);
        row.appendChild(pic);
        row.appendChild(title);
        row.appendChild(quantity);
        row.appendChild(price);
        row.appendChild(shipping);
        remove.appendChild(rem_btn);
        row.appendChild(remove);

        picture.loadImage({
            url : "/async/thumb/load/" + data.preview,
            color: "#e0e0e0", 
            shadow: true, 
            radius: 18, 
            width: 4, 
            length: 16, 
            lines: 11, 
            speed: 0.75 
        });

        title.innerHTML = data.title;
        quantity.innerHTML = data.quantity;
        price.innerHTML = data.price;
        if(data.discount) {
            var pin = document.createElement("span"),
                pr  = document.createTextNode(Number(data.shipping) * (1 - (data.discount || 0)));

            pin.className = "discount-pin";

            shipping.appendChild(pin);
            shipping.appendChild(pr);
        } else {
            shipping.innerHTML = Number(data.shipping);
        }

        self.el = row;

        self.id = function () {
            return data.id;
        }

        self.item = function () {
            return data.item;
        }

        self.price = function () {
            return Number(data.price);
        }

        self.shipping = function () {
            return Number(data.shipping);
        }

        self.setDiscount = function (value) {
            data.discount = value;
        }

        rem_btn.onclick = function () {
            self.remove(self);
        }

        self.info = function () {
            return { title: data.title, quantity: Number(data.quantity), price: Number(data.price), shipping: Number(data.shipping) * (1 - (data.discount || 0)) };
        }

        self.update = function (new_data) {
            for(var key in new_data || {}) {
                if(new_data.hasOwnProperty(key)) {
                    data[key] = new_data[key];
                }
            }
            quantity.innerHTML = data.quantity;
            price.innerHTML = data.price;
            if(data.discount) {
                var pin = document.createElement("span"),
                    pr  = document.createTextNode(Number(data.shipping) * (1 - (data.discount || 0)));

                pin.className = "discount-pin";
                shipping.innerHTML = "";
                shipping.appendChild(pin);
                shipping.appendChild(pr);
            } else {
                shipping.innerHTML = Number(data.shipping);
            }
        }
    }

    function OrderListControl () {
        var self        = this,
            view        = document.getElementById("order_list_view"),
            table       = document.getElementById("order_list_table"),
            totals      = document.getElementById("order_list_totals"),
            advance     = document.getElementById("order_list_advance"),
            total_price = 0,
            orders      = {};

        totals.setAttribute("currency", "zł");

        function shop_item_ordered(id) {
            var shop_item = document.getElementById(id);
            if(!shop_item) {
                async(shop_item_ordered, [id]);
            } else {
                shop_item.setAttribute("ordered", true);
            }
        }

        function shop_item_order_removed (id) {
            var shop_item = document.getElementById(id);
            if(!shop_item) {
                async(shop_item_order_removed, [id]);
            } else {
                shop_item.removeAttribute("ordered");
            }
        }

        window.events.listen("update-ordered", function () {
            for(var order in orders) {
                if(orders.hasOwnProperty(order)) {
                    var shop_item = document.getElementById(orders[order].item());
                    if(shop_item) {
                        shop_item.setAttribute("ordered", true);
                    }
                }
            }
        });

        function removeOrder (item) {

            window.ajax({
                type: "POST",
                data: { id : item.id() },
                url: '/async/orders/remove'
            }).done(function (result) {
                if(result.status && result.removed) {

                    total_price = result.total;
                    totals.innerHTML = total_price;

                    var order = orders[result.removed];
                    delete orders[result.removed];

                    shop_item_order_removed(order.item());
                    table.removeChild(order.el);

                    var fragment = document.createDocumentFragment();
                    for(var i = 0; i < result.items.length; ++i) {
                        var tmp = result.items[i];
                        if(orders[tmp.id]) {
                            orders[tmp.id].update(tmp);
                            table.removeChild(orders[tmp.id].el);
                        }
                        fragment.appendChild(orders[tmp.id].el);
                    }
                    table.appendChild(fragment);

                    if(result.items.length == 0) {
                        self.hide();
                    } else {
                        self.activate(self);
                    }
                }
            }); 
        }

        self.addOrder = function (data) {
            window.ajax({
                type: "POST",
                data: data,
                url: '/async/orders/add'
            }).done(function (result) {
                if(result.status) {
                    total_price = result.total;
                    totals.innerHTML = total_price;
                    var fragment = document.createDocumentFragment();
                    for(var i = 0; i < result.items.length; ++i) {
                        var item = result.items[i];
                        if(orders[item.id]) {
                            orders[item.id].update(item);
                            table.removeChild(orders[item.id].el);
                        } else if(item.id == result.added) {
                            item.title = data.title;
                            item.availability = data.availability;
                            item.preview = data.preview;
                            var order = new OrderItem(item);
                            orders[item.id] = order;
                            order.remove = removeOrder;
                            shop_item_ordered(order.item());
                        }
                        if(orders[item.id]) {
                            fragment.appendChild(orders[item.id].el);
                        }
                    }
                    table.appendChild(fragment); 

                    if(result.items.length == 1) {
                        self.show(true);
                    }
                    self.reset();
                    self.activate(self);
                }
            });
        }

        self.clear = function () {
            for(var key in orders) {
                if(orders.hasOwnProperty(key)) {
                    var order   = orders[key];
                    delete orders[key];

                    shop_item_order_removed(order.item());
                    table.removeChild(order.el);
                }
            }
        }

        self.init = function () {
            window.ajax({
                type: "POST",
                data: null,
                url: '/async/orders/session'    
            }).done(function(result) {
                if(result.status && result.items) {
                    console.log(result.items);
                    total_price = result.total;
                    totals.innerHTML = total_price;
                    var fragment = document.createDocumentFragment();
                    for(var i = 0; i < result.items.length; ++i) {
                        var order = new OrderItem(result.items[i]);
                        orders[order.id()] = order;
                        order.remove = removeOrder;
                        shop_item_ordered(order.item());
                        fragment.appendChild(orders[order.id()].el);
                    }
                    table.appendChild(fragment); 
                    if(result.items.length > 0) {
                        self.show();
                        self.activate(self);
                    }
                }
            });
        }


        advance.onclick = function () {
            var items = [];
            for(var key in orders) {
                if(orders.hasOwnProperty(key)) {
                    items[items.length] = orders[key].info();
                }
            }
            self.advance(self, { items: items, total : total_price });
        }

        self.el = view;

    }

    function ShippingControl () {
        var self        = this,
            view        = document.getElementById("shipping_view"),
            advance     = document.getElementById("shipping_advance"),
            back        = document.getElementById("shipping_back"),
            base        = null;

        advance.onclick = function () {

            var data = compileInputData(view);
            window.ajax({
                type: "POST",
                data: data,
                url: '/async/orders/shipping'
            }).done(function (result) {
                if(result.status) {
                    base.shipping = result.data;
                    self.advance(self, base);
                } else {
                    markInputError(view, result.error);
                }
            });
        }

        self.clear = function () {
            base = null;
        }

        self.apply = function (data) {
            base = data;
        }

        back.onclick = function () {
            self.back(self);
        }

        self.el = view;
    }


    function PaymentControl () {
        var self        = this,
            view        = document.getElementById("payment_view"),
            advance     = document.getElementById("payment_advance"),
            back        = document.getElementById("payment_back"),
            type        = document.getElementById("payment_type"),
            options     = [],
            payment     = document.getElementById("payment_details"),
            billing     = document.getElementById("billing_details"),
            base        = null,
            current     = 0;

        // <div class="payment-option paypal" option=0 checked>
        //     <div class="checkbox"></div>
        //     <div class="banner paypal"></div>
        // </div>
        window.ajax({
            type : "POST",
            data : null,
            url : "/async/payment/types"
        }).done(function (result) {
            if(result.status) {
                var i = 0;
                for(var key in result.options) {
                    if(result.options.hasOwnProperty(key)) {
                        var opt     = document.createElement("div"),
                            check   = document.createElement("div"),
                            banner  = document.createElement("div");

                        opt.className = "payment-option " + key;
                        check.className = "checkbox";
                        banner.className = "banner " + key;

                        opt.appendChild(check);
                        opt.appendChild(banner);

                        if(i == 0) {
                            opt.setAttribute("checked", true);
                        }

                        opt.setAttribute("option", i++);

                        var attrs = result.options[key];
                        for(var attr in attrs) {
                            if(attrs.hasOwnProperty(attr)) {
                                opt.setAttribute(attr, attrs[attr]);
                            }
                        }

                        type.appendChild(opt);

                        options[options.length] = opt;
                        opt.onclick = select_option;
                    }
                }
            }
        });

        function select_option (e) {
            e.stopPropagation();
            for(var i = 0; i <options.length; ++i) {
                options[i].removeAttribute("checked");
            }
            this.setAttribute("checked",true);
            current = this.getAttribute("option");
            self.expand(payment, this.hasAttribute("expand"));  
        }

        self.apply = function (data) {
            base = data;
            applyInputData(payment, { forename: base.shipping.forename, surname: base.shipping.surname });
            applyInputData(billing, base.shipping);
        }

        self.clear = function () {
            base = null;
        }

        advance.onclick = function () {
            var data = compileInputData(billing); 
            if(current == 0) {
                window.ajax({
                    type: "POST",
                    data: data,
                    url: '/async/orders/pay_paypal'
                }).done(function (result) {
                    if(result.status) {
                        data = result.data;
                        data.paymentType = "Paypal";
                        base.billing = data
                        self.advance(self, base);
                    } else {
                        markInputError(billing, result.error);
                    }
                });
            } else if(current == 1) {
                var pay = compileInputData(payment);
                for(var key in pay) {
                    if(pay.hasOwnProperty(key)){
                        data[key] = pay[key];
                    }
                }
                window.ajax({
                    type: "POST",
                    data: data,
                    url: '/async/orders/pay_card'
                }).done(function (result) {
                    if(result.status) {
                        data = result.data;
                        data.paymentType = data.card.type;
                        base.billing = data;
                        self.advance(self, base);
                    } else {
                        markInputError(view, result.error);
                    }
                });
            }   
        }

        back.onclick = function () {
            self.back(self);
        }

        self.el = view;
    }


    function CompleteControl () {
        var self        = this,
            view        = document.getElementById("done_view"),
            advance     = document.getElementById("done_advance"),
            back        = document.getElementById("done_back"),
            preview     = document.getElementById("data_preview"),
            summary     = document.getElementById("order_summary"),
            blocks      = preview.getElementsByClassName("preview-block");

        function Generate(items) {
            var table   = document.createElement("table"),
                hr      = document.createElement("tr"),
                ht      = document.createElement("th"),
                hq      = document.createElement("th"),
                hp      = document.createElement("th"),
                hs      = document.createElement("th");

            language.bind("title", ht);
            language.bind("quantity", hq);
            language.bind("price", hp);
            language.bind("shipping", hs);


            ht.className = "preview-label text";
            hq.className = "preview-label text";
            hp.className = "preview-label text";
            hs.className = "preview-label text";


            hr.appendChild(ht);
            hr.appendChild(hq);
            hr.appendChild(hp);
            hr.appendChild(hs);
            table.appendChild(hr);

            for(var i = 0; i < items.length; ++i) {
                var r   = document.createElement("tr"),
                    t   = document.createElement("td"),
                    q   = document.createElement("td"),
                    p   = document.createElement("td"),
                    s   = document.createElement("td");

                t.innerHTML = items[i].title;
                q.innerHTML = items[i].quantity;
                p.innerHTML = items[i].price;
                s.innerHTML = items[i].shipping;

                p.setAttribute("currency", "zł");
                s.setAttribute("currency", "zł");

                t.className = "text preview-data";
                q.className = "text preview-data";
                p.className = "text preview-data";
                s.className = "text preview-data";

                r.appendChild(t);
                r.appendChild(q);
                r.appendChild(p);
                r.appendChild(s);

                table.appendChild(r);
            }

            return table;
        }

        advance.onclick = function () {
            window.location = "/async/orders/process";
        }

        // advance.onclick = function () {
        //     window.ajax({
        //         type: "POST",
        //         data: null,
        //         url: '/async/orders/process'
        //     }).done(function (result) {
        //         console.log(result);
        //         if(result.status) {
        //             window.location.href = result.link;
        //         } else {

        //         }
        //     });
        // }

        back.onclick = function () {
            self.back(self);
        }

        self.apply = function (data) {
            for(var i = 0; i < blocks.length; ++i) {
                if(blocks[i].hasAttribute("block-type")) {
                    var attr = blocks[i].getAttribute("block-type");
                    if(data[attr]) {
                        applyInputData(blocks[i], data[attr]);
                    } 
                }
            }
            summary.innerHTML = null;
            summary.appendChild(Generate(data.items));
            var htot    = document.createElement("div"),
                tot     = document.createElement("div");

            htot.className = "seperator text";
            language.bind("total", htot);
            tot.className = "total-price-summary text-invert-light";
            tot.innerHTML = data.total;
            tot.setAttribute("currency", "zł");
            summary.appendChild(htot);
            summary.appendChild(tot);
        }

        self.clear = function () {
            summary.innerHTML = null;
        }

        self.el = view;
    }


    function ProgressControl (parent, ctls) {
        var self        = this,
            controls    = ctls,
            view        = document.getElementById("progress_view"),
            indicators  = view.getElementsByClassName("progress-step"),            
            active      = null;

        function activate_view (view, data) {
            if(active != view) {
                view.el.style.top = (getHeight(parent) + 200) + "px";
                view.el.style.display = "block";
                if(view.apply && data) {
                    view.apply(data);
                }
                async(function () {

                    var elems = [view.el, parent];
                    view.el.set = { top : 150 };
                    parent.set = { h : 200 + getHeight(view.el) };
                    if(active) {
                        active.el.set = { o : 0 };
                        elems[elems.length] = active.el;
                        window.scrollBodyTo(parent); 
                    } 

                    morpheus(elems, {
                        top: function (el) {
                            return el.set.top;
                        },
                        height: function (el) {
                            return el.set.h;
                        },
                        opacity: function (el) {
                            return el.set.o;
                        },
                        duration: 250,
                        complete: function () {
                            if(active) {
                                active.el.removeAttribute("style");
                            }
                            active = view;
                        }
                    });
                    
                });
            } else {
                morpheus(parent, {
                    height:  (200 + getHeight(view.el)) + "px",
                    duration: 250
                });
            }
        }

        function reset () {
            for(var i = 0; i < controls.length; ++i) {
                indicators[i].removeAttribute("status");
            } 
            if(controls.length > 0) {
                indicators[0].setAttribute("status", 0);
            }
        }

        function advance_view (view, data) {
            if(view == active) {
                var idx = controls.indexOf(view);
                if(idx + 1 == controls.length) {
                    self.done();
                } else if(idx >= 0 && idx + 1 < controls.length) {
                    indicators[idx].setAttribute("status", 1);
                    idx += 1;
                    activate_view(controls[idx], data);
                    indicators[idx].setAttribute("status", 0);
                }
            }
        }

        function back_view (view) {
            if(view == active) {
                var idx = controls.indexOf(view);
                if(idx - 1 < 0 ) {
                    self.done();
                } else if(idx >= 0 && idx - 1 >= 0) {
                    indicators[idx].removeAttribute("status");
                    idx -= 1;
                    activate_view(controls[idx]);
                    indicators[idx].setAttribute("status", 0);
                }
            }
        }

        function expand_view (control, show) {
            
            var full    = 0,
                height  = 0,
                ph      = getHeight(parent);

            if(show) {
                control.style.display = "block";
                full = getHeight(control);
                height = control.offsetHeight;
                control.style.height = "0px";
            } else {
                full = getHeight(control);
                height = control.offsetHeight;
            }
            full -= (full - height) / 2;
            control.style.opacity = show ? 0 : 1;
            control.set = { h : show ? height : 0, m: show ? null : 0, o: show ? 1 : 0 };
            parent.set = { h : show ? full + ph : ph - full };

            morpheus([parent, control], 
            {
                height: function (el) {
                    return el.set.h;
                },
                "margin-bottom" : function (el) {
                    return el.set.m;
                },
                "margin-top" : function (el) {
                    return el.set.m;
                },
                opacity: function (el) {
                    return el.set.o;
                },
                duration: 250,
                complete: function () {
                    if(show) {
                        control.style.height = "";
                        control.style.opacity = "";
                    } else {
                        control.removeAttribute("style");
                    }
                }
            });

        }

        for(var i = 0; i < controls.length; ++i) {
            controls[i].reset = reset;
            controls[i].activate = activate_view;
            controls[i].advance = advance_view;
            controls[i].back = back_view;
            controls[i].expand = expand_view;
        }

        self.init = function () {
            for(var i = 0; i < controls.length; ++i) {
                if(controls[i].init) {
                    controls[i].init();
                }
            }
        }

        self.clear = function () {
            reset();
            clearValues(parent);
            for(var i = 0; i < controls.length; ++i) {
                controls[i].clear();
            }

        }

    } 

    function OrderView() {
        var self        = this,
            menu_btn    = document.getElementById("order"),
            order_pan   = document.getElementById("order_panel"),
            order_inner = document.getElementById("order_panel_inner"),
            order_list  = new OrderListControl(),
            shipping    = new ShippingControl(),
            payment     = new PaymentControl(),
            complete    = new CompleteControl(),
            progress    = new ProgressControl(order_pan, [order_list, shipping, payment, complete]);


        RunControlManager(order_pan);
        order_pan.removeChild(order_inner);
            
        function show_panel (seek) {
            order_panel.appendChild(order_inner);
            menu_btn.style.display = "inline-block";
            order_pan.style.display = "block";
            if(seek) {
                window.scrollBodyTo(order_pan);
            }
        }

        function hide_panel () {
            menu_btn.set = { w : 0 };
            order_pan.set = { h : 0 };

            morpheus([menu_btn, order_pan], {
                width: function (el) {
                    return el.set.w;
                },
                height: function (el) {
                    return el.set.h;
                },
                duration: 350,
                complete : function () {
                    menu_btn.style = "";
                    order_pan.style = "";
                    order_pan.removeChild(order_inner);
                }
            });
            window.scrollBodyTo(window.shop.el);
        }

        order_list.show = show_panel;
        order_list.hide = hide_panel;

        window.events.listen("order", function (data) {
            order_list.addOrder(data);
        });


        progress.done = function () {
            progress.clear();
            hide_panel();
        };

        progress.init();

        self.el = order_pan;
    }

    window.addEventListener("load", function () {
        window.orders = new OrderView();
    })
 
}());
