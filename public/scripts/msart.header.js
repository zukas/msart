(function () {
    "use strict";

    function MobileMenu () {
        var self    = this,
            menu    = document.getElementById("main_menu"),
            list    = document.getElementById("menu_list"),
            items   = menu.getElementsByClassName("menu_item"),
            visible = false,
            mapper  = {};

        function hide () {
            visible = false;
            list.removeAttribute("style");
        }

        function show() {
            list.style.display = "block";
            visible = true;
        }

        menu.onclick = function () {
            if(visible) {
                hide();
            } else {
                show()
            }
        }

        for(var i = 0; i < items.length; ++i) {
            var item_id = items[i].getAttribute("scrollto");
            mapper[item_id] = document.getElementById(item_id);
            items[i].onclick = function (e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                } else {
                    //IE8 and Lower
                    e.cancelBubble = true;
                }
                hide();
                window.scrollBodyTo(mapper[e.target.getAttribute("scrollto")]);
            }
        }
    }


    function Header () {

        if(window.mobile) {
            new MobileMenu();
        } else {
            var header  = document.getElementById("header"),
                content = document.getElementById("content-wrapper"),
                title   = document.getElementById("title"),
                menu    = document.getElementById("main_menu"),
                elems   = menu.getElementsByClassName("menu_item"),
                items   = [header, content, title, menu],
                mapper  = {},
                min     = false;

            for(var i in elems) {
                if(elems.hasOwnProperty(i)) {
                    var item_id = elems[i].getAttribute("scrollto");
                    mapper[item_id] = document.getElementById(item_id);
                    elems[i].onclick = function (e) {
                        window.scrollBodyTo(mapper[e.target.getAttribute("scrollto")]);
                    }   
                }
            }

            header.unset = {
                height: 160
            }
            content.unset = {
                top: 160
            }
            title.unset = {
                height: 120,
                width: 720,
                left: "50%",
                marginLeft : -360
            }
            menu.unset = {
                top: 120,
                left: "50%",
                marginLeft : -350
            }

            header.set = {
                height: 60
            }
            content.set = {
                top: 60
            }
            title.set = {
                height: 60,
                width: 350,
                left: "0%",
                marginLeft : 0
            }
            menu.set = {
                top: 15,
                left: "100%",
                marginLeft : -700
            }

            for (var i in items) {
                var unset = items[i].unset;
                for(var j in unset) {
                    items[i].style[j] = unset[j];
                }
            }

            window.events.listen("requestHeaderHeight", function (callback) {
                callback(header.offsetHeight);
            });

            window.addEventListener("resize", function () {
                if(min) {
                    title.style.marginLeft = (header.offsetWidth < menu.offsetWidth + 350 ? -350 : 0) + "px";
                }   
            });
            content.addEventListener("scroll", function () {
                var scroll_top = content.scrollTop;
                if(min && scroll_top == 0) {
                    min = false;
                    morpheus(items,
                    {
                        height: function (el) {
                            return el.unset.height;
                        },
                        width: function (el) {
                            return el.unset.width;
                        },
                        top: function (el) {
                            return el.unset.top;
                        },
                        left: function (el) {
                            return el.unset.left;
                        },
                        marginLeft: function (el) {
                            return el.unset.marginLeft;
                        },
                        duration: 350,
                        complete: function () {
                            window.events.emit("headerChanged", [header.unset.height]);
                        }
                    });
                } else if(!min && scroll_top > 0) {
                    min = true;
                    title.set.marginLeft = header.offsetWidth < menu.offsetWidth + 350 ? -350 : 0
                    morpheus(items,
                    {
                        height: function (el) {
                            return el.set.height;
                        },
                        width: function (el) {
                            return el.set.width;
                        },
                        top: function (el) {
                            return el.set.top;
                        },
                        left: function (el) {
                            return el.set.left;
                        },
                        marginLeft: function (el) {
                            return el.set.marginLeft;
                        },
                        duration: 500,
                        complete: function () {
                            window.events.emit("headerChanged", [header.set.height]);
                        }
                    });
                }
            });     
        }

        
    }

    window.addEventListener("load", function () {
        window.header = new Header();
    })
 
}());