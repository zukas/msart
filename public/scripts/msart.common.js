(function (root) {
    "use strict";

    root.hashCode = function(str) {
      var hash = 0, i, chr, len;
      if (str.length === 0) return hash;
      for (i = 0, len = str.length; i < len; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    };

    root.MSInputObject = function (options) {

        var self    = this;

        self.__get_value = null;
        self.__set_value = null;

        options = options || {};

        if(window.admin || options.user){
            if(options.multiline) {
                self.el = document.createElement("textarea");
                var offset  = self.el.offsetHeight - self.el.clientHeight,
                    length  = 0,
                    height  = self.el.clientHeight,
                    reflow  = function () {
                        async(function () {
                            var tmp = self.el.value.length;
                            if(tmp < length){
                                self.el.style.height = "auto";
                            }
                            var hi = self.el.scrollHeight + offset;
                            if(hi > 0) {
                                self.el.style.height = hi + "px"; 
                            }
                            length = tmp;
                            if(hi != height) {
                                height = hi;
                            }
                        });
                    }

                self.__get_value = function () {
                    return self.el.value;
                }
                self.__set_value = function (text) {
                    self.el.value = text;
                    reflow();
                }

                self.el.addEventListener("keydown", reflow);
                self.el.addEventListener("keyup", reflow);

            } else {
                self.el = document.createElement("input");
                self.el.setAttribute("type", "text");

                self.__get_value = function () {
                    return self.el.value;
                }
                
                self.__set_value = function (text) {
                    self.el.value = text;
                }
            }

            self.el.onchange = function () {
                if(self.onchange) {
                    self.onchange(self);
                }
            }
            if(options.placeholder) {
                this.el.setAttribute("placeholder", options.placeholder);
            }
        } else {
            self.el = document.createElement("div");

            self.__get_value = function () {
                return self.el.innerHTML;
            }

            self.__set_value = function (text) {
                self.el.innerHTML = text;
            }
        }

        if(options.className) {
            self.el.className = options.className;
        }
        if(options.id) {
            self.el.id = options.id;
        }
    }

    MSInputObject.prototype.value = function () {
        return this.__get_value() || "";
    }

    MSInputObject.prototype.setValue = function (text) {
        this.__set_value(text || "");
    }


    root.MSDivObject = function (div) {
        this.el = div || document.createElement("div");
    } 

    MSDivObject.prototype.addClass = function(class_name) {
        if(this.el.className.indexOf(class_name) == -1) {
            this.el.className = this.el.className.concat(" ", class_name);
        }
    }

    MSDivObject.prototype.removeClass = function(class_name) {
        if(this.el.className.indexOf(class_name) > -1) {
            this.el.className = this.el.className.replace(class_name, "").replace("  ", " ").trim();
        }
    }

    MSDivObject.prototype.setPlaceholder = function (text) { 
        if(window.admin) {
            var self    = this,
                wrapper = document.createElement("span"),
                exist   = true;

            self.has_placeholder = true;
            wrapper.className = "placeholder";
            wrapper.innerHTML = text;

            if(self.el.innerHTML.length == 0) {
                self.el.appendChild(wrapper);
                self.addClass("placeholder-visible");
            }

            self.el.addEventListener("text-changed", function () {
                if(self.el.innerHTML.length == 0) {
                    if(!exist) {
                        self.addClass("placeholder-visible");
                        exist = true;
                    }
                    self.el.appendChild(wrapper);
                } else if(exist) {
                    exist = false;
                    self.removeClass("placeholder-visible");
                }
            });

            self.el.addEventListener("focus", function () {
                if(exist) {
                    self.el.removeChild(wrapper); 
                    self.removeClass("placeholder-visible");
                    exist = false;
                }
            });

            self.el.addEventListener("blur", function () {
                if(self.innerHTML.length == 0) {
                    self.el.appendChild(wrapper);
                    self.addClass("placeholder-visible");
                    exist = true;
                }
            });

            self.has_text = function () {
                return !exist;
            }
        }
    }

    MSDivObject.prototype.refresh = function () { 
        if(this.has_placeholder || this.track_change) {
            this.el.dispatchEvent(new Event("text-changed"));
        }
    }

    MSDivObject.prototype.setText = function (text) { 
        if(text) {
            this.el.innerHTML = text;
            if(this.has_placeholder || this.track_change) {
                this.el.dispatchEvent(new Event("text-changed"));
            } 
        }
    }

    MSDivObject.prototype.getText = function () {
        if(this.has_placeholder) {
            if(this.has_text()) {
                return this.el.innerHTML;
            } else {
                return "";
            }
        } else {
            return this.el.innerHTML;
        }
    } 

    MSDivObject.prototype.textEdit = function (options) {
        if(window.admin) {
            var self    = this;

            options = options || {};
            options.textItem = options.textItem || self;

            self.el.addEventListener("click", function () {
                if(self.in_edit) return;
                self.in_edit = true;
                var current_    = options.textItem.getText(),
                    input_      = options.multiline ? 
                                document.createElement("textarea") :
                                document.createElement("input");

                if(options.multiline && options.autosize) {
                    input_.addEventListener("keydown", function () {
                        async(function(){
                            if(input_) {
                                input_.style.height = input_.scrollHeight + "px";
                            }
                        });
                    });
                } 
                if(!options.multiline) {
                    input_.type = "text"
                }
                input_.className = "inplace-text-edit"
                input_.value = current_;
                input_.style.width = (self.el.offsetWidth - (options.offsetWidth || 0)) + "px";
                input_.style.height = (self.el.offsetHeight - (options.offsetHeight || 0)) + "px";

                self.el.innerHTML = "";
                self.el.appendChild(input_);
                input_.focus();

                input_.onblur = function () {
                    options.textItem.setText(input_.value);
                    input_ = null;
                    self.in_edit = false;
                    if(options.textItem != self) {
                        self.el.innerHTML = "";
                        self.el.appendChild(options.textItem.el);
                        self.refresh();
                    }
                }
            });
        }
    }

    MSDivObject.prototype.loadImage = function(options) {
        var self    = this,
            url     = options.url;

        async(function(){
            self.el.style.backgroundImage = "url(" + url + ")";   
        });

        // delete options.url;
        // img.src = url;
        // if(img.complete) {
        //     self.el.style.backgroundImage = "url(" + url + ")";
        // } else {
        //     spinner = new Spinner(options);
        //     spinner.spin(self.el);
        //     img.onload = function () {
        //         self.el.style.backgroundImage = "url(" + url + ")";
        //         spinner.stop();
        //     }
        // }
    }

    root.FileUpload = function (options) {
        var self_       = this,
            container_  = document.createElement("div"),
            upload_     = document.createElement("input");

        options = options || { multiple : false };

        if(options.id) {
            container_.id = options.id;
        }
        if(options.className) {
            container_.className = options.className;
        }
        upload_.type = "file";
        upload_.name = "file";
        upload_.accept = "image/*";
        upload_.multiple = options.multiple;

        container_.appendChild(upload_);

        upload_.onchange = function (eve) {
            if(self_.preview) {
                var files = eve.target.files;
                self_.preview(files);
            }
        }

        self_.el = container_;
    }

    root.DropDown = function (options, element) {


        function applyValue(control, value) {
            if(control.manager) {
                control.manager.setValue(value);
            } else if(control.firstChild && control.firstChild.nodeType == 3) {
                control.firstChild.nodeValue = value;
            } else {
                var txt = document.createTextNode(value);
                if(control.firstChild) {
                    control.insertBefore(txt, control.firstChild)
                } else {
                    control.appendChild(txt);
                }
            }
        }

        function DropDownValue () {
            var self    = this,
                val     = null,
                ctl     = [];

            self.bind = function (control) {
                ctl[ctl.length] = control;
                if(val) {
                    applyValue(control, val);
                }
            }

            self.unbind = function (control) {
                var idx = ctl.indexOf(control);
                if(idx >= 0) {
                    ctl.splice(idx, 1);
                }
            }

            self.setValue = function (value) {
                val = value;
                if(val) {
                    for(var i = 0; i < ctl.length; ++i) {
                        applyValue(ctl[i], val);
                    } 
                }
            }
        }

        var self        = this,
            container   = element || document.createElement("div"),
            can_show    = !options.adminOnly || window.admin,
            arrow       = can_show ? document.createElement("img") : null,
            list        = can_show ? document.createElement("lu") : null,
            visible     = false,
            locked      = false,
            items       = {},
            current     = null,
            man         = false,
            change      = function (idx) {
                var cont = items[idx];
                if(cont) {
                    if(current) {
                        current.unbind(container);
                    }
                    container.setAttribute("current-data-id", idx);
                    current = cont;
                    current.bind(container);
                    if(can_show && visible) {
                        self.close();
                    }
                    if(self.changed) {
                        async(self.changed,[idx]);
                    }
                }
            };

        container.controller = self;

        self.addItem = function (key, perm) {
            var cont = new DropDownValue(),
                item = null;

            items[key] = cont;
            if(perm) {
                cont.setValue(key);
            }
            if(can_show) {
                item = document.createElement("li");
                item.className = "dropdown-item text-invert";
                item.onclick = function () {
                    if(!man) {
                        change(key);
                    }
                };
                list.appendChild(item);
                cont.bind(item);
            }
            if(!current) {
                change(key);
            }
            return { controller : cont, item: item };
        }

        self.addVirtual = function () {
            var item = document.createElement("li");
            item.className = "dropdown-item virtual text-invert";
            list.appendChild(item);
            return item;
        }

        self.removeVirtual = function (item) {
            if(list.contains(item)) {
                list.removeChild(item);
            }
        }

        if(options.className) {
            if(container.className.length > 0) {
                container.className += " dropdown-container no-select text " + options.className;
            } else {
                container.className = "dropdown-container no-select text " + options.className;
            }
        } else {
            if(container.className.length > 0) {
                container.className += " dropdown-container text";
            } else {
                 container.className = "dropdown-container text";
            }
        }
        if(can_show) {
            arrow.src = options.src || "../images/down.png";
            container.appendChild(arrow);

            list.className = "dropdown-list no-select";
            container.appendChild(list);

            container.onclick = function () {
                if(!man) {
                    if(!locked) {
                        if(self.beforeOpen) {
                            self.beforeOpen();
                        }
                        visible = true;
                        list.style.display = "block";
                    }
                } 
            }

            container.onmouseleave = function () {
                if(!man) {
                    self.close();
                }
            }
        }

        self.el = container;

        self.manual = function () {
            man = true;
        }

        self.auto = function () {
            man = false;
        }

        self.open = function () {
            if(man) {
                visible = true;
                list.style.display = "block";
            }
        }

        self.close = function () {
            if(visible) {
                if(self.beforeClose) {
                    self.beforeClose();
                }
                list.style.right = "-200%";
                async(function () {
                    list.removeAttribute("style");
                });
            }
        }

        self.setText = function (text) {
            applyValue(container, text);
        }

        self.text = function () {
            if(container.firstChild && container.firstChild.nodeType == 3) {
                return container.firstChild.nodeValue;
            } else {
                return "";
            }
        }

        self.value = function () {
            return container.getAttribute("current-data-id");
        }

        self.setValue = function (idx) {
            change(idx);
        }

        self.lock = function () {
            locked = true;
            container.setAttribute("locked", true);
        }

        self.unlock = function () {
            locked = false;
            container.removeAttribute("locked");
        }

    }

    root.classOf = function (value) {
        return /\[object (\w+)\]/.exec(Object.prototype.toString.call(value))[1];
    };

    root.getHeight = function (elm) {
        var elmHeight, 
            elmMargin;
        if(document.all) {// IE
            elmHeight = parseInt(elm.currentStyle.height);
            elmMargin = parseInt(elm.currentStyle.marginTop, 10) + parseInt(elm.currentStyle.marginBottom, 10);
        } else {// Mozilla
            elmHeight = parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('height'));
            elmMargin = parseInt(
                document.defaultView.getComputedStyle(elm, '').getPropertyValue('margin-top')) + 
                parseInt(document.defaultView.getComputedStyle(elm, '').getPropertyValue('margin-bottom'));
        }
        return (elmHeight+elmMargin);
    }

    root.browser = {
        opera : !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0,
        firefox : typeof InstallTrigger !== 'undefined',
        safari : Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
        ie : /*@cc_on!@*/false || !!document.documentMode
    };
    root.browser.chrome = !!window.chrome && !window.browser.opera;

    function Request (options) {

        var self        = this,
            callback    = null,
            req         = new XMLHttpRequest();

        req.open(options.type, options.url, true);

        if(!options.files) {
            req.setRequestHeader("Content-type", "application/json");
        }
        if(options.cache) {
            req.setRequestHeader("Cache-Control", "max-age=86400");
        }
        req.onloadend = function() { 
            if (req.status == 200) {
                if(callback) {
                    callback(JSON.parse(req.responseText));
                }
            } else {
                if(callback) {
                    callback(null);
                }
            }
            req = null;
        }
        if(options.files) {
            req.send(options.data);
        } else {
            req.send(options.data ? JSON.stringify(options.data) : null);
        }

        self.done = function (cb) {
            callback = cb;
        }
    }

    root.ajax = function (options) {
        return new Request(options);
    }

    function margin_top(elem) {
        var style = elem.currentStyle || window.getComputedStyle(elem);
        return Length.toPx(elem, style.marginTop)
    }

    root.scrollBodyTo = function (target) {
        var content     = document.getElementById("content-wrapper"),
            next_top    = parseInt(target.offsetTop - margin_top(target)),
            curr_top    = parseInt(content.scrollTop);

        var parent = target.parentNode;
        while(parent && parent != content) {
            next_top += parseInt(parent.offsetTop - margin_top(parent));
            parent = parent.parentNode;
        }

        if(curr_top != next_top) {
            var ajust = next_top - curr_top;
            morpheus.tween(500,
            function (ratio) {
                var value = curr_top + ajust * ratio;
                if(value >= 0 && value <= content.scrollHeight) {
                    content.scrollTop = value;
                }  
            });
        }
    }

    function SortedArray() {
        var self    = this,
            data    = [],
            compare = function (a, b) {
                return a - b;
            },
            findIdx = function (value, start_p, end_p) {
                var length = data.length;
                var start = start_p == null ? 0 : start_p;
                var end =  end_p == null ? length - 1 : end_p;
                var m = start + Math.floor((end - start)/2);
                
                if(length == 0){
                    return length;
                }
                if(compare(value, data[end]) > 0){
                    return end + 1;
                }
                if(compare(value, data[start]) < 0){
                    return start;
                }
                var res = compare(value, data[m]);
                if(res == 0) {
                    return m;
                }
                if(res < 0){
                    return findIdx(value, start, m - 1);
                }
                if(res > 0){
                    return findIdx(value, m + 1, end);
                }
            }
        self.setCompare = function (comp) {
            if(comp) {
                compare = comp;
            }
        }

        self.insert = function (value) {
            data.splice(findIdx(value), 0, value);
        }

        self.length = function () {
            return data.length;
        }

        self.at = function (idx) {
            return data[idx];
        }

        self.grab = function (idx) {
            return data.splice(0, idx);
        }

        self.data = function () {
            return data;
        }
    }

    function EventLoop (win) {

        var self    = this,
            hrtime  = (function() {
              // Returns the number of milliseconds elapsed since either the browser navigationStart event or 
              // the UNIX epoch, depending on availability.
              // Where the browser supports 'performance' we use that as it is more accurate (microsoeconds
              // will be returned in the fractional part) and more reliable as it does not rely on the system time. 
              // Where 'performance' is not available, we will fall back to Date().getTime().

                var performance = window.performance || {};
                performance.now = (function() {
                    return performance.now    ||
                    performance.webkitNow     ||
                    performance.msNow         ||
                    performance.oNow          ||
                    performance.mozNow        ||
                    function() { return new Date().getTime(); };
                })();    
                return performance.now();         
            }),
            frame   = (function () {
                return  win.requestAnimationFrame       ||
                        win.webkitRequestAnimationFrame ||
                        win.mozRequestAnimationFrame    ||
                        win.msRequestAnimationFrame     ||
                        win.oRequestAnimationFrame      ||
                        function (callback) {
                            win.setTimeout(function () {
                                callback(hrtime());
                            }, 1000 / 60)
                        };
            })(),
            runner  = (function () {
                function Runner () {
                    var self        = this,
                        is_running  = false,
                        tasks       = new SortedArray(),
                        exec        = function (timestamp) {
                            schedule();
                            var i, l;
                            for(i = 0, l = tasks.length(); i < l; ++i) {
                                if(tasks.at(i).timestamp > timestamp) {
                                    break;
                                }
                            }
                            var tmp = tasks.grab(i);
                            for(i = 0, l = tmp.length; i < l; ++i) {
                                tmp[i].func.apply(null, tmp[i].args);
                            } 
                            
                        },
                        schedule    = function () {
                            if(tasks.length() > 0) {
                                
                                frame(exec);  
                            }
                        };

                    tasks.setCompare(function(a,b) {
                        return a.timestamp - b.timestamp;
                    });

                    self.addTask = function (task) {
                        tasks.insert(task);
                        schedule();
                    }
                }
                return new Runner();
            })();

        win.async = function (func, args, delay) {
            if(classOf(func) == "Function" && (!args || classOf(args) == "Array")) {
                runner.addTask({
                    timestamp: delay ? (hrtime() + delay) : 0,
                    func: func,
                    args: args || []
                });
            }
        }
    }

    function EventManager(win) {
        var self        = this,
            handlers    = {};


        win.events = {
            listen : function (event, callback) {
                var funcs = handlers[event] || [];
                funcs[funcs.length] = callback;
                handlers[event] = funcs;
            },
            remove : function (event, callback) {
                var funcs   = handlers[event] || [],
                    idx     = funcs.indexOf(callback);

                if(idx >= 0) {
                    funcs.splice(idx, 1);
                }
            },
            emit : function (event, args) {
                var funcs = handlers[event];
                if(funcs) {
                    for(var i = 0; i < funcs.length; ++i) {
                        win.async(funcs[i], args);
                    }
                }
            }
        }
    }


    root.addEventListener("load", function () {
        new EventLoop(root);
        new EventManager(root);
    });
  
}(this));