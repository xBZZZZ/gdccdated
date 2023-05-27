'use strict';

Object.defineProperties(window,{
	'sd':{
		'configurable':true,
		'enumerable':true,
		'get':function(){
			var g=current_gui();
			if(g.dataset.guiType!=='stringeditor')throw Error('not string editor');
			return g.decoded.value;
		},
		'set':function(val){
			var g=current_gui();
			if(g.dataset.guiType!=='stringeditor')throw Error('not string editor');
			g.decoded.value=val;
		}
	},
	'se':{
		'configurable':true,
		'enumerable':true,
		'get':function(){
			var g=current_gui();
			if(g.dataset.guiType!=='stringeditor')throw Error('not string editor');
			return g.encoded.value;
		},
		'set':function(val){
			var g=current_gui();
			if(g.dataset.guiType!=='stringeditor')throw Error('not string editor');
			g.encoded.value=val;
		}
	},
	'ovs':{
		'configurable':true,
		'enumerable':true,
		'get':function(){
			if(guis[guis.length-1].dataset.guiType!=='objeditordialog')throw Error('not object editor dialog');
			return guis[guis.length-2].obj_editor.i_dialog_value.value;
		},
		'set':function(val){
			if(guis[guis.length-1].dataset.guiType!=='objeditordialog')throw Error('not object editor dialog');
			var o=guis[guis.length-2].obj_editor;
			o.i_dialog_value.value=val;
			o.dialog_value_oninput();
		}
	},
	'ov':{
		'configurable':true,
		'enumerable':true,
		'get':function(){
			if(guis[guis.length-1].dataset.guiType!=='objeditordialog')throw Error('not object editor dialog');
			var n=guis[guis.length-2].obj_editor.i_dialog_value.value-0;
			if(Number.isFinite(n))return n;
			throw Error('failed to parse value as finite number');
		},
		'set':function(val){
			if(guis[guis.length-1].dataset.guiType!=='objeditordialog')throw Error('not object editor dialog');
			if(!Number.isFinite(val-=0))throw Error('failed to parse value as finite number');
			var o=guis[guis.length-2].obj_editor;
			o.i_dialog_value.value=val;
			o.dialog_value_oninput();
		}
	}
});