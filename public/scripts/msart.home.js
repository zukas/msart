(function () {
    "use strict";
    function ColumnPanel(text) {
        var self        = this,
            container   = document.createElement("div"),
            field       = new MSInputObject({multiline : true, placeholder : "Description", className : "about-column-text text"}),
            del_btn     = window.admin ? document.createElement("div") : null;

        container.className = "about-column";

        field.setValue(text);

        container.appendChild(field.el);

        if(del_btn) {
            del_btn.className = "remove-about-column";
            container.appendChild(del_btn);
            del_btn.onclick = function () {
                if(self.remove) {
                    self.remove(self);
                }
            }
        }

        self.el = container;

        self.text = function () {
            return field.getValue();
        }
    }

    function Home () {
        var self        = this,
            panel       = document.getElementById("about_panel"),
            columns     = document.getElementById("columns"),
            demo        = document.getElementById("demo_show"),
            create_btn  = window.admin ? document.getElementById("create_about_column") : null,
            save_btn    = window.admin ? document.getElementById("save_about_column") : null,
            remove      = window.admin ? 
                        function (field) {
                            columns.removeChild(field.el);
                            cpanels.splice(cpanels.indexOf(field), 1);
                        } : null,
            cpanels     = [];

        if(window.admin) {
            panel.setAttribute("admin",true);
        }

        if(create_btn) {
            create_btn.onclick = function () {
                var field = new ColumnPanel();
                field.remove = remove;
                cpanels.push(field);
                columns.appendChild(field.el);
            }
        }

        if(save_btn) {
            save_btn.onclick = function () {
                var fields = [];
                for(var i = 0; i < cpanels.length; ++i) {
                    fields.push(cpanels[i].text());
                }
                window.ajax({
                    type: "POST",
                    data: { fields : fields },
                    url: "/async/about/save"
                });
            }
        }

        window.ajax({
            type: "POST",
            url: "/async/about/load",
        }).done(function (data) {
            if(data.status && data.fields) {
                var frag = document.createDocumentFragment();
                for(var i in data.fields) {
                    var field = new ColumnPanel(data.fields[i]);
                    field.remove = remove;
                    cpanels.push(field);
                    frag.appendChild(field.el);
                }
                columns.appendChild(frag);
            }
        });

        var children    = demo.getElementsByClassName("demo-image"),
            length      = children.length,
            idx         = 0;

        children[0].style.display = "block";
        children[0].style.opacity = 1;

        function animate() {

            var next    = children[(idx+1) % length],
                curr    = children[idx % length];

            next.style.zIndex = 1;
            curr.style.zIndex = 0;
            next.direction = 1;
            curr.direction = 0;

            morpheus([next, curr],
            {
                opacity: function (el) {
                    if(el.direction == 1) {
                        el.style.display = "block";
                    }
                    return el.direction;
                },
                complete : function (e) {
                    curr.style.display = "none";
                    curr.style.opacity = 0;
                }
            });
            idx = idx + 1;
            async(animate, null, 7000);
        }

        async(animate, null, 7000);
    }

    window.addEventListener("load", function () {
        window.home = new Home();
    })
 
}());