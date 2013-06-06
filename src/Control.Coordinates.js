/*
 * L.Control.Coordinates is used for displaying current mouse coordinates on the map.
 */

L.Control.Coordinates = L.Control.extend({
	options: {
		position: 'bottomright',
		decimals:4,
		decimalSeperator:".",
		labelTemplateLat:"Lat: {y}",
		labelTemplateLng:"Lng: {x}",
		labelFormatterLat:undefined,
		labelFormatterLng:undefined,
		enableUserInput:true,
		useDMS:false
	},

	onAdd: function (map) {
		this._map = map;

		var className = 'leaflet-control-coordinates',
			container = this._container = L.DomUtil.create('div', className),
			options = this.options;

		//label containers
		this._labelcontainer = L.DomUtil.create("div", "uiElement label", container);
		this._label=L.DomUtil.create("span", "labelFirst", this._labelcontainer);


		//input containers
		this._inputcontainer = L.DomUtil.create("div", "uiElement input uiHidden", container);
		L.DomUtil.create("span", "", this._inputcontainer).innerHTML=options.labelTemplateLng.replace("{x}","");
		this._inputX=this._createInput("inputX", this._inputcontainer);
		L.DomUtil.create("span", "", this._inputcontainer).innerHTML=options.labelTemplateLat.replace("{y}","");
		this._inputY=this._createInput("inputY", this._inputcontainer);
		L.DomEvent.on(this._inputX, 'keyup', this._handleKeypress, this);
		L.DomEvent.on(this._inputY, 'keyup', this._handleKeypress, this);

		map.on("mousemove", this._update, this);
		map.on('dragstart', this.collapse, this);

		map.whenReady(this._update,this);

		this._showsCoordinates=true;
		if (options.enableUserInput) {
			L.DomEvent.addListener(this._container, "click",this._switchUI,this);
		}

		return container;
	},

	_createInput : function(classname, container) {
		var input = L.DomUtil.create("input", classname, container);
		input.type="text";
		L.DomEvent.disableClickPropagation(input);
		return input;
	},

	_clearMarker : function() {
		this._map.removeLayer(this._marker);
	},

	_handleKeypress : function(e) {
		switch(e.keyCode)
		{
			case 27: //Esc
				this.collapse();
			break;
			case 13: //Enter
				this._handleSubmit();
				this.collapse();
			break;
			default://All keys
				this._handleSubmit();
			break;
		}
	},

	_handleSubmit : function()  {
		var x = L.NumberFormatter.createValidNumber(this._inputX.value,this.options.decimalSeperator);
		var y = L.NumberFormatter.createValidNumber(this._inputY.value,this.options.decimalSeperator);
		if (x!==undefined&&y!==undefined){
			var marker = this._marker;
			if (!marker){
				marker = this._marker= L.marker();
				marker.on("click",this._clearMarker,this);
			}
			marker.setLatLng(new L.LatLng(y, x));
			marker.addTo(this._map);
		}
	},

	expand:function() {
		this._showsCoordinates=false;

		map.off("mousemove", this._update, this);

		L.DomEvent.addListener(this._container,"mousemove",L.DomEvent.stop);
		L.DomEvent.removeListener(this._container, "click",this._switchUI,this);

		L.DomUtil.addClass(this._labelcontainer, "uiHidden");
		L.DomUtil.removeClass(this._inputcontainer, "uiHidden");
	},

	_createCoordinateLabel : function(ll) {
		var opts = this.options,
		x,y;
		if (opts.labelFormatterLng) {
			x=opts.labelFormatterLng(ll.lng);
		}else{
			x=L.Util.template(opts.labelTemplateLng, {
				x:this._getNumber(ll.lng,opts)
			});
		}
		if (opts.labelFormatterLat) {
			y=opts.labelFormatterLng(ll.lat);
		} else {
			y=L.Util.template(opts.labelTemplateLat, {
				y:this._getNumber(ll.lat,opts)
			});
		}
		return x+" "+y;
	},

	_getNumber : function(n,opts){
		var res;
		if (opts.useDMS){
			res=L.NumberFormatter.toDMS(n);
		}else {
			res=L.NumberFormatter.round(n,opts.decimals, opts.decimalSeperator);
		}
		return res;
	},

	collapse:function() {
		if (!this._showsCoordinates) {
			map.on("mousemove", this._update, this);
			this._showsCoordinates=true;
			var opts = this.options;
			L.DomEvent.addListener(this._container, "click",this._switchUI,this);
			L.DomEvent.removeListener(this._container,"mousemove",L.DomEvent.stop);

			L.DomUtil.addClass(this._inputcontainer, "uiHidden");
			L.DomUtil.removeClass(this._labelcontainer, "uiHidden");

			if(this._marker) {
				var m = L.marker(),
				ll=this._marker.getLatLng();
				m.setLatLng(ll);

				var container = L.DomUtil.create("div", "");
				var label=L.DomUtil.create("div", "", container);
				label.innerHTML = this._createCoordinateLabel(ll);

				var close=L.DomUtil.create("a", "", container);
				close.innerHTML="Remove";
				close.href="#";
				var stop = L.DomEvent.stopPropagation;

				L.DomEvent
					.on(close, 'click', stop)
					.on(close, 'mousedown', stop)
					.on(close, 'dblclick', stop)
					.on(close, 'click', L.DomEvent.preventDefault)
					.on(close, 'click', function(){
						this._map.removeLayer(m);
					},this);

				m.bindPopup(container);
				m.addTo(this._map);
				this._map.removeLayer(this._marker);
				this._marker=null;
			}
		}
	},

	_switchUI : function(evt){
		L.DomEvent.stop(evt);
		L.DomEvent.stopPropagation(evt);
		L.DomEvent.preventDefault(evt);
		if (this._showsCoordinates) {
			//show textfields
			this.expand();
		}else {
			//show coordinates
			this.collapse();
		}
	},

	onRemove: function (map) {
		map.off("mousemove", this._update, this);
	},

	_update: function (evt) {
		var pos=evt.latlng,
		opts = this.options;
		if (pos) {
			this._currentPos=pos;
			this._inputY.value=L.NumberFormatter.round(pos.lat,opts.decimals, opts.decimalSeperator);
			this._inputX.value=L.NumberFormatter.round(pos.lng,opts.decimals, opts.decimalSeperator);
			this._label.innerHTML = this._createCoordinateLabel(pos);
		}
	}

});

L.control.coordinates = function (options) {
	return new L.Control.Coordinates(options);
};

L.Map.mergeOptions({
    coordinateControl: false
});

L.Map.addInitHook(function () {
    if (this.options.coordinateControl) {
        this.coordinateControl = new L.Control.Coordinates();
        this.addControl(this.coordinateControl);
    }
});