'use strict';

Object.defineProperties(window,{
	'sd':{
		'configurable':true,
		'enumerable':true,
		'get':function(){
			var g=current_gui();
			if(g.dataset.guiType!=='stringeditor')throw Error('not string editor');
			return g.decoded.getval();
		},
		'set':function(val){
			var g=current_gui();
			if(g.dataset.guiType!=='stringeditor')throw Error('not string editor');
			g.decoded.setval(String(val));
		}
	},
	'se':{
		'configurable':true,
		'enumerable':true,
		'get':function(){
			var g=current_gui();
			if(g.dataset.guiType!=='stringeditor')throw Error('not string editor');
			return g.encoded.getval();
		},
		'set':function(val){
			var g=current_gui();
			if(g.dataset.guiType!=='stringeditor')throw Error('not string editor');
			g.encoded.setval(String(val));
		}
	},
	'ok':{
		'configurable':true,
		'enumerable':true,
		'get':function(){
			if(guis[guis.length-1].dataset.guiType!=='objeditordialog')throw Error('not object editor dialog');
			return guis[guis.length-2].obj_editor.i_dialog_key.value.replace(ObjEditor.re2,'\r');
		},
		'set':function(val){
			if(guis[guis.length-1].dataset.guiType!=='objeditordialog')throw Error('not object editor dialog');
			var o=guis[guis.length-2].obj_editor;
			o.s_dialog_key.value=o.i_dialog_key.value=String(val).replace(ObjEditor.re1,';');
		}
	},
	'ovs':{
		'configurable':true,
		'enumerable':true,
		'get':function(){
			if(guis[guis.length-1].dataset.guiType!=='objeditordialog')throw Error('not object editor dialog');
			return guis[guis.length-2].obj_editor.i_dialog_value.value.replace(ObjEditor.re2,'\r');
		},
		'set':function(val){
			if(guis[guis.length-1].dataset.guiType!=='objeditordialog')throw Error('not object editor dialog');
			var o=guis[guis.length-2].obj_editor;
			o.i_dialog_value.value=String(val).replace(ObjEditor.re1,';');
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
	},
	'ik':{
		'configurable':true,
		'enumerable':true,
		'get':function(){
			var g=current_gui();
			if(g.dataset.guiType!=='itemeditor')throw Error('not item editor');
			return g.key_input.getval();
		},
		'set':function(val){
			var g=current_gui();
			if(g.dataset.guiType!=='itemeditor')throw Error('not item editor');
			g.key_input.setval(String(val));
		}
	},
	'iv':{
		'configurable':true,
		'enumerable':true,
		'get':function(){
			var g=current_gui();
			if(g.dataset.guiType!=='itemeditor')throw Error('not item editor');
			if(g.edit_button.cc_dict_item.type==='d')throw Error('can\'t get value of <d> as string');
			return g.value_input.getval();
		},
		'set':function(val){
			var g=current_gui();
			if(g.dataset.guiType!=='itemeditor')throw Error('not item editor');
			if(g.edit_button.cc_dict_item.type==='d')throw Error('can\'t set value of <d> as string');
			g.value_input.setval(String(val));
		}
	}
});