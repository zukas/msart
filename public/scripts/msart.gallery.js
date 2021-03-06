(function () {
	"use strict";
	function GalerryItem(id) {
		var self 	= this,
            id_     = id,
			item 	= new MSDivObject(),
			remove 	= window.admin ? document.createElement("div") : null;

		item.el.className = "gallery-thumb";

		if(remove) {
			remove.className = "gallery-thumb-remove";
			item.el.appendChild(remove);

			remove.onclick = function () {
				if(self.remove) {
					self.remove(self);
				} 
			}
		}

        item.el.onclick = function () {
            if(self.click) {
                self.click(self);
            }
        }

        if(window.admin) {

            item.el.setAttribute("draggable", true);
            var top     = document.getElementById("content_scroll_top"),
                bottom  = document.getElementById("content_scroll_bottom"),
                content = document.getElementById("content-wrapper"),
                anim    = false,
                run     = function (val) {
                    if(anim) {
                        var top = content.scrollTop;                        
                        morpheus.tween(5,
                        function (ratio) {
                            if(ratio == 1) {
                                 async(run, [val]);
                            }
                            var value = top + val * ratio;
                            if(value >= 0 && value <= content.scrollHeight) {
                                content.scrollTop = value;
                            }  
                        });
                    }
                }

            top.ondragenter = function (e) {
                e.preventDefault();
                anim = true;
                run(-10);
            }

            top.ondragleave = function (e) {
                e.preventDefault();
                anim = false;
            }

            bottom.ondragenter = function (e) {
                e.preventDefault();
                anim = true;
                run(10);
            }

            bottom.ondragleave = function (e) {
                e.preventDefault();
                anim = false;
            }


            item.el.ondragstart = function (e) {
                e.dataTransfer.setData("target", id_);
                top.setAttribute("enabled",true);
                bottom.setAttribute("enabled",true);
                if(self.beginMove) {
                    e.dataTransfer.setData("target", id_);
                    self.beginMove(self);
                }
            };

            item.el.ondragend = function (e) {
                e.preventDefault();
                top.removeAttribute("enabled");
                bottom.removeAttribute("enabled");
                if(self.endMove) {
                    self.endMove(self);
                }
            }

            item.el.ondragover = function (e) {
                e.preventDefault();
                if(self.hoverTarget && e.target.className == "gallery-thumb") {
                    self.hoverTarget(self, e.layerX);
                }
            };
        }

		self.el = item.el;

		self.id = function () {
			return id_;
		}

        self.change = function (nid) {
            id_ = nid;
            item.loadImage({
                url : "/async/thumb/load/" + id_,
                color: "#e0e0e0", 
                shadow: true, 
                radius: 18, 
                width: 4, 
                length: 16, 
                lines: 11, 
                speed: 0.75 
            });
        }

		item.loadImage({
            url : "/async/thumb/load/" + id_,
            color: "#e0e0e0", 
            shadow: true, 
            radius: 18, 
            width: 4, 
            length: 16, 
            lines: 11, 
            speed: 0.75 
        });

	}

    function Gallery () {

        var self        = this,
            panel       = document.getElementById("gallery_panel"),
            content     = document.getElementById("content-wrapper"),
            create      = window.admin ? new FileUpload({id : "gallery_thumb_new", className : "gallery-thumb", multiple: true}) : null,
            gallery     = new MSDivObject(document.getElementById("thumbs_container")),
            viewport    = new MSDivObject(document.getElementById("gallery_view").firstElementChild),
            controls    = {
                prev : document.getElementById("gallery_prev_page"),
                data : document.getElementById("gallery_page_info"),
                next : document.getElementById("gallery_next_page")
            },
            pages       = {
                current: 1,
                total : 1,
                thumbs : 0
            },
            thumbs      = {},
            drop        = window.admin ? new DropInsertManager() : null,
            init        = function (thumb) {
                if(thumb) {
                    set(thumb);
                }
            },
            set         = function (thumb) {
                viewport.loadImage({
                    url : "/async/images/load/" + thumb.id() + "?height=700",
                    color: "#e0e0e0", 
                    shadow: true, 
                    radius: 22, 
                    width: 6, 
                    length: 20, 
                    lines: 13, 
                    speed: 0.75 
                });
            },
            remove      = function (item) {
                window.ajax({
                    type: "POST",
                    data: { id : item.id() },
                    url: '/async/gallery/delete'
                }).done(function (result) {
                    if(result.status) {
                        delete thumbs[item.id()];
                        gallery.el.removeChild(item.el);
                    }
                });
            },
            swap        = function (i, j) {
                if(i != j) {
                    var thumb = thumbs[i];
                    thumb.change(j);
                    thumbs[i] = thumbs[j];
                    thumbs[j] = thumb;
                    thumbs[i].change(i);
                    window.ajax({
                        type: "POST",
                        data: { one : i, two : j },
                        url: '/async/gallery/swap'
                    }); 
                }
            };
       
        function fit() {
            var nodes   = gallery.el.childNodes,
                count   = nodes.length;
            pages.current = 1;
            pages.total = 1;
            if(count > 0) {
                var i;
                for(i = 0; i < count; ++i) {
                    if(nodes[i].style.display.length == 0) {
                        break;
                    }
                }
                var iw      = nodes[i].offsetWidth + 6,
                    ih      = nodes[i].offsetHeight + 6,
                    cw      = gallery.el.offsetWidth - 2,
                    ch      = gallery.el.offsetHeight - 2;

                var wf  = Math.floor(cw / iw);
                var hf  = Math.floor(ch / ih);
                pages.thumbs = wf * hf;
                pages.total = Math.ceil(count / pages.thumbs);
                
                for(i = Math.min(pages.thumbs, count) - 1; i >= 0; --i) {
                    if(nodes[i].style.display.length == 0) {
                        continue;
                    }
                    async(function(item) {
                        item.style.display = null;
                    }, [nodes[i]]);
                    
                } 

                for(i = Math.min(pages.thumbs, count); i < count; ++i) {
                    if(nodes[i].style.display.length > 0) {
                        continue;
                    }
                    async(function(item) {
                        item.style.display = "none";
                    }, [nodes[i]]);
                } 
            }
            controls.prev.setAttribute("disabled", true);
            if(pages.total == 1) {
                controls.next.setAttribute("disabled", true);
            } else {
                controls.next.removeAttribute("disabled");
            }
            controls.data.innerHTML = pages.current + " / " + pages.total;
        }

        if(window.admin) {
            drop.insertBefore = function (source, target) {
                window.ajax({
                    type: "POST",
                    data: { source: source.id(), target: target.id(), offset: 0 },
                    url: '/async/gallery/move'
                }).done(function (result) {
                    if(result.status) {
                        gallery.el.removeChild(source.el);
                        gallery.el.insertBefore(source.el, target.el);
                    } else {
                        // console.log(result);
                    }
                }); 
            }

            drop.insertAfter = function (source, target) {
                window.ajax({
                    type: "POST",
                    data: { source: source.id(), target: target.id(), offset: 1 },
                    url: '/async/gallery/move'
                }).done(function (result) {
                    if(result.status) {
                        gallery.el.removeChild(source.el);
                        var next = target.el.nextElementSibling;
                        if(next) {
                            gallery.el.insertBefore(source.el, next);
                        } else {
                            gallery.el.appendChild(source.el);
                        }
                    } else {
                        // console.log(result);
                    }
                }); 
            } 
        } else {

            window.addEventListener("resize", fit); 
            controls.prev.onclick = function () {
                if(controls.prev.hasAttribute("disabled")) {
                    return;
                }
                var nodes   = gallery.el.childNodes,
                    count   = nodes.length;

                for(var i = Math.min(pages.thumbs * pages.current, count) - 1; i >= pages.thumbs * (pages.current - 1); --i) {
                    async(function(item) {
                        item.style.display = "none";
                    }, [nodes[i]]);
                } 

                pages.current -= 1;
                if(pages.current == 1) {
                    controls.prev.setAttribute("disabled", true);
                }
                controls.next.removeAttribute("disabled");
                controls.data.innerHTML = pages.current + " / " + pages.total;

                for(var i = Math.min(pages.thumbs * pages.current, count) - 1; i >= pages.thumbs * (pages.current - 1); --i) {
                    async(function(item) {
                        item.style.display = null;
                    }, [nodes[i]]);
                } 

            }

            controls.next.onclick = function () {
                if(controls.next.hasAttribute("disabled")) {
                    return;
                }
                var nodes   = gallery.el.childNodes,
                    count   = nodes.length;

                for(var i = pages.thumbs * (pages.current - 1); i < pages.thumbs * pages.current &&  i < count; ++i) {
                    async(function(item) {
                        item.style.display = "none";
                    }, [nodes[i]]);
                } 

                pages.current += 1;
                if(pages.current == pages.total) {
                    controls.next.setAttribute("disabled", true);
                }
                controls.prev.removeAttribute("disabled");
                controls.data.innerHTML = pages.current + " / " + pages.total;

                for(var i = pages.thumbs * (pages.current - 1); i < pages.thumbs * pages.current &&  i < count; ++i) {
                    async(function(item) {
                        item.style.display = null;
                    }, [nodes[i]]);
                } 
            }
        } 


        if(create) {
            gallery.el.appendChild(create.el);
            create.preview = function (files) {
                for(var i = 0; i < files.length; ++i) {

                    var fd = new FormData();
                    fd.append("file", files[i]);
                
                    window.ajax({
                        type: "POST",
                        data: fd,
                        files : true,
                        url: '/async/gallery/save'
                    }).done(function (result) {
                        if(result.status) {
                            var item = new GalerryItem(result.id);
                            thumbs[item.id()] = item;
                            item.click = set;
                            item.remove = remove;
                            if(window.admin) {
                                item.beginMove = drop.beginMove;
                                item.hoverTarget = drop.hoverTarget;
                                item.endMove = drop.endMove;
                            }
                            if(create.el.nextSibling) {
                                gallery.el.insertBefore(item.el, create.el.nextSibling);
                            } else {
                                gallery.el.appendChild(item.el);
                            }
                            set(item);
                        } else {
                            // console.log(result);
                        }
                    }); 
                }
            }
        }

        window.ajax({
            type: "POST",
            url: '/async/gallery/load'
        }).done(function (result) {     
            if(result.status) {
                var frag    = document.createDocumentFragment(),
                    thumb   = null;

                for(var i = 0; i < result.result.length; ++i) {
                    var item = new GalerryItem(result.result[i].id);
                    thumbs[item.id()] = item;
                    item.click = set;
                    item.remove = remove;
                    if(window.admin) {
                        item.beginMove = drop.beginMove;
                        item.hoverTarget = drop.hoverTarget;
                        item.endMove = drop.endMove;
                    }
                    frag.appendChild(item.el);
                    if(!thumb) {
                        thumb = item;
                    }
                }
                gallery.el.appendChild(frag); 
                init(thumb);
                if(!window.admin) {
                    fit();
                }

            }
        });
    }


    window.addEventListener("load", function () {
        window.gallery = new Gallery();
    })
 
}());