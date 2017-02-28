(function () {
    "use strict";

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
            data_       = null,
            removed_    = false,
            load_cb_    = null,
            loaded_     = false,
            container_  = new MSDivObject(),
            del_        = window.admin ? document.createElement("div") : null;

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
                e.dataTransfer.setData("target", id_);
            };

            container_.el.ondragover = function (e) {
                e.preventDefault();
            };

            container_.el.ondrop = function (e) { 
                e.preventDefault();
                if(self_.swap) {
                    self_.swap(e.dataTransfer.getData("target"), id_);
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
                    
                    callback(result.id);
                });  
            } else {
                
                callback(id_);
            }
        }

        self_.update = function (new_picture_pack) {
            id_ = new_picture_pack.id;
            temp_ = new_picture_pack.temp;
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
            temp_       = null,
            ready_      = true,
            thumbs_     = {},
            ordered_    = [],
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
                if(preview_.el.hasAttribute("current")){
                    scrollBodyTo(wrapper_);
                }
                preview_.el.setAttribute("current", thumb.id());
            };

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
                    picture_thumb.swap = swap_;
                    picture_thumb.click = present_;
                    temp_.appendChild(picture_thumb.el);
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
            duration    = new MSInputObject({ placeholder : "Duration", className : "text" }),
            price       = new MSInputObject({ placeholder : "Price", className : "text" });

        language.bindInput("duration", duration.el);
        language.bindInput("price", price.el);

        {
            var r   = document.createElement("tr"),
                d   = document.createElement("th"),
                p   = document.createElement("th");

            r.className = "text-invert";

            language.bind("duration", d);
            language.bind("price", p);

            r.appendChild(d);
            r.appendChild(p);
            table.appendChild(r);
        }

        {
            var row     = document.createElement("tr"),
                d       = document.createElement("td"),
                p       = document.createElement("td");


            d.appendChild(duration.el);
            row.appendChild(d);
            p.appendChild(price.el);
            row.appendChild(p);
            table.appendChild(row);
        }

        table.className = "single-item";

        self.el = table;

        self.value = function () {
            return { duration: duration.value(), price: price.value() };
        }

        self.setValue = function (data) {
            duration.setValue(data.duration);
            price.setValue(data.price);
        }
    }


    function UserPriceTag () {

        var self    = this,
            table   = document.createElement("table"),
            r       = document.createElement("tr"),
            q       = document.createElement("th"),
            p       = document.createElement("th"),
            dr      = document.createElement("tr"),
            dq      = document.createElement("td"),
            dp      = document.createElement("td");

        r.className = "text-invert";

        language.bind("duration", q);
        language.bind("price", p);

        r.appendChild(q);
        r.appendChild(p);
        
        table.appendChild(r);

        dr.appendChild(dq);
        dr.appendChild(dp);
        
        table.appendChild(dr);

        dq.setAttribute("currency", "godz.");
        dp.setAttribute("currency", "zł");

        self.el = table;

        self.value = function () {
            return current;
        }

        self.setValue = function (data) {
            dq.innerHTML = data.duration;
            dp.innerHTML = data.price;
        }
    }


    function PriceControl (data) {

        var self        = this,
            container   = document.createElement("div"),
            controls    = window.admin ? new SinglePriceTag() : new UserPriceTag();


        container.appendChild(controls.el);

        container.className = "price text advert-hide";

        self.el = container;

        self.value = function () {
            return controls.value();
        }

        self.setValue = function (data) {
            if(data) {
                controls.setValue(data);
            }
        }

    }

    function DetailsContact() {
        var self        = this,
            container   = document.createElement("div"),
            title       = document.createElement("div"),
            name        = document.createElement("input"),
            email       = document.createElement("input"),
            message     = new MSInputObject({ className: "message text", multiline : true, user: true });

        container.className = "workshop-item-contact-panel";
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

    function TimetableManager() {

        var self        = this,
            timetable   = document.createElement("div"),
            add_btn     = window.admin ? document.createElement("div") : null,
            add_input   = window.admin ? document.createElement("input") : null,
            ctl_picker  = window.admin ? new Flatpickr(add_input, {
                locale: Flatpickr.l10ns.pl, 
                enableTime: true,
                minDate: new Date(),
                time_24hr: true,
                dateFormat: "F j, Y H:i",
                onClose: function(dates) {
                    ctl_picker.clear();
                    ctl_picker.jumpToDate(new Date());
                    if(dates.length == 1) {
                        self.createTimetable(dates[0]);
                    }
                }
            }) : null,
            dates = [],
            removeItem = window.admin ? function (item) {
                timetable.removeChild(item.el);
                var idx = dates.indexOf(item);
                if(idx >= 0) {
                    dates.splice(idx, 1);
                }
            } : null;

        function TimetableEntry(date) {
            var self        = this,
                container   = document.createElement("div"),
                input       = window.admin ? document.createElement("input") : document.createElement("div"),
                picker      = window.admin ? new Flatpickr(input, {
                    locale: Flatpickr.l10ns.pl, 
                    enableTime: true,
                    minDate: new Date(),
                    time_24hr: true,
                    dateFormat: "F j, Y H:i",
                    onChange: function (dates) {
                        if(dates.length == 1) {
                            current = dates[0];
                        }
                    }
                }) : null,
                rm_btn      = window.admin ? document.createElement("div") : null,
                current     = date;

            container.className = "timetable-element";
            input.className = "timetable-element-input text-invert";
            container.appendChild(input);
            if(window.admin) {
                rm_btn.className = "timetable-element-remove";
                container.appendChild(rm_btn);
                picker.setDate(current);
                rm_btn.onclick = function () {
                    self.remove(self);
                }
            } else {

                var str =   Flatpickr.l10ns.pl.months.longhand[current.getMonth()] + " " + 
                            current.getDate() + ", " +
                            current.getFullYear() + " " +
                            current.getHours() + ":" +
                            (current.getMinutes() < 10 ? "0" + current.getMinutes() : current.getMinutes());

                input.innerHTML = str;
            }


            self.value = function () {
                return current.valueOf();
            }

            self.el = container;

        }


        timetable.className = "timetable-list";

        if(window.admin) {
            add_btn.className = "timetable-add"
            add_btn.appendChild(add_input);

            timetable.appendChild(add_btn);
        }

        self.createTimetable = function (datetime) {
            var elem = new TimetableEntry(datetime);
            dates[dates.length] = elem;
            if(window.admin) {
                elem.remove = removeItem;
                timetable.insertBefore(elem.el, add_btn);   
            } else {
                timetable.appendChild(elem.el);
            }
        }

        self.value = function () {
            var values  = [],
                l       = dates.length;

            for(var i = 0; i < l; i++) {
                values[i] = dates[i].value();
            }

            return values;
        }

        self.setValue = function (data) {
            var l       = data ? data.length : 0;
            for(var i = 0; i < l; i++) {
                self.createTimetable(new Date(data[i]));
            }
        }

        self.el = timetable;

    }


    function Location () {

        var self        = this,
            container   = document.createElement("div"),
            map_div     = document.createElement("div"),
            map         = null,
            current_pid = null;

        container.className = "location-control";
        map_div.className = "location-map";

        container.appendChild(map_div);

        function Map(elem, current_location) {

            var self        = this,
                msart       = "ChIJGZKqLO0yGUcRDo5fRhYCJ1I",
                is_valid    = current_location ? true : false,
                input       = window.admin ? document.createElement("input") : null,
                info        = document.createElement("div"),
                name        = document.createElement("div"),
                save_btn    = window.admin ? document.createElement("div") : null,
                address     = document.createElement("div"),
                website     = document.createElement("a"),
                map_obj     = new google.maps.Map(elem, {
                    center: { lat: 52.160418, lng: 21.022140 },
                    zoom : 19,
                    mapTypeControl : false,
                    fullscreenControl: false
                }),
                marker      = new google.maps.Marker({map : map_obj}),
                auto_done   = window.admin ? new google.maps.places.Autocomplete(input) : null,
                service     = new google.maps.places.PlacesService(map_obj);
                

            
            info.className = "location-info";
            name.className = "name text-invert";
            address.className = "address text";
            website.className = "website text";
            website.target = "_blank";

                        if(window.admin) {
                input.className = "location-input text";
                save_btn.className = "save";
                save_btn.setAttribute("checked", 0);

                save_btn.onclick = function () {
                    var val = parseInt(save_btn.getAttribute("checked"));
                    if(val == 0) {
                        var place = marker.getPlace();
                        if(place) {
                            current_pid = place.placeId;
                            input.setAttribute("disabled",1);
                            save_btn.setAttribute("checked", 1);
                        }
                    } else {
                        current_pid = null;
                        input.removeAttribute("disabled");
                        save_btn.setAttribute("checked", 0);
                    }
                }


                info.appendChild(input);
                name.appendChild(save_btn);
                auto_done.bindTo('bounds', map_obj);
                auto_done.addListener('place_changed', function() {
                    var place = auto_done.getPlace();
                    if (!place.geometry) {
                        return;
                    }
                    map_obj.setCenter(place.geometry.location);

                    // Set the position of the marker using the place ID and location.
                    marker.setPlace({
                        placeId: place.place_id,
                        location: place.geometry.location
                    });
                    marker.setVisible(true);
                    map_obj.setZoom(17);

                    

                    name.innerHTML = place.name;
                    name.appendChild(save_btn);
                    address.innerHTML = place.formatted_address;
                    website.innerHTML = place.website;
                    website.href = place.website;
                });
            }

            info.appendChild(name);
            info.appendChild(address);
            info.appendChild(website);

            map_obj.controls[google.maps.ControlPosition.TOP_LEFT].push(info);
            
            service.getDetails({placeId : current_location || msart }, function (place, status) {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                         
                    marker.setPlace({
                        placeId: place.place_id,
                        location: place.geometry.location
                    });
                    marker.setVisible(true);
                    map_obj.setZoom(19);
                    map_obj.setCenter(place.geometry.location);
                   

                    name.innerHTML = place.name;
                    if(window.admin) {
                        name.appendChild(save_btn);
                    }
                    address.innerHTML = place.formatted_address;
                    website.innerHTML = place.website;
                    website.href = place.website;
                    if(window.admin && is_valid){
                        input.setAttribute("disabled",1);
                        save_btn.setAttribute("checked", 1);
                    }
                }

            });


            self.update = function () {
                google.maps.event.trigger(map, 'resize');
            }
        }


        self.el = container;

        self.show = function () {
            async(function () {
                map_div.style.width = container.offsetWidth + "px";
                map_div.style.height = container.offsetHeight + "px";
                map = new Map(map_div, current_pid);

                window.addEventListener("resize", function () {
                    map_div.style.width = container.offsetWidth + "px";
                    map_div.style.height = container.offsetHeight + "px";
                    map.update();
                });

            });

        }

        self.value = function () {
            return current_pid;
        }

        self.setValue = function (data) {
            current_pid = data;
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
            hprice      = document.createElement("div"),
            price       = new PriceControl({ type : 0 }),
            htimetable  = document.createElement("div"),
            timetable   = new TimetableManager(),
            hlocation   = document.createElement("div"),
            location    = new Location(),
            hdesc       = document.createElement("div"),
            desc        = new MSInputObject({ className: "desc text", placeholder: "Description", multiline : true }),
            del_btn     = window.admin && item.id() ? document.createElement("div") : null,
            act_btn     = document.createElement("div"),
            cl_btn      = document.createElement("div"),
            collective  = 
            {
                title: title,
                price: price,
                timetable: timetable,
                location: location,
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


        hprice.className = "text-header header-text";
        language.bind("price", hprice);
        view.appendChild(hprice);
        view.appendChild(price.el);


        htimetable.className = "text-header header-text";
        language.bind("timetable", htimetable);
        view.appendChild(htimetable);
        view.appendChild(timetable.el);

        hlocation.className = "text-header header-text";
        language.bind("location", hlocation);
        view.appendChild(hlocation);
        view.appendChild(location.el);

        hdesc.className = "text-header header-text";
        language.bind("description", hdesc);
        language.bindInput("description", desc.el);

        view.appendChild(hdesc);
        view.appendChild(desc.el);

        if(!window.admin) {
            contact = new DetailsContact();
            view.appendChild(contact.el);
        }

        act_btn.className = "action-btn no-select text-invert";
        language.bind(window.admin ? "save" : "send", act_btn);
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
            } else {
                var data = contact.value();
                data.data = {
                    id : item.id(),
                    preview : item.preview(),
                    title : title.value()
                }
                self.contact(data, function (result) {
                    if(!result.status) {
                        contact.error(result.error);
                    }
                });
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

        self.el = container;

        self.show = function () {
            location.show();
        };

        self.init = function () {
        }


        self.setValue = function (data) {
            for(var key in collective) {
                if(collective.hasOwnProperty(key) && collective[key]) {
                    
                    collective[key].setValue(data[key]);
                }
            }
        } 

    }

    function PreviewPanel(item, parent) {

        function Controller (c_item, container) {
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

            self.load = function (callback) {
                if(item.id()) {
                    window.ajax({
                        type: "POST",
                        data: { id : item.id() },
                        url: '/async/workshop/load',
                    }).done(function (result) {
                        if(result.workshop) {
                            details.setValue(result.workshop);
                            viewer.beginAdd();
                            for(var i in result.workshop.images) {
                                viewer.add(new PictureThumb( { id : result.workshop.images[i] }));
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
                            url: '/async/workshop/save'
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
                                        parent.reload();
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
                        url: '/async/workshop/delete'
                    }).done(function (result) {
                        if(result.status) {
                            parent.removeItem(c_item);
                            self.close();
                        }
                    });
                }
            }

        }

        var self_       = this,
            container_  = document.createElement("div"),
            view_       = document.createElement("div"),
            controller  = new Controller(item, view_);

        function closePanel(callback, opt) {
            async(self_.close, callback ? [callback, opt] : null);
        }

        controller.close = closePanel;

        if(window.admin) {
            container_.className = "workshop-item-container edit"; 
        } else {
            container_.className = "workshop-item-container";    
        }

        container_.style.display = "none";

        view_.className = "workshop-item-view";

        controller.create();

        container_.appendChild(view_);

        this.el = container_;

        this.id = function () {
            return item.id();
        } 

        this.item = function () {
            return item;
        }

        this.replace = function (n_item, callback) {
            item = n_item;
            var tmp = new Controller(item, view_);
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
                                async(controller.show);
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
                        async(controller.show);
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

    function NewWorkshop() {

        var self        = this,
            item        = document.createElement("div"),
            item_int    = document.createElement("div"),
            item_img    = document.createElement("div");

        item.className = "workshop-item-new";
        item_int.className = "workshop-item-internal";
        item.appendChild(item_int);
        {
            item_img.className = "workshop-item-image";
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

    function Workshop(data) {

        var self        = this,
            item        = document.createElement("div"),
            item_int    = document.createElement("div"),
            title_      = document.createElement("div"),
            item_img    = new MSDivObject(),
            preview_id  = data.preview,
            price_      = document.createElement("div");

        item.id = data._id;
        if(window.admin) {
            item.className = "workshop-item edit no-select";   
        } else {
            item.className = "workshop-item no-select"; 
        }
        item_int.className = "workshop-item-internal";
        item.appendChild(item_int);
        {
            item_img.el.className = "workshop-item-image";
            item_int.appendChild(item_img.el);

            title_.className = "workshop-item-title text";
            item_int.appendChild(title_);
            
            price_.className = "workshop-item-price text";
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
            price_.innerHTML = Math.round(data.price.price);
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
            preview_id = new_data.preview;
            item_img.loadImage({ 
                url : "/async/preview/load/" + preview_id, 
                color: "#e0e0e0", 
                shadow: true, 
                width: 3 
            });
            title_.innerHTML = new_data.title;
            if(new_data.price) {
                price_.innerHTML = Math.round(new_data.price.price);
                price_.setAttribute("currency", "zł");
            } else {
                price_.innerHTML = null;
                price_.removeAttribute("currency");
            }
        }

        item.onclick = function () {
            self.open(self);  
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
        }

        self.el = item;
    }


    function WorkshopItemList (panel) {
        var self        = this,
            container   = document.getElementById("workshop_item_view"),
            view        = document.createElement("div"),
            creator     = window.admin ? new NewWorkshop() : null,
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
                    preview.replace(item, function () {
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


        function load_workshops () {
            window.ajax({
                type: "POST",
                data: {},
                url: '/async/workshop/list',
            }).done(function (result) {
                if(result && result.status) { 
                    var frag    = document.createElement("div"),
                        select  = null;
                    if(creator) {
                        frag.appendChild(creator.el);
                        creator.open = open;
                    }
                    if(result.workshops) {
                        for(var i = 0; i < result.workshops.length; ++i) {
                            var item = new Workshop(result.workshops[i]);
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
            });
        }



        self.reload = load_workshops;
        load_workshops();
    }

    

    function Workshops () {

        var self        = this,
            panel       = document.getElementById("workshop_panel"),
            items       = new WorkshopItemList(panel)

        self.el = panel;

    }


    window.addEventListener("load", function () {
        window.workshops = new Workshops();
    });
 
}());
