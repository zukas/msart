(function () {
    "use strict";
    var MenuOption =
    {
        KEEP : 0,
        MOVE : 1,
        DEL  : 2
    };

    function Option (value) {

        var self_       = this,
            container_  = document.createElement("span"),
            button_     = document.createElement("input"),
            label_      = document.createElement("label");    

        button_.id = value;
        button_.className = "info-option";
        button_.type = "radio";
        button_.name = "info-option";  

        label_.htmlFor = value;
        label_.className = "no-select";

        container_.appendChild(button_);
        container_.appendChild(label_);

        self_.el = container_;

        self_.checked = function() {
            return button_.checked;
        }  

        self_.check = function () {
            button_.checked = true;
        }

        self_.text = function (txt) {
            label_.innerHTML = "<span></span>" + txt;
        }
    }

    function OptionMenu() {

        var container_  = document.createElement("div"),
            form_       = document.createElement("form"),
            keep_       = new Option(MenuOption.KEEP),
            move_       = new Option(MenuOption.MOVE),
            del_        = new Option(MenuOption.DEL),
            options_    = {};

        options_[MenuOption.KEEP] = keep_;
        options_[MenuOption.MOVE] = move_;
        options_[MenuOption.DEL] = del_;

        container_.className = "info-controls text";
        container_.appendChild(form_);

        keep_.text("Keep in Shop");
        move_.text("Move to Gallery");
        del_.text("Remove");

        form_.appendChild(keep_.el);
        form_.appendChild(move_.el);
        form_.appendChild(del_.el);

        keep_.check();

        this.el = container_;

        this.checked = function () {
            for(var option in options_) {
                if(options_[option].checked()) {
                    return option;
                }
            }
        }

        this.check = function (option) {
            options_[option].check();
        }
    }

    var NavigationAction = 
    {
        NONE : 0,
        PREV : 1,
        NEXT : 2
    };

    function NavigationHandler (action) {
        var self_       = this,
            enabled_    = false,
            timer_      = null,
            component_  = new MSDivObject();

        var selector = {};
        selector[NavigationAction.NONE] = "picture-navigation";
        selector[NavigationAction.PREV] = "picture-navigation prev";
        selector[NavigationAction.NEXT] = "picture-navigation next";

        component_.el.className = selector[action];
        component_.addClass("disabled");

        selector = null;

        self_.el = component_.el;

        component_.el.onmousedown = function() {
            if(enabled_ && !timer_ && self_.click) {
                self_.click();
                timer_ = setInterval(self_.click, 5);
            }
        }

        component_.el.onmouseup = function () {
            if(timer_) {
                clearInterval(timer_);
                timer_ = null;
            }
        }

        self_.enable = function () {
            if(!enabled_) {
                enabled_ = true;
                component_.removeClass("disabled");
            }
        }

        self_.disable = function () {
            if(enabled_) {
                enabled_ = false;
                component_.addClass("disabled");
            }
        }
    }

    function PictureThumb (packet) {

        var self_       = this,
            id_         = packet.id,
            temp_       = packet.file ? true : false,
            file_       = packet.file,
            label_txt_  = packet.label,
            label_      = null,
            data_       = null,
            removed_    = false,
            load_cb_    = null,
            loaded_     = false,
            container_  = new MSDivObject(),
            del_        = window.admin ? document.createElement("div") : null,
            createLabel = function () {
                if(!label_) {
                    label_ = document.createElement("div"),
                    label_.className = "picture-thumb-label header-text no-select";
                    container_.el.appendChild(label_);
                }
                if(label_) {
                    label_.innerHTML = label_txt_ || "";
                }
            },
            delLabel    = function () {
                if(label_) {
                    container_.el.removeChild(label_);
                    label_ = null;
                }
            },
            getLabel    = function () {
                return label_txt_;
            },
            setLabel    = function (text) {
                label_txt_ = text;
                if(label_) {
                    label_.innerHTML = label_txt_ || "";
                }
            };

        container_.el.className = "picture-thumb";

        if(del_) {
            del_.className = "picture-thumb-remove";
            del_.onclick = function () {
                if(self_.removed) {
                    self_.removed(id_);
                }
            }
            container_.el.appendChild(del_);
        }

        if(window.admin) {
            container_.el.setAttribute("draggable", true);
            container_.el.ondragstart = function (e) {
                if(self_.beginMove) {
                    e.dataTransfer.setData("target", id_);
                    self_.beginMove(self_);
                }
            };

            container_.el.ondragover = function (e) {
                e.preventDefault();
                if(self_.hoverTarget && e.target.className == "picture-thumb") {
                    self_.hoverTarget(self_, e.layerX);
                }
            };

            container_.el.ondragend = function (e) {
                e.preventDefault();
                if(self_.endMove) {
                    self_.endMove(self_);
                }
            };
        }

        container_.el.onclick = function () {
            if(self_.click) {
                self_.click(self_);
            }
        }

        self_.el = container_.el;

        self_.id = function () {
            return id_;
        }

        self_.isTemp = function() {
            return temp_;
        }

        self_.file = function () {
            return file_;
        }

        self_.label = getLabel;

        self_.setLabel = setLabel;

        self_.enableLabel = createLabel;

        self_.disableLabel = delLabel;

        self_.data = function () {
            return data_;
        }

        self_.remove = function () {
            removed_ = true;
            return temp_;
        }

        self_.pack = function () {
            return {
                id : id_,
                temp : temp_,
                file : file_,
                label : label_txt_,
                data : data_,
                removed : removed_
            };
        }

        self_.onload = function (callback) {
            if(loaded_ && callback) {
                async(callback, [self_]);
            } else {
                load_cb_ = callback;
            }
        }

        self_.commit = function (callback) {
            if(removed_ && !temp_) {
                window.ajax({
                    type: "POST",
                    data: { id : id_ },
                    url: '/async/images/delete'
                }).done(function (result) {
                    callback();
                });
            } else if(temp_) {
                var fd = new FormData();
                fd.append("file", file_);
                window.ajax({
                    type: "POST",
                    data: fd,
                    files : true,
                    url: '/async/images/save'
                }).done(function (result) {
                    
                    callback({ id : result.id, label: label_txt_ });
                });  
            } else {
                
                callback({ id: id_, label: label_txt_ });
            }
        }

        self_.update = function (new_picture_pack) {
            id_ = new_picture_pack.id;
            temp_ = new_picture_pack.temp;
            setLabel(new_picture_pack.label);
            file_ = new_picture_pack.file;
            data_ = new_picture_pack.data;
            removed_ = new_picture_pack.removed;
            if(temp_) {
                container_.el.style.backgroundImage = "url(" + data_ + ")";
            } else {
                container_.el.style.backgroundImage = "url(/async/thumb/load/" + id_ + ")";  
            }
        }

        if(temp_) {
            var reader = new FileReader();
            reader.onload = function (e) {
                data_ = e.target.result;
                container_.el.style.backgroundImage = "url(" + data_ + ")";
                loaded_ = true;
                if(load_cb_) {
                    async(load_cb_, [self_]);
                    load_cb_ = null;
                }
            }
            reader.readAsDataURL(file_);
        } else {
            container_.loadImage({
                url : "/async/thumb/load/" + id_,
                color: "#e0e0e0", 
                shadow: true, 
                radius: 24, 
                width: 6, 
                length: 22, 
                lines: 15, 
                speed: 0.75 
            });
            loaded_ = true;
            if(load_cb_) {
                async(load_cb_, [self_]);
                load_cb_ = null;
            }
        }
    }

    function PicureViewer () {
        var self_       = this,
            wrapper_    = document.createElement("div"),
            container_  = document.createElement("div"),
            carousel_   = document.createElement("div"),
            preview_    = new MSDivObject(),
            new_        = window.admin ? new FileUpload({ multiple : true, className : "picture-thumb add"}) : null,
            label_      = null,
            temp_       = null,
            ready_      = true,
            thumbs_     = {},
            ordered_    = [],
            drop_       = window.admin ? new DropInsertManager() : null,
            touch_      = 0,
            removed_    = function (picture_id) {
                var thumb = thumbs_[picture_id];
                if(thumb) {
                    if(thumb.remove()){
                        delete thumbs_[picture_id];
                    }
                    carousel_.removeChild(thumb.el);
                }

                var idx = ordered_.indexOf(picture_id);
                if(idx >= 0) {
                    ordered_.splice(idx, 1);
                }
            },
            swap_       = function (picture_id_1, picture_id_2) {
                var thumb1      = thumbs_[picture_id_1],
                    tmp1_pack_  = thumb1.pack(), 
                    tmp2_pack_  = thumbs_[picture_id_2].pack();

                thumbs_[picture_id_1] = thumbs_[picture_id_2];
                thumbs_[picture_id_2] = thumb1;    

                thumbs_[picture_id_1].update(tmp1_pack_);
                thumbs_[picture_id_2].update(tmp2_pack_);

                var idx1    = ordered_.indexOf(picture_id_1),
                    idx2    = ordered_.indexOf(picture_id_2);
                
                
                ordered_[idx1] = picture_id_2;
                ordered_[idx2] = picture_id_1;
                
            },
            lblChanged  = function () {
                var id      = preview_.el.getAttribute("current"),
                    thumb   = thumbs_[id];
                if(thumb) {
                    thumb.setLabel(label_.value());
                }
            },
            present_    = function (thumb) {
                if(thumb.isTemp()) {
                    preview_.el.style.backgroundImage = "url(" + thumb.data() + ")";
                } else {
                    preview_.loadImage({
                        url :  "/async/images/load/" + thumb.id(),
                        color: "#e0e0e0", 
                        shadow: true, 
                        radius: 22, 
                        width: 6, 
                        length: 20, 
                        lines: 13, 
                        speed: 0.75 
                    });
                }
                scrollBodyTo(wrapper_);
                preview_.el.setAttribute("current", thumb.id());
                if(label_) {
                    label_.onchange = null;
                    label_.setValue(thumb.label());
                    label_.onchange = lblChanged;
                }
            },
            enableLabel    = function (text) {
                if(!label_) {
                    label_ = new MSInputObject({className : "picture-preview-label text"});
                    preview_.el.appendChild(label_.el);
                }

                label_.onchange = null;

                if(!text) {
                    var id      = preview_.el.getAttribute("current"),
                        thumb   = thumbs_[id];
                    if(thumb) {
                        label_.setValue(thumb.label());
                    }
                } else {
                    label_.setValue(text);
                }

                for(var key in thumbs_) {
                    if(thumbs_.hasOwnProperty(key)) {
                        thumbs_[key].enableLabel();
                    }
                }  

                label_.onchange = lblChanged;
            },
            disableLabel    = function () {
                if(label_) {
                    preview_.el.removeChild(label_.el);
                    label_ = null;
                }

                for(var key in thumbs_) {
                    if(thumbs_.hasOwnProperty(key)) {
                        thumbs_[key].disableLabel();
                    }
                }
            };

        if(window.admin) {
            drop_.insertBefore = function (source, target) {
                var src_idx    = ordered_.indexOf(source.id()),
                    trg_idx    = null;
                if(src_idx >= 0) {
                    ordered_.splice(src_idx, 1);
                    trg_idx = ordered_.indexOf(target.id());  

                    if(trg_idx >=0) {
                        ordered_.splice(trg_idx, 0, source.id());
                        carousel_.removeChild(source.el);
                        carousel_.insertBefore(source.el, target.el);
                    }

                }
            }

            drop_.insertAfter = function (source, target) {
                var src_idx    = ordered_.indexOf(source.id()),
                    trg_idx    = null;

                if(src_idx >= 0) {
                    ordered_.splice(src_idx, 1);
                    trg_idx = ordered_.indexOf(target.id());  

                    if(trg_idx >=0) {
                        ordered_.splice(trg_idx + 1, 0, source.id());
                        carousel_.removeChild(source.el);
                        var next = target.el.nextElementSibling;
                        if(next) {
                            carousel_.insertBefore(source.el, next);
                        } else {
                            carousel_.appendChild(source.el);
                        }
                    }
                }
            } 
        }


        wrapper_.className = "picture-manager";
        container_.className = "picture-container";
        carousel_.className = "picture-carousel";

        container_.appendChild(carousel_);

        preview_.el.className = "picture-preview";

        if(new_) {
            carousel_.appendChild(new_.el);
            new_.preview = function (files) {
                if(files) {
                    self_.beginAdd();
                    var first = null;
                    for(var i = 0; i < files.length; ++i) {
                        var thumb = new PictureThumb({ id : String(hashCode(files[i].name)), file : files[i] });
                        if(!first) {
                            first = thumb;
                        }
                        self_.add(thumb);
                    }
                    self_.endAdd();
                    self_.show(first);
                }
            }
        }

        wrapper_.appendChild(preview_.el);
        wrapper_.appendChild(container_);
        self_.el = wrapper_;

        self_.imageList = function () {
            return ordered_;
        }

        self_.enableLabel = enableLabel;

        self_.disableLabel = disableLabel;

        self_.commit = function (callback) {
            var commit_next = function (idx, total, container, result, done) {
                if(idx == total) {
                    
                    done(result);
                } else {
                    thumbs_[container[idx]].commit(function (res) {
                        if(res) {

                            result.push(res);
                        }
                        commit_next(idx+1, total, container, result, done);
                    }); 
                }
            };
            
            commit_next(0, ordered_.length, ordered_, [], callback);
        };

        self_.beginAdd = function () {
            if(temp_ == null) {
                temp_ = document.createDocumentFragment();
                ready_ = false;
            }
        };

        self_.endAdd = function () {
            ready_ = true;
            if(temp_) {
                carousel_.appendChild(temp_);
                temp_ = null;
                if(ordered_.length > 0) {
                    thumbs_[ordered_[0]].onload(present_);
                }
            }
        }

        self_.present = function (idx) {
            var thumb = thumbs_[idx];
            if(thumb) {
                async(present_,[thumb]);
            }
        }

        self_.add = function (picture_thumb) {
            if(temp_) {
                if(!thumbs_[picture_thumb.id()]) {
                    
                    ordered_.push(picture_thumb.id());
                    thumbs_[picture_thumb.id()] = picture_thumb;
                    picture_thumb.removed = removed_;
                    picture_thumb.click = present_;
                    if(window.admin) {
                        picture_thumb.beginMove = drop_.beginMove;
                        picture_thumb.hoverTarget = drop_.hoverTarget;
                        picture_thumb.endMove = drop_.endMove;
                    }
                    temp_.appendChild(picture_thumb.el);
                    if(label_) {
                        picture_thumb.enableLabel();
                    }
                }
            }
        };

        self_.show = function (thumb) {
            var presenter = function () {
                if(temp_) {
                    async(presenter);
                } else {
                    if(thumb) {
                        thumb.onload(present_);
                    }
                }
            };
            async(presenter);
        }
    }

    function SinglePriceTag () {
        var self        = this,
            table       = document.createElement("table"),
            price       = new MSInputObject({ placeholder : "Price", className : "text" }),
            shipping    = new MSInputObject({ placeholder : "Shipping", className : "text" });

        language.bindInput("price", price.el);
        language.bindInput("shipping", shipping.el);

        {
            var r   = document.createElement("tr"),
                p   = document.createElement("th"),
                s   = document.createElement("th");

            r.className = "text-invert";

            language.bind("price", p);
            language.bind("shipping", s);

            r.appendChild(p);
            r.appendChild(s);
            table.appendChild(r);
        }

        {
            var row     = document.createElement("tr"),
                p       = document.createElement("td"),
                s       = document.createElement("td");


            p.appendChild(price.el);
            row.appendChild(p);
            s.appendChild(shipping.el);
            row.appendChild(s);
            table.appendChild(row);
        }

        table.className = "single-item";

        self.el = table;

        self.value = function () {
            return [ { quantity: 1, price: price.value(), shipping: shipping.value() }];
        }

        self.setValue = function (data) {
            price.setValue(data[0].price);
            shipping.setValue(data[0].shipping);
        }
    }

    function MultiPriceTag () {

        function PriceItem (quantity, price, shipping) {
            this.quantity = quantity;
            this.price = price;
            this.shipping = shipping;
        }

        var self        = this,
            table       = document.createElement("table"),
            rows        = [],
            create_row  = function (quantity, price, shipping) {
            var row     = document.createElement("tr"),
                q       = document.createElement("td"),
                qi      = new MSInputObject({ placeholder : "Quantity", className : "text" }),
                p       = document.createElement("td"),
                pi      = new MSInputObject({ placeholder : "Price", className : "text" }),
                s       = document.createElement("td"),
                si      = new MSInputObject({ placeholder : "Shipping", className : "text" }),
                c       = document.createElement("td"),
                ci      = document.createElement("div"),
                item    = new PriceItem(qi, pi, si);

            language.bindInput("quantity", qi.el);
            language.bindInput("price", pi.el);
            language.bindInput("shipping", si.el);

            ci.className = "remove-row";

            rows.push(item);
            qi.setValue(quantity || "");
            pi.setValue(price || "");
            si.setValue(shipping || ""); 

            q.appendChild(qi.el);    
            row.appendChild(q);
            p.appendChild(pi.el);
            row.appendChild(p);
            s.appendChild(si.el);
            row.appendChild(s);
            c.appendChild(ci);
            row.appendChild(c); 
            

            table.appendChild(row);

            ci.onclick = function (e) {
                var idx = rows.indexOf(item);
                if(idx >= 0) {
                    rows.splice(idx, 1);
                    table.removeChild(row);
                }
            }
        }   

        {
            var r   = document.createElement("tr"),
                q   = document.createElement("th"),
                p   = document.createElement("th"),
                s   = document.createElement("th"),
                c   = document.createElement("th"),
                ci  = document.createElement("div");

            r.className = "text-invert";

            language.bind("quantity", q);
            language.bind("price", p);
            language.bind("shipping", s);

            r.appendChild(q);
            r.appendChild(p);
            r.appendChild(s);

            ci.className = "add-new-row";
            c.appendChild(ci);
            r.appendChild(c)
            ci.onclick = function () { create_row(); };
            
            
            table.appendChild(r);

        }

        table.className = "multi-item";

        self.el = table;

        self.value = function () {
            var values = [];
            for(var i = 0; i < rows.length; ++i) {
                values.push({
                    quantity: rows[i].quantity.value(),
                    price: rows[i].price.value(),
                    shipping: rows[i].shipping.value()
                });
            }
            return values;
        }

        self.setValue = function (data) {
            for(var i = 0; i < data.length; ++i) {
                create_row(data[i].quantity, data[i].price, data[i].shipping);
            } 
        }
    }

    function UserPriceTag () {

        var self    = this,
            current = null,
            table   = document.createElement("table"),
            r       = document.createElement("tr"),
            q       = document.createElement("th"),
            p       = document.createElement("th"),
            s       = document.createElement("th"),
            dr      = document.createElement("tr"),
            dq      = document.createElement("td"),
            dp      = document.createElement("td"),
            ds      = document.createElement("td");

        r.className = "text-invert";

        language.bind("quantity", q);
        language.bind("price", p);
        language.bind("shipping", s);

        r.appendChild(q);
        r.appendChild(p);
        r.appendChild(s);
        
        table.appendChild(r);

        dr.appendChild(dq);
        dr.appendChild(dp);
        dr.appendChild(ds);
        
        table.appendChild(dr);

        dp.setAttribute("currency", "zł");
        ds.setAttribute("currency", "zł");

        self.el = table;

        self.value = function () {
            return current;
        }

        self.setValue = function (data) {
            if(data.length == 1) {
                dq.innerHTML = data[0].quantity;
                dp.innerHTML = data[0].price;
                ds.innerHTML = data[0].shipping;
                current = { 
                    quantity: data[0].quantity, 
                    price: data[0].price, 
                    shipping: data[0].shipping 
                };
            } else if(data.length > 1) {
                var dqi = new DropDown({});
                dqi.changed = function (idx) {
                    dp.innerHTML = data[idx].price;
                    ds.innerHTML = data[idx].shipping;
                    current = { 
                        quantity: data[idx].quantity, 
                        price: data[idx].price, 
                        shipping: data[idx].shipping 
                    };
                }
                for(var i = 0; i < data.length; ++i) {
                    dqi.addItem(i).controller.setValue(data[i].quantity);
                }
                dq.appendChild(dqi.el);
            }

        }
    }


    function PriceControl (data) {

        var self        = this,
            container   = document.createElement("div"),
            controls    = null,
            isnull      = false,
            index       = 0;

        if(window.admin) {
            controls    = [new SinglePriceTag(), new MultiPriceTag()];

            if(data && data.type) {
                index = (data.type >= 0 && data.type < 2 ? data.type : 0); 
            }

            container.appendChild(controls[index].el);
        } else {
            controls = new UserPriceTag();
            container.appendChild(controls.el);
        }

        container.className = "price text advert-hide";

        self.el = container;
        if(window.admin) {
            self.change = function (idx) {
                container.removeChild(controls[index].el);
                index = (idx >= 0 && idx < 2 ? idx : 0);
                container.appendChild(controls[index].el);
                if(self.changed) {
                    self.changed(idx);
                }
            }

            self.nullValue = function (is_null) {
                isnull = is_null;
            }
        }

        self.value = function () {
            if(window.admin) {
                return isnull ? null : {
                    type : index,
                    values : controls[index].value()
                }
            } else {
                return controls.value();
            }
        }

        self.setValue = function (data) {
            if(data) {
                if(window.admin) {
                    self.change(data.type);
                    controls[index].setValue(data.values);
                } else {
                    controls.setValue(data.values);
                }
            }
        }

    }

    function ProjectView () {
        var self        = this,
            enabled     = true,
            head        = document.createElement("div"),
            select      = new DropDown({ className : "component-ctl" });

        head.className = "text-header header-text";
        language.bind("projects", head);


        select.changed = function (idx) {
            if(self.changed) {
                self.changed(idx);
            }
        }

        self.setValue = function (data) {
            if(data) {
                for(var i = 0; i < data.length; ++i) {
                    select.addItem(data[i].id).controller.setValue(data[i].label);
                }
            }
        }

        self.value = function () {
            return select.value();
        }

        self.text = function () {
            return select.text();
        }

        self.enabled = function () {
            return enabled;
        }

        self.enable = function () {
            enabled = true;
            head.removeAttribute("style");
            select.el.removeAttribute("style");
        }

        self.disable = function () {
            enabled = false;
            head.style.display = "none";
            select.el.style.display = "none";
        }


        var doc = document.createDocumentFragment();
        doc.appendChild(head);
        doc.appendChild(select.el);
        self.el = doc;
    }

    function CategoryView() {

        var self        = this,
            list        = document.createElement("div"),
            add_li      = document.createElement("div"),
            add         = document.createElement("div"),
            categories  = [],
            present     = null,
            current     = [],
            used        = {},
            loaded      = false;

        list.className = "category-list";
        add_li.className = "category-item-view add-category-item";
        add_li.appendChild(add);
        list.appendChild(add_li);

        function create_category_select(category_id) {
            if(current.length < categories.length) {
                var c   = document.createElement("div"),
                    w   = document.createElement("div"),
                    d   = new DropDown({ className : "category-ctl" }, w),
                    r   = document.createElement("div");

                c.className = "category-item-view";
                r.className = "remove-category-item";

                c.appendChild(w);
                c.appendChild(r);

                r.onclick = function () {
                    var idx = current.indexOf(d);
                    if(idx >= 0) {
                        current.splice(idx, 1);
                        delete used[d.id];
                        list.removeChild(c);
                        c = null;
                    }
                    
                    if(current.length < categories.length) {
                        add_li.style.display = null;
                    }
                }

                current[current.length] = d;

                d.beforeOpen = function () {
                    if(present) {
                        for(var i = 0; i < present.length; ++i) {
                            d.removeVirtual(present[i]);
                        }
                    }
                    present = [];
                    for(var i = 0; i < categories.length; ++i) {
                        if(!used[categories[i]._id] || used[categories[i]._id] == d) {
                            (function(item, data){
                                item.onclick = function (e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    d.setText(data.title);
                                    delete used[d.id];
                                    d.id = data._id;
                                    used[data._id] = d;

                                    d.close();
                                }
                                item.className = "dropdown-item text-invert";
                                item.innerHTML = data.title;
                                present[present.length] = item;

                            })(d.addVirtual(), categories[i]);
                        }
                    }
                }

                d.beforeClose = function () {
                    if(present) {
                        for(var i = 0; i < present.length; ++i) {
                            d.removeVirtual(present[i]);
                        }
                        present = null;
                    }
                }

                if(category_id) {
                    for(var i = 0; i < categories.length; ++i) {
                        if(categories[i]._id == category_id) {
                            used[category_id] = d;
                            d.id = category_id;
                            d.setText(categories[i].title);
                            break;
                        }
                    }
                } else {
                    for(var i = 0; i < categories.length; ++i) {
                        if(!used[categories[i]._id]) {
                            used[categories[i]._id] = d;
                            d.id = categories[i]._id;
                            d.setText(categories[i].title);
                            break;
                        }
                    }
                }
                
                list.insertBefore(c, add_li);
                
                if(current.length == categories.length) {
                    add_li.style.display = "none";
                }
            }
        }

        add_li.onclick = function () { create_category_select(); };

        self.el = list;

        self.setValue = function (value) {
            if(value) {
                function set_on_load () {
                    if(!loaded) {
                        async(set_on_load);
                    } else {
                        for(var i = 0; i < value.length; ++i) {
                            create_category_select(value[i]);
                        }
                    }
                }
                set_on_load();
            }
        }

        self.value = function () {
            return Object.keys(used);
        }

        window.ajax({
            type : "POST",
            data : null,
            url : "/async/category/list"
        }).done(function (result) {
            loaded = true;
            if(result.status) {
                categories = result.categories || [];
                if(categories.length == 0) {
                    add_li.style.display = "none";
                }
            }
        });
    }

    function DetailsContact() {
        var self        = this,
            container   = document.createElement("div"),
            title       = document.createElement("div"),
            name        = document.createElement("input"),
            email       = document.createElement("input"),
            message     = new MSInputObject({ className: "message text", multiline : true, user: true });

        container.className = "shop-item-contact-panel";
        title.className = "text-header header-text";
        name.className = "name text";
        email.className = "email text";

        language.bind("contact", title);
        language.bindInput("full_name", name);
        language.bindInput("email", email);
        language.bindInput("message", message.el);

        container.appendChild(title);
        container.appendChild(name);
        container.appendChild(email);
        container.appendChild(message.el);

        self.el = container;

        self.value = function () {
            return {
                name: name.value,
                email: email.value,
                message: message.value()
            }
        }

        function focus () {
            this.removeAttribute("error");
            this.onfocus = null;
        }

        self.error = function (err) {
            for(var key in err) {
                if(key == "name") {
                    name.setAttribute("error", true);
                    name.onfocus = focus;
                } else if(key == "email") {
                    email.setAttribute("error", true);
                    email.onfocus = focus;
                } else if(key == "message") {
                    message.el.setAttribute("error", true);
                    message.el.onfocus = focus;
                }
            }
        }
    }

    function DetailsView(item) {
        var self        = this,
            container   = document.createElement("div"),
            view        = document.createElement("div"),
            ctl         = document.createElement("div"),
            contact     = null,
            htitle      = document.createElement("div"),
            title       = new MSInputObject({ className: "title text", placeholder: "Title", multiline : true }),
            htype       = window.admin ? document.createElement("div") : null,
            type        = window.admin ? new DropDown({ className : "type-ctl" }) : {
                setValue: function (data) {
                    if(data == 2) {
                        container.setAttribute("advert",true);
                        contact = new DetailsContact();
                        view.appendChild(contact.el);
                        language.unbind("order", act_btn);
                        language.bind("send", act_btn);
                    }
                }
            },
            havail      = document.createElement("div"),
            avail       = new DropDown({ className : "avail-ctl", adminOnly : true }),
            haction     = window.admin ? document.createElement("div") : null,
            action      = window.admin ? new DropDown({ className : "action-ctl" }) : null,
            hcomponent  = window.admin ? document.createElement("div") : null,
            component   = window.admin ? new DropDown({ className : "component-ctl" }) : {
                setValue: function (data) {
                    if(data == 0) {
                        self.disableLabel();
                        proj.disable();
                    } else {
                        self.enableLabel();
                        proj.enable();
                    }
                }
            },
            proj        = window.admin ? null : new ProjectView(),
            hcateg      = window.admin ? document.createElement("div") : null,
            categ       = window.admin ? new CategoryView() : null,
            hprice      = document.createElement("div"),
            price       = new PriceControl({ type : 0 }),
            hpayment    = document.createElement("div"),
            payment     = document.createElement("div"),
            hlead       = document.createElement("div"),
            lead        = document.createElement("div"),
            hdesc       = document.createElement("div"),
            desc        = new MSInputObject({ className: "desc text", placeholder: "Description", multiline : true }),
            del_btn     = window.admin && item.id() ? document.createElement("div") : null,
            act_btn     = document.createElement("div"),
            cl_btn      = document.createElement("div"),
            collective  = 
            {
                title: title,
                type: type,
                availability: avail,
                action: action,
                components : component,
                images: proj,
                categories: categ,
                price: price,
                descrition: desc
            };

        container.className = "details-container";
        view.className = "details-view";
        container.appendChild(view);

        ctl.className = "control-view";
        container.appendChild(ctl);

        htitle.className = "text-header header-text";
        language.bind("title", htitle);
        language.bindInput("title", title.el);
        

        view.appendChild(htitle);
        view.appendChild(title.el);

        if(window.admin) {
            language.bind("individual",type.addItem(0));
            language.bind("common",type.addItem(1));
            language.bind("advert",type.addItem(2));
            htype.className = "text-header header-text";
            language.bind("type", htype);
            view.appendChild(htype);
            view.appendChild(type.el);
        } else {
            proj.changed = function (idx) {
                if(self.selectImage) {
                    self.selectImage(idx);
                }
            }
        }

        avail.changed = function (idx) {
            language.unbind(lead);
            if(idx == 0) {
                language.bind("lead_avail", lead);
            } else {
                language.bind("lead_wait", lead);
            }
        }

        language.bind("available",avail.addItem(0));
        language.bind("demand",avail.addItem(1));

        havail.className = "text-header header-text";
        language.bind("availability", havail);
        view.appendChild(havail);
        view.appendChild(avail.el);

        if(window.admin) {

            language.bind("keep",action.addItem(0));
            language.bind("move",action.addItem(1));
            language.bind("remove",action.addItem(2));

            haction.className = "text-header header-text";
            language.bind("process", haction);
            view.appendChild(haction);
            view.appendChild(action.el);

            language.bind("components", hcomponent);
            hcomponent.className = "text-header header-text";

            language.bind("none", component.addItem(0));
            language.bind("labeled", component.addItem(1));

            view.appendChild(hcomponent);
            view.appendChild(component.el);

            component.changed = function (idx) {
                if(idx == 0) {
                    self.disableLabel();
                } else {
                    self.enableLabel();
                }
            }
            component.lock();

        } else {
            view.appendChild(proj.el);
        }

        if(window.admin) {
            hcateg.className = "text-header header-text";
        language.bind ("category",hcateg);
            

            view.appendChild(hcateg);
            view.appendChild(categ.el);
        }

        hprice.className = "text-header header-text advert-hide";
        language.bind("price", hprice);
        view.appendChild(hprice);
        view.appendChild(price.el);

        hpayment.className = "text-header header-text advert-hide";
        language.bind("payment_opt", hpayment);
        payment.className = "payments advert-hide";

        window.ajax({
            type : "POST",
            data : null,
            url : "/async/payment/types"
        }).done(function (result) {
            if(result.status) {
                for(var i = 0; i < result.types.length; ++i) {
                    var it = document.createElement("div");
                    it.className = "payment-option";
                    it.setAttribute("type", result.types[i]);
                    payment.appendChild(it);
                }
            }
        });
        

        view.appendChild(hpayment);
        view.appendChild(payment);

        hlead.className = "text-header header-text advert-hide";
        language.bind("lead", hlead);

        lead.className = "lead-time text advert-hide";

        view.appendChild(hlead);
        view.appendChild(lead);

        hdesc.className = "text-header header-text";
        language.bind("description", hdesc);
        language.bindInput("description", desc.el);

        act_btn.className = "action-btn no-select text-invert";
        language.bind(window.admin ? "save" : "order", act_btn);
        ctl.appendChild(act_btn);

        act_btn.onclick = function () {

            if(window.admin) {
                var data = {};
                for(var key in collective) {
                    if(collective.hasOwnProperty(key) && collective[key]) {
                        data[key] = collective[key].value();
                    }
                }
                self.save(data);
            } else if(contact) {
                var data = contact.value();
                data.data = {
                    id : item.id(),
                    preview : proj.enabled() ? proj.value() : item.preview(),
                    title : title.value(),
                    component : proj.enabled() ? proj.text() : null
                }
                self.contact(data, function (result) {
                    if(!result.status) {
                        contact.error(result.error);
                    }
                });
            } else {
                var data = price.value() || {};
                data.id = item.id();
                data.preview = proj.enabled() ? proj.value() : item.preview();
                data.title = title.value();
                data.availability = avail.value();
                data.component = proj.enabled() ? proj.text() : null;
                self.order(data);
            }
        }

        cl_btn.className = "close-btn no-select text-invert";
        language.bind("close", cl_btn);
        ctl.appendChild(cl_btn);

        cl_btn.onclick = function () {
            self.close();
        }

        if(del_btn) {
            del_btn.className = "delete-btn no-select text-invert";
            language.bind("delete", del_btn);
            ctl.appendChild(del_btn);

            del_btn.onclick = function () {
                self.remove();
            }

        }

        view.appendChild(hdesc);
        view.appendChild(desc.el);

        type.changed = function (val) {
            if(val == 2) {
                price.nullValue(true);
                avail.setValue(1);
                avail.lock(); 
                action.setValue(0);
                action.lock();
                component.unlock();
                container.setAttribute("advert",true);
            }
        }

        self.el = container;

        self.show = function () {
        };

        self.init = function () {
            
            type.changed = function (val) {
                price.nullValue(false);
                container.removeAttribute("advert");
                if(val == 0) {
                    price.change(0);
                    avail.setValue(0);
                    component.setValue(0);
                    avail.unlock();
                    action.unlock();
                    component.lock();
                } else if(val == 1){
                    price.change(1);
                    avail.setValue(1);
                    action.setValue(0);
                    avail.lock(); 
                    action.lock();
                    component.unlock();
                } else if(val == 2) {
                    price.nullValue(true);
                    avail.setValue(1);
                    avail.lock(); 
                    action.setValue(0);
                    action.lock();
                    component.unlock();
                    container.setAttribute("advert",true);
                }
            }
        }


        self.setValue = function (data) {
            for(var key in collective) {
                if(collective.hasOwnProperty(key) && collective[key]) {
                    
                    collective[key].setValue(data[key]);
                }
            }
        } 

    }

    function PreviewPanel(item, category) {

        function Controller (c_item, c_category, container) {
            var self        = this,
                viewer      = new PicureViewer(),
                details     = new DetailsView(c_item);

            details.close = function () {
                self.close();
            }

            details.order = function (data) {
                self.close(function() {
                    
                    window.events.emit("order", [data]);
                }, { force : true });
            }

            details.contact = function (data, error) {
                window.ajax({
                    type: "POST",
                    data: data,
                    url: '/async/contact',
                }).done(function (result) {
                     if(result.status) {
                        self.close();
                    } else {
                        error(result);
                    }
                });
                
            }

            details.enableLabel = function () {
                viewer.enableLabel();
            }

            details.disableLabel = function () {
                viewer.disableLabel();
            }

            self.load = function (callback) {
                if(item.id()) {
                    window.ajax({
                        type: "POST",
                        data: { id : item.id() },
                        url: '/async/shop/load',
                    }).done(function (result) {
                        if(result.item) {
                            details.setValue(result.item);
                            viewer.beginAdd();
                            for(var i in result.item.images) {
                                viewer.add(new PictureThumb(result.item.images[i]));
                            }
                            viewer.endAdd();
                            details.init();
                        }
                        if(callback) {
                            callback();
                        }
                    });
                } else {
                    details.init();
                    if(callback) {
                        callback();
                    }
                }
            }

            details.selectImage = function (idx) {
                viewer.present(idx);
            }

            self.create = function () {
                container.appendChild(viewer.el);
                container.appendChild(details.el);
            }

            self.destroy = function () {
                container.removeChild(viewer.el);
                container.removeChild(details.el);
            }

            self.show = function () {
                viewer.show();
                details.show();
            }

            if(window.admin) {
                details.save = function (data) {
                    viewer.commit(function (pictures) {

                        data.id = item.id();
                        data.images = pictures;
                        window.ajax({
                            type: "POST",
                            data: data,
                            url: '/async/shop/save'
                        }).done(function (result) {
                            if(result.status) {
                                var callback = null;
                                if(c_item.id() == result._id) {
                                    c_item.update({
                                        title: data["title"],
                                        price: data["price"], 
                                        preview: pictures[0]
                                    });
                                } else {
                                    callback = function() {
                                        category.reload();
                                    }
                                }
                                self.close(callback);
                            }
                        });
                    });
                }
                details.remove = function () {
                    
                    window.ajax({
                        type: "POST",
                        data: { id : c_item.id() },
                        url: '/async/shop/delete'
                    }).done(function (result) {
                        if(result.status) {
                            c_category.removeItem(c_item);
                            self.close();
                        }
                    });
                }
            }

        }

        var self_       = this,
            container_  = document.createElement("div"),
            view_       = document.createElement("div"),
            controller  = new Controller(item, category, view_);

        function closePanel(callback, opt) {
            async(self_.close, callback ? [callback, opt] : null);
        }

        controller.close = closePanel;

        if(window.admin) {
            container_.className = "shop-item-container edit"; 
        } else {
            container_.className = "shop-item-container";    
        }

        container_.style.display = "none";

        view_.className = "shop-item-view";

        controller.create();

        container_.appendChild(view_);

        this.el = container_;

        this.id = function () {
            return item.id();
        } 

        this.item = function () {
            return item;
        }

        this.replace = function (n_item, n_category, callback) {
            item = n_item;
            category = n_category;
            var tmp = new Controller(item, category, view_);
            tmp.close = closePanel;
            tmp.load(function () {
                controller.destroy();
                tmp.create();
                controller = tmp;
                if(callback) {
                    callback();
                }
            });
        }

        this.show = function (options) {
            options = options || {};
            if(!options.force) {
                container_.style.display = "block";
                var height = container_.offsetHeight;
                scrollBodyTo(container_);
                container_.style.height = "0px";
                morpheus(container_, {
                    height: height,
                    duration: 300,
                    complete : function () {
                        morpheus(container_, {
                            marginLeft : 0,
                            duration: 300,
                            complete: function () {
                                controller.show();
                            }
                        });
                        container_.style.height = null;
                    }
                });
            } else {
                scrollBodyTo(container_);
                morpheus(container_, {
                    marginLeft : 0,
                    duration: 300,
                    complete: function () {
                        controller.show();
                    }
                });
            }
        }

        this.hide = function (callback, options) {
            options = options || {};
            morpheus(container_, {
                marginLeft: "-110%",
                duration: 300,
                complete : function () {
                    if(!options.force) {
                        scrollBodyTo(item.el);
                    }
                    container_.style.marginLeft = null;
                    if(!options.inline) {
                        morpheus(container_, {
                            height: 0,
                            duration: 300,
                            complete: function () {
                                container_.style.display = "none";
                                if(callback) {
                                    callback();
                                }
                            }
                        });
                    } else {
                        if(callback) {
                            callback();
                        }
                    }
                }
            });
        }

        controller.load();
    }

    function NewShopItem() {

        var self        = this,
            item        = document.createElement("div"),
            item_int    = document.createElement("div"),
            item_img    = document.createElement("div");

        item.className = "shop-item-new";
        item_int.className = "shop-item-internal";
        item.appendChild(item_int);
        {
            item_img.className = "shop-item-image";
            item_int.appendChild(item_img);
        }
        self.el = item;

        item.onclick = function () {
            if(self.open) {
                self.open(self);
            }
        }

        self.id = function () {
            return null;
        }

        self.title = function () {
            return null;
        }

        self.position = function () {
            return item.offsetTop;
        }
    }

    function ShopItem(data) {

        var self        = this,
            item        = document.createElement("div"),
            item_int    = document.createElement("div"),
            title_      = document.createElement("div"),
            item_img    = new MSDivObject(),
            preview_id  = data.preview.id,
            price_      = document.createElement("div");

        item.id = data._id;
        if(window.admin) {
            item.className = "shop-item edit no-select";   
        } else {
            item.className = "shop-item no-select"; 
        }
        item_int.className = "shop-item-internal";
        item.appendChild(item_int);
        {
            item_img.el.className = "shop-item-image";
            item_int.appendChild(item_img.el);

            title_.className = "shop-item-title text";
            item_int.appendChild(title_);
            
            price_.className = "shop-item-price text";
            item_int.appendChild(price_);
        }
        item_img.loadImage({ 
            url : "/async/preview/load/" + preview_id, 
            color: "#e0e0e0", 
            shadow: true, 
            width: 3 
        });
        title_.innerHTML = data.title;  
        if(data.price) {
            price_.innerHTML = Math.round(data.price.values[0].price / data.price.values[0].quantity);
            price_.setAttribute("currency", "zł");
        } else {
            price_.innerHTML = null;
            price_.removeAttribute("currency");
        }

        self.id = function () {
            return item.id;
        }

        self.title = function () {
            return title_.innerHTML;
        }

        self.position = function () {
            return item.offsetTop;
        }

        self.preview = function () {
            return preview_id;
        }

        self.update = function (new_data) {
            preview_id = new_data.preview.id;
            item_img.loadImage({ 
                url : "/async/preview/load/" + preview_id, 
                color: "#e0e0e0", 
                shadow: true, 
                width: 3 
            });
            title_.innerHTML = new_data.title;
            if(new_data.price) {
                price_.innerHTML = Math.round(new_data.price.values[0].price / new_data.price.values[0].quantity);
                price_.setAttribute("currency", "zł");
            } else {
                price_.innerHTML = null;
                price_.removeAttribute("currency");
            }
        }

        item.onclick = function () {
            if(item.getAttribute("ordered")) {
                window.scrollBodyTo(window.orders.el);
            } else if(self.open) {
                self.open(self);  
            }
        }

        if(window.admin) {
            data.counts = data.counts || {};
            var views          = document.createElement("div"),
                view_1         = document.createElement("div"),
                count_1        = document.createElement("span"),
                view_2         = document.createElement("div"),
                count_2        = document.createElement("span"),
                view_3         = document.createElement("div"),
                count_3        = document.createElement("span"),
                view_4         = document.createElement("div"),
                count_4        = document.createElement("span"),
                view_5         = document.createElement("div"),
                count_5        = document.createElement("span");

            views.className = "visit-counter-container text";
            view_1.className = "visit-counter";
            view_2.className = "visit-counter";
            view_3.className = "visit-counter";
            view_4.className = "visit-counter";
            view_5.className = "visit-counter";

            language.bind("today", view_1);
            language.bind("l_3_day", view_2);
            language.bind("l_week", view_3);
            language.bind("l_month", view_4);
            language.bind("l_time", view_5);

            count_1.innerHTML = data.counts.day_1 || 0;
            count_2.innerHTML = data.counts.day_3 || 0;
            count_3.innerHTML = data.counts.day_7 || 0;
            count_4.innerHTML = data.counts.day_28 || 0;
            count_5.innerHTML = data.counts.all || 0;

            view_1.appendChild(count_1);
            view_2.appendChild(count_2);
            view_3.appendChild(count_3);
            view_4.appendChild(count_4);
            view_5.appendChild(count_5);

            views.appendChild(view_1);
            views.appendChild(view_2);
            views.appendChild(view_3);
            views.appendChild(view_4);
            views.appendChild(view_5);

            item_int.appendChild(views);
        } else {
            var ordered     = document.createElement("div"),
                cart        = document.createElement("div");

            ordered.className = "shop-item-ordered";
            cart.className = "shop-item-ordered-icon";


            ordered.appendChild(cart);
            item.appendChild(ordered);
        }

        self.el = item;
    }


    function ShopItemList (navigator) {
        var self        = this,
            container   = document.getElementById("shop_item_view"),
            view        = document.createElement("div"),
            creator     = window.admin ? new NewShopItem() : null,
            hash        = window.location.hash ? window.location.hash.substring(1) : null,
            preview     = null,
            marker      = null;

        if(window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, "/");
        }

        function update (callback) {
            async(function(){
                if(preview) {
                    var nodes   = view.childNodes,
                        item    = preview.item(),
                        pos     = item.position(),
                        ins     = null;
                    if(view.contains(preview.el)) {
                        view.removeChild(preview.el);
                    }

                    for(var i = 0; i < nodes.length; ++i) {
                        if(pos < nodes[i].offsetTop) {
                            ins = nodes[i];
                            break;
                        }
                    }

                    if(ins) {
                        view.insertBefore(preview.el, ins);
                    } else {
                        view.appendChild(preview.el);
                    }

                    if(callback && classOf(callback) == "Function") {
                        callback();
                    }
                }
            });
        }

        function close (callback, opt) {
            if(preview) {
                window.removeEventListener("resize", update);
                var el = preview.el;
                preview.hide(function () {
                    view.removeChild(el);
                    el = null;
                    if(callback) {
                        callback();
                    }
                }, opt);
                preview = null;
            } else if (callback) {
                callback();      
            }
        }

        function open (item) {
            if(preview) {
                var inline  = preview.item().position() == item.position();
                preview.hide(function () {
                    preview.replace(item, self, function () {
                        if(!inline) {
                            update(function () {
                                preview.show();
                            });
                        } else {
                            preview.show({ force : true });
                        }
                    });
                }, { 
                    force : true, 
                    inline: inline
                });
            } else {
                preview = new PreviewPanel(item, self);
                preview.close = close;
                update(function () {
                    preview.show();
                });
                window.addEventListener("resize", update);

            }
        }

        self.createItem = function (shop_item, insert) {
            if(insert && creator && creator.el.nextSibling) {
                view.insertBefore(shop_item.el, creator.el.nextSibling);
            } else {
                view.appendChild(shop_item.el);
            }
            shop_item.open = open;
        }

        self.removeItem = function (shop_item) {
            view.removeChild(shop_item.el);
        }

        container.appendChild(view);
        self.el = container;


        function load_shop_items () {
            window.ajax({
                type: "POST",
                data: navigator.value(),
                url: '/async/shop/list',
            }).done(function (result) {
                
                if(result && result.status) { 
                    var frag    = document.createElement("div"),
                        select  = null;
                    if(creator) {
                        frag.appendChild(creator.el);
                        creator.open = open;
                    }
                    if(result.items) {
                        for(var i = 0; i < result.items.length; ++i) {
                            var item = new ShopItem(result.items[i]);
                            if(preview && preview.item().id() == item.id() || item.id() == hash) {
                                select = item;
                                hash = null;
                            }
                            item.open = open;
                            frag.appendChild(item.el);
                        }
                    }

                    container.replaceChild(frag, view);
                    view = frag;
                    if(select) {
                        open(select);
                    } else {
                        preview = null;
                    }
                }
                window.events.emit("update-ordered");
            });
        }



        self.reload = load_shop_items;
    }

    function ShopNavigator() {
        
        function CategoryDropDownItem (ctl, data) {
            var self        = this,
                container   = ctl.item,
                controller  = ctl.controller,
                title       = document.createElement("div"),
                input       = !window.admin || !data ? null : document.createElement("input"),
                del         = !window.admin || !data ? null : document.createElement("div"),
                changed     = false,
                isnew       = !data || data._id == null,
                deleted     = false;

            container.manager = self;

            title.className = "categoty-title";
            container.appendChild(title);

            self.setValue = function (value) {
                title.innerHTML = value || "";
            }

            self.value = function () {
                return title.innerHTML;
            }

            self.id = function () {
                return data ? data._id : null;
            }

                 
            if(data) {
                controller.setValue(data.title);   
                

                if(window.admin) {
                    if(del) {
                        del.className = "category-remove";
                        del.onclick = function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            container.parentNode.removeChild(container);
                            deleted = true;
                            changed = false;
                        }
                    }

                    if(input) {
                        input.className = "categoty-title header-text";
                    }

                    self.forceEditStart = function () {
                        if(input) {
                            container.replaceChild(input, title);
                            container.appendChild(del);
                            input.value = title.innerHTML;
                            input.onchange = function () {
                                if(!deleted) {
                                    changed = true;
                                }
                            }
                        }
                    }

                    self.forceEditEnd = function () {
                        if(input) {
                            input.onchange = null;
                            container.replaceChild(title, input);
                            container.removeChild(del);
                            title.innerHTML = input.value;
                        }
                    }


                    self.save = function (callback) {
                        if(deleted && self.id()) {
                            
                            window.ajax({
                                type: "POST",
                                data: { id : self.id() },
                                url: '/async/category/delete',
                            }).done(callback);

                        } else if (changed) {
                            
                            window.ajax({
                                type: "POST",
                                data: { id : self.id(), title: title.innerHTML },
                                url: '/async/category/save',
                            }).done(callback);
                        } else {
                            
                            callback();
                        }
                    }

                }
            } else {
                language.bind("allitems", ctl);
            }
        }

        function NewCategoryDropDownItem(ctl) {
            var self        = this,
                container   = ctl,
                add         = document.createElement("div");

            add.className = "category-add";

            container.appendChild(add);

            self.el = container;

            add.onclick = function () {
                if(self.create) {
                    self.create();
                }
            }
        };

        var self        = this,
            ctl_view    = null,
            container   = document.getElementById("shop_navigator"),
            categories  = new DropDown({ className : "category-nav", src : "../images/list.png"}),
            cat_add     = null,
            edit        = null,
            inc         = 1,
            sorter      = new DropDown({ className : "sorter-nav"});

        {
            var tmp = sorter.addItem(0);
            tmp.controller.setValue("A  -  Z");
            tmp = sorter.addItem(1);
            tmp.controller.setValue("Z  -  A");
            tmp = sorter.addItem(2);
            language.bind("lowprice", tmp);
            tmp = sorter.addItem(3);
            language.bind("hightprice", tmp);
        }

        function load_items (parent, callback) {
            
            if(window.admin) {
                parent.el.insertBefore(edit, parent.el.firstChild);
            }

            new CategoryDropDownItem(parent.addItem(0));
            
            window.ajax({
                type: "POST",
                data: null,
                url: '/async/category/list',
            }).done(function (result) {
                var items   = [];
                if(result.status) {
                    for(var i = 0; i < result.categories.length; ++i) {
                        var tmp     = parent.addItem(result.categories[i]._id),
                            item    = new CategoryDropDownItem(tmp, result.categories[i]);
                        if(window.admin) {
                            items[items.length] = item;
                        }
                    }
                }
                callback(items);
            });
        } 

        if(window.admin) {

            var items = [];

            function generateId () {
                return String("000000000000000000000000" + (inc++)).slice(-24);
            }

            edit = document.createElement("div"),
            edit.className = "shop-category-edit";

            edit.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                if(edit.hasAttribute("open")) {
                    edit.removeAttribute("open");
                    categories.el.removeAttribute("edit-mode");
                    categories.close();
                    categories.el.removeChild(edit);
                    cat_add = null;
                    (function (values, callback) {
                        var current     = 0,
                            total       = values.length,
                            complete    = function (tmp) {
                                
                                if(++current == total) {
                                    callback();
                                } 
                            }
                        if(total > 0) {
                            for(var i = 0; i < total; ++i) {
                                
                                values[i].forceEditEnd();
                                values[i].save(complete);
                            }
                        } else {
                            callback();
                        }
                    })(items, function () {
                        
                        var tmp = new DropDown({ className : "category-nav", src : "../images/list.png"});
                        load_items(tmp, function (res) {
                            items = res;
                            container.replaceChild(tmp.el, categories.el);
                            categories = tmp;
                            categories.changed = function () {
                                if(ctl_view) {
                                    ctl_view.reload();
                                }
                            }
                            categories.setValue(0);
                        });
                    });
                } else {
                    edit.setAttribute("open",true);
                    categories.el.setAttribute("edit-mode", true);

                    cat_add = new NewCategoryDropDownItem(categories.addVirtual());
                    cat_add.create = function () {
                        var parent = cat_add.el.parentNode;
                        parent.removeChild(cat_add.el);
                        var tmp     = categories.addItem(generateId()),
                            item    = new CategoryDropDownItem(tmp, { title : "" });

                        item.forceEditStart();
                        items[items.length] = item;

                        parent.appendChild(cat_add.el);
                    }

                    categories.manual();
                    categories.open();
                    for(var i = 0; i < items.length; ++i) {
                        items[i].forceEditStart();
                    }

                }
            }
        }

        container.appendChild(categories.el);
        container.appendChild(sorter.el);


        categories.changed = function () {
            if(ctl_view) {
                ctl_view.reload();
            }
        }

        sorter.changed = function () {
            if(ctl_view) {
                ctl_view.reload();
            }
        }

        self.setView = function (view) {
            ctl_view = view;
        }   
        
        self.value = function () {
            var filter = categories.value();
            return {
                sort : sorter.value(),
                filter: filter == 0 ? null : filter
            };
        }

        self.el = container;

        load_items(categories, function (res) {
            if(window.admin) {
                items = res;
            }
        });

    }

    function Shop () {

        var self        = this,
            panel       = document.getElementById("shop_panel"),
            nav         = new ShopNavigator(),
            items       = new ShopItemList(nav);

        nav.setView(items);

        self.el = panel;

    }


    window.addEventListener("load", function () {
        window.shop = new Shop();
    });
 
}());
