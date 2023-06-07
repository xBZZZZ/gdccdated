'use strict';

function structure_finder_dict_onclick(){
	pop_gui();
	var p=this.dict_relative_path,l=p.length;
	if(!l)return;
	var i=0,t;
	while(l>i){
		t=p[i++];
		t=dict_editor_add_path_link(t.value,t.key);
	}
	t.click();
}

function dict_editor_recursive_find_structures_onclick(){
	var path=[],g=cre('div'),b;
	g.dataset.isModal='';
	b=g.appendChild(cre('input'));
	b.type='button';
	b.value='back';
	b.onclick=pop_gui;
	g.appendChild(cre('h2')).textContent='found structures (might contain false positives):';
	b=g.appendChild(cre('ul'));
	(function f(dict){
		var ul,i,i2,p,len;
		for(var st in structures)if(st=get_structure_name(structures[st],dict)){
			if(!ul){
				ul=b.appendChild(cre('li'));
				i=ul.appendChild(cre('input'));
				i.type='button';
				i.onclick=structure_finder_dict_onclick;
				i.dict_relative_path=path.slice();
				p='./';
				i2=0;
				len=path.length;
				while(len>i2)p+=path[i2++].key+'/';
				i.value=p;
				ul.appendChild(ul=cre('ul'));
			}
			ul.appendChild(cre('li')).textContent=st;
		}
		len=dict.length;
		i=0;
		i2=path.push(null)-1;
		while(len>i){
			ul=dict[i++];
			if(ul.type!=='d')continue;
			path[i2]=ul;
			f(ul.value);
		}
		path.pop();
	})(current_gui().cc_dict);
	push_gui(g);
}

function get_structure_name(s,d){
	if(s.is_dict_wrong(d))return null;
	for(var i=0,chs=s.changers,l=chs.length;l>i;++i)if(typeof chs[i]==='object'&&chs[i].is_dict_wrong(d))return null;
	return s.get_name(d);
}

function dict_editor_edit_as_structure_onclick(){
	var dict=current_gui().cc_dict,g=cre('div'),b=g.appendChild(cre('input'));
	b.type='button';
	b.value='back';
	b.onclick=pop_gui;
	g.cc_dict=dict;
	g.dataset.isModal='';
	g.appendChild(cre('h2')).textContent='select structure';
	var bn,ul=g.appendChild(cre('ul'));
	for(var stn in structures)if(bn=get_structure_name(structures[stn],dict)){
		b=cre('input');
		b.type='button';
		b.value=bn;
		b.dataset.structure=stn;
		b.onclick=structure_onclick;
		ul.appendChild(cre('li')).appendChild(b);
	}
	push_gui(g);
}

function structure_onclick(){
	var gl=guis.length,g=guis[gl-1],d=g.cc_dict,gch=g.childNodes,t=gch[0],stn=this.dataset.structure,st=structures[stn],chs=st.changers,i=0,l=chs.length,tbd,ch,charr=g.charr=[];
	gch[1].textContent='editing dict as '+stn;
	t.value='back (no write)';
	g.tbd=tbd=[t,t=g.insertBefore(cre('input'),t)];
	t.type='button';
	t.value='back';
	t.onclick=structure_editor_back_button_onclick;
	t=null;
	stn=document.createDocumentFragment();
	gl+='changer';
	while(l>i){
		if(typeof chs[i]==='string'){
			(t||(t=cre('template'))).innerHTML=chs[i];
			stn.appendChild(t.content);
		}else{
			charr.push(ch={
				'__proto__':chs[i],
				'labelfor':gl+i,
				'tbd':tbd,
				'd':d,
				'fs':stn.appendChild(cre('fieldset')),
				'_reset_btn':cre('input'),
				'changes':null
			});
			ch._init();
		}
		++i;
	}
	g.replaceChild(stn,gch[3]);
}

var changerproto={
	'__proto__':null,
	'_init':function(){
		var e1=this._reset_btn,e2=cre('legend');
		e1.type='button';
		e1.value='reset';
		e1.title='forget changes\n\nwhen everything is resetted [back] and [back (no write)] buttons do same thing';
		e1.disabled=true;
		e1.chobj=this;
		e1.onclick=this._reset_onclick;
		e2.appendChild(e1);
		(e1=cre('label')).htmlFor=this.labelfor;
		e1.style.marginLeft='5px';
		e1.textContent=this.name;
		e2.appendChild(e1);
		this.fs.appendChild(e2);
		this.makehtml();
		this.inithtml();
	},
	'_reset_onclick':function(){
		var o=this.chobj;
		o.changes=null;
		o.inithtml();
		o._reset_btn.disabled=true;
	},
	'changed':function(){
		if(this.changes===null)this.changes=true;
		this._reset_btn.disabled=false;
	}//geterror called before write
};
changerproto.geterror=changerproto.inithtml=function(){
	return null;
};

function StrChanger(name,itemkey,itemtype,inptype,defaultvalue,extratxt){
	this.name=name+' ('+itemkey+')';
	this.itemkey=itemkey;
	this.itemtype=itemtype;
	this.inptype=inptype;
	this.defaultvalue=defaultvalue||'';
	this.extratxt=extratxt||'';
}
StrChanger.prototype.__proto__=changerproto;
StrChanger.prototype.is_dict_wrong=function(dict){
	return is_wrong_type(this.itemkey,this.itemtype,dict);
};
StrChanger.prototype.makehtml=function(){
	if(this.inptype==='textarea')var inp=cre('textarea');
	else(inp=cre('input')).type=this.inptype;
	inp.id=this.labelfor;
	inp.oninput=this.changed.bind(this);
	this.fs.appendChild(this.inp=inp);
	if(this.extratxt){
		var l=cre('label');
		l.style.marginLeft='5px';
		l.htmlFor=this.labelfor;
		l.textContent=this.extratxt;
		this.fs.appendChild(l);
	}
};
StrChanger.prototype.inithtml=function(){
	this.inp.value=lookup(this.itemkey,this.d,this.itemtype,false,this.defaultvalue).value;
};
StrChanger.prototype.write=function(){
	lookup(this.itemkey,this.d,this.itemtype,true).value=this.inp.value;
};

function EnumChanger(name,itemkey,extrahtml){
	this.name=name+' ('+itemkey+')';
	this.itemkey=itemkey;
	this.extrahtml=extrahtml;
}
EnumChanger.prototype.__proto__=changerproto;
EnumChanger.prototype.is_dict_wrong=function(dict){
	return is_wrong_type(this.itemkey,'i',dict);
};
EnumChanger.prototype.rregexp=RegExp('type="radio"','g');
EnumChanger.prototype.makehtml=function(){
	this.fs.insertAdjacentHTML('beforeend','<input id="'+this.labelfor+'" type="number"/><hr/>'+this.extrahtml.replace(this.rregexp,'name="'+this.labelfor+'enum" $&'));
	tangle_input_radios(this.inp=this.fs.querySelector('input[type=number]'),this.fs.querySelectorAll('input[type=radio]'),this);
};
EnumChanger.prototype.inithtml=function(){
	this.inp.value=lookup(this.itemkey,this.d,'i',false,'0').value;
	check_tangled_radio(this.inp);
};
EnumChanger.prototype.write=function(){
	lookup(this.itemkey,this.d,'i',true).value=this.inp.value;
};

function BoolChanger(name,itemkey){
	this.name=name+' ('+itemkey+')';
	this.itemkey=itemkey;
}
BoolChanger.prototype.__proto__=changerproto;
BoolChanger.prototype.is_dict_wrong=function(dict){
	return is_wrong_type(this.itemkey,'t',dict);
};
BoolChanger.prototype.makehtml=function(){
	var c=this.inp=cre('input');
	c.type='checkbox';
	c.id=this.labelfor;
	c.onchange=this.changed.bind(this);
	this.fs.appendChild(c);
};
BoolChanger.prototype.inithtml=function(){
	this.inp.checked=lookup(this.itemkey,this.d)!==null;
};
BoolChanger.prototype.write=function(){
	set_bool(this.itemkey,this.d,this.inp.checked);
};

function structure_editor_back_button_onclick(){
	for(var charr=current_gui().charr,i=0,l=charr.length,e;l>i;++i)if(charr[i].changes!==null&&(e=charr[i].geterror())!==null){
		charr='can\'t write '+charr[i].name+' because\n\n';
		console.error(charr,e);
		alert(charr+e);
		return;
	}
	e=false;
	for(i=0;l>i;++i)if(charr[i].changes!==null){
		charr[i].write();
		e=true;
	}
	pop_gui();
	if(e)dict_editor_add_lis();
}

function tangle_input_radios_input_oninput(){
	check_tangled_radio(this);
	this.change_handler.changed();
}

function check_tangled_radio(input){
	var radio=input.tangled_radios[input.value];
	if(radio)(input.curr_tangled_radio=radio).checked=true;
	else if(radio=input.curr_tangled_radio){
		input.curr_tangled_radio=null;
		radio.checked=false;
	}
}

function tangle_input_radios_radio_onchange(){
	if(this.checked){
		var i=this.tangled_input;
		i.curr_tangled_radio=this;
		i.value=this.value;
		this.change_handler.changed();
	}
}

function tangle_input_radios(input,radios,change_handler){
	var rdict=input.tangled_radios={'__proto__':null},i=radios.length;
	while(i){
		var radio=radios[--i];
		radio.tangled_input=input;
		radio.change_handler=change_handler;
		radio.onchange=tangle_input_radios_radio_onchange;
		rdict[radio.value]=radio;
	}
	input.curr_tangled_radio=null;
	input.change_handler=change_handler;
	input.oninput=tangle_input_radios_input_oninput;
}

function lookup(key,dict,d_type,write,d_value){
	var len=dict.length,i=0,item;
	while(len>i){
		item=dict[i++];
		if(key===item.key)return item;
	}
	if(d_type){
		item={
			'key':key,
			'type':d_type,
			'value':d_value||''
		};
		if(write)dict.push(item);
		return item;
	}
	return null;
}

function is_wrong_type(type,key,dict){
	return (dict=lookup(key,dict))&&type!==dict.type;
}

function set_bool(key,dict,bool){
	var len=dict.length,i=0;
	while(len>i){
		if(key===dict[i].key){
			if(!bool)dict.splice(i,1);
			return;
		}
		++i;
	}
	if(bool)dict.push({'key':key,'type':'t','value':''});
}

function is_wrong_all(key,type,value,dict){
	dict=lookup(key,dict);
	return !dict||type!==dict.type||value!==dict.value;
}

var structures={
	'local level':{
		'is_dict_wrong':is_wrong_all.bind(null,'kCEK','i','4'),
		'get_name':function(d){
			var name_item=lookup('k2',d);
			return name_item?'local level '+JSON.stringify(name_item.value)+(lookup('k4',d)?' (yes level data)':' (no level data)'):null;
		},
		'changers':[
			'<a href="https://github.com/gd-programming/gd.docs/blob/docs/docs/resources/client/level.md" rel="noreferrer" target="_blank">level documentation</a>',
			new StrChanger('level name','k2','s','textarea'),
			{
				'__proto__':changerproto,
				'name':'level description (k3)',
				'makehtml':function(){
					(this.desc_input=cre('textarea')).id=this.labelfor;
					this.desc_input.oninput=this.changed.bind(this);
					this.fs.appendChild(this.desc_input);
				},
				'is_dict_wrong':function(d){
					d=lookup('k3',d);
					if(!d)return false;
					if(d.type!=='s')return true;
					try{
						urlsafeb64decode(d.value);
						return false;
					}catch(err){}
					return true;
				},
				'inithtml':function(){
					this.desc_input.value=urlsafeb64decode(lookup('k3',this.d,'s').value);
				},
				'geterror':function(){
					try{
						this.new_desc=urlsafeb64encode(this.desc_input.value);
					}catch(error){
						return error;
					}
					return null;
				},
				'write':function(){
					lookup('k3',this.d,'s',true).value=this.new_desc;
				}
			},
			{
				'__proto__':changerproto,
				'name':'level data (k4)',
				'is_dict_wrong':is_wrong_type.bind(null,'s','k4'),
				'makehtml':function(){
					var b=this.edit_btn=cre('input');
					this.tbd.push(b);
					b.id=this.labelfor;
					b.type='button';
					b.value='edit in object editor';
					if(this.level_data_item=lookup('k4',this.d)){
						b.chobj=this;
						b.onclick=this.edit_onclick;
					}else{
						b.disabled=true;
						b.title='there is no item with key "k4"';
					}
					this.fs.appendChild(b);
				},
				'write':function(){
					this.level_data_item.value=this.changes;
				},
				'edit_onclick':function(){
					var b=this.chobj,ld=b.changes===null?b.level_data_item.value:b.changes,write_changes=function(n){
						b.changes=n;
						b.changed();
					};
					if(!ld||ld.charAt(ld.length-1)===';')try{
						new ObjEditor(ld,write_changes);
					}catch(error){
						say_error('object editor',error);
					}else{
						tbd_set_disabled(true);
						gzip_decode_with_callback(ld,function(ld){
							tbd_set_disabled(false);
							try{
								new ObjEditor(ld,write_changes);
							}catch(error){
								say_error('object editor',error);
							}
						},say_error.bind(null,'decode level data'));
					}
				}
			},
			new BoolChanger('verified','k14'),
			new StrChanger('coins','k64','i','number','0'),
			new StrChanger('stars requested','k66','i','number','0'),
			new EnumChanger('level type','k21','values:<div style="list-style-type:none;padding-left:20px;"><label style="display:list-item;"><input value="2" type="radio"/>2&#9205;editor level</label><label style="display:list-item;"><input value="3" type="radio"/>3&#9205;&quot;view&quot; online level</label><label style="display:list-item;"><input value="4" type="radio"/>4&#9205;&quot;view&quot; online level (level download failed)</label></div>any other value makes unclickable &quot;view&quot; online level (at least in CCLocalLevels.dat)'),
			new EnumChanger('level length','k23','<label class="rl"><input value="0" type="radio"/>0&#9205;Tiny</label><label class="rl"><input value="1" type="radio"/>1&#9205;Short</label><label class="rl"><input value="2" type="radio"/>2&#9205;Medium</label><label class="rl"><input value="3" type="radio"/>3&#9205;Long</label><label class="rl"><input value="4" type="radio"/>4&#9205;XL</label><label class="rl"><input value="5" type="radio"/>5&#9205;Plat.<strong class="when"> (2.2)</strong></label><br/>other values are XL'),
			{
				'__proto__':changerproto,
				'name':'copy settings (k41)',
				'is_dict_wrong':is_wrong_type.bind(null,'i','k41'),
				'makehtml':function(){
					hopen('table').className='tableborder';
						hopen('tr');
							hopen('th');
								hopen('label').htmlFor=this.labelfor;
								hcurr().textContent='value';
								hclose('label');
							hclose('th');
							hopen('td');
								this.input=hopen('input');
								hcurr().id=this.labelfor;
								hcurr().type='number';
								hcurr().chobj=this;
								hcurr().oninput=this.input_oninput;
								hstyle('width','100%');
								hclose('input');
							hclose('td');
							hopen('td').rowSpan=2;
								hopen('input').type='button';
								hcurr().value='no copy';
								hcurr().chobj=this;
								hcurr().onclick=this.no_copy;
								this.no_copy_btn=hclose('input');
								hopen('input').type='button';
								hcurr().value='copy';
								hcurr().chobj=this;
								hcurr().onclick=this.copy;
								this.copy_btn=hclose('input');
								hopen('input').type='button';
								hcurr().value='pass';
								hcurr().chobj=this;
								hcurr().onclick=this.pass;
								hclose('input');
							hclose('td');
						hclose('tr');
						hopen('tr');
							hopen('th');
								var meaningid=this.labelfor+'meaning';
								hopen('label').htmlFor=meaningid;
								hcurr().textContent='meaning';
								hclose('label');
							hclose('th');
							hopen('td');
								this.meaning=hopen('output');
								hcurr().id=meaningid;
								hcurr().htmlFor.add(this.labelfor);
								hclose('output');
							hclose('td');
						hclose('tr');
					this.fs.appendChild(hclose('table'));
				},
				'r1':RegExp('^1[0-9]{6}$',''),
				'r2':RegExp('^0{0,2}',''),
				'r3':RegExp('^[0-9]{0,6}$',''),
				'input_oninput':function(){
					var c=this.chobj;
					c.changed();
					c.update();
				},
				'no_copy':function(){
					var c=this.chobj;
					c.input.value='0';
					c.changed();
					c.update();
				},
				'copy':function(){
					var c=this.chobj;
					c.input.value='1';
					c.changed();
					c.update();
				},
				'pass':function(){
					var c=this.chobj,val=c.input.value,i;
					if(c.r1.test(val)){
						i=0;
						while(++i<7&&'0'===val.charAt(i));
						i=val.substring(i);
					}else i='';
					i=prompt('pass (max 6 digits)',i);
					if('string'!==typeof i)return;
					if(!c.r3.test(i)){
						alert('bad pass: '+i);
						return;
					}
					i='1000000'.substring(0,7-i.length)+i;
					if(val===i)return;
					c.input.value=i;
					c.changed();
					c.update();
				},
				'update':function(){
					var val=this.input.value;
					switch(val){
						case '0':
							this.meaning.textContent='no copy';
							this.no_copy_btn.disabled=true;
							this.copy_btn.disabled=false;
							return;
						case '1':
							this.no_copy_btn.disabled=false;
							this.copy_btn.disabled=true;
							this.meaning.textContent='copy';
							return;
						default:
							this.no_copy_btn.disabled=false;
							this.copy_btn.disabled=false;
							if(this.r1.test(val))this.meaning.innerHTML='pass: <strong class="wp">'+val.substring(1).replace(this.r2,'$&<mark>')+'</mark></strong>';
							else this.meaning.textContent='I don\'t know';
					}
				},
				'inithtml':function(){
					this.input.value=lookup('k41',this.d,'i',false,'0').value;
					this.update();
				},
				'write':function(){
					lookup('k41',this.d,'i',true).value=this.input.value;
				}
			},
			new StrChanger('official song id','k8','i','number','0','(0 = stereo madness)'),
			new StrChanger('newgrounds song id','k45','i','number','0','(0 means use official song)'),
			new StrChanger('objects','k48','i','number','0'),
			new BoolChanger('has low detail mode','k72'),
			new StrChanger('original level id','k42','i','number','0','(0 means level is not copied from online level)'),
			new StrChanger('seconds spent editing this level','k80','i','number','0'),
			new StrChanger('seconds spent editing originals','k81','i','number','0','(seconds spent editing original of this level + seconds spent editing original of original of this level\u2026)')
		]
	}
};

var urlsafeb64decode_re=RegExp('[-_]','g');

function urlsafeb64decode_rep(s){
	return s==='-'?'+':'/';
}

function urlsafeb64decode(a){
	return atob(a.replace(urlsafeb64decode_re,urlsafeb64decode_rep));
}

var urlsafeb64encode_re=RegExp('[+/]','g');

function urlsafeb64encode_rep(s){
	return s==='+'?'-':'_';
}

function urlsafeb64encode(a){
	return btoa(a).replace(urlsafeb64encode_re,urlsafeb64encode_rep);
}

function string_editor_back(){
	var g=current_gui();
	if(g.do_after)g.do_after(g.encoded.value);
	if(g.do_after2)g.do_after2();
	pop_gui();
}

function string_editor_back_no_write(){
	var g=current_gui();
	if(g.do_after2)g.do_after2();
	pop_gui();
}

function gzip_encode_with_callback(text,onsuccess,onerror){
	try{
		var c=new window.CompressionStream('gzip'),s=c.writable.getWriter(),out='',chr=String.fromCharCode;
		s.write(string_to_uint8array(text));
		s.close();
		s=c.readable.getReader();
		s.read().then(function ondata(u){
			try{
				if(u.done){
					onsuccess(urlsafeb64encode(out));
					return;
				}
				u=u.value;
				var len=u.length,i=0;
				if(len>8192)while(len>i)out+=chr.apply(null,u.subarray(i,i+=8192));
				else out+=chr.apply(null,u);
				s.read().then(ondata,onerror);
			}catch(error){
				onerror(error);
			}
		},onerror);
	}catch(error){
		onerror(error);
	}
}

function gzip_decode_with_callback(text,onsuccess,onerror){
	try{
		text=urlsafeb64decode(text);
		var i=0,len=text.length,u=new Uint8Array(len);
		while(len>i)u[i]=text.charCodeAt(i++);
		text=new window.DecompressionStream('gzip');
		i=text.writable.getWriter();
		i.write(u);
		i.close();
		i=text.readable.getReader();
		u='';
		text=String.fromCharCode;
		i.read().then(function ondata(d){
			try{
				if(d.done){
					onsuccess(u);
					return;
				}
				d=d.value;
				var len=d.length,x=0;
				if(len>8192)while(len>x)u+=text.apply(null,d.subarray(x,x+=8192));
				else u+=text.apply(null,d);
				i.read().then(ondata,onerror);
			}catch(error){
				onerror(error);
			}
		},onerror);
	}catch(error){
		onerror(error);
	}
}

function string_editor_encode(){
	var g=current_gui();
	if(g.dataset.doingStuff!=null)return;
	g.dataset.doingStuff='';
	set_loading(true);
	g.status.nodeValue=' encoding\n';
	function err(error){
		delete g.dataset.doingStuff;
		g.status.nodeValue=' error\n';
		say_error('encode',error);
	}
	function out(enc){
		delete g.dataset.doingStuff;
		set_loading(false);
		set_toggler(g.encoded_toggler,enc.length<=10000,true);
		g.encoded.value=enc;
		g.status.nodeValue=' encoded,len='+enc.length+'\n';
	}
	try{
		if(g.use_gzip.nodeValue==='[yes')gzip_encode_with_callback(g.decoded.value,out,err);
		else out(urlsafeb64encode(g.decoded.value));
	}catch(error){
		err(error);
	}
}

function string_editor_decode(){
	var g=current_gui();
	if(g.dataset.doingStuff!=null)return;
	g.dataset.doingStuff='';
	set_loading(true);
	g.status.nodeValue=' decoding\n';
	function err(error){
		delete g.dataset.doingStuff;
		g.status.nodeValue=' error\n';
		say_error('decode',error);
	}
	function out(dec){
		delete g.dataset.doingStuff;
		set_loading(false);
		set_toggler(g.decoded_toggler,dec.length<=10000,true);
		g.decoded.value=dec;
		g.status.nodeValue=' decoded,len='+dec.length+'\n';
	}
	try{
		if(g.use_gzip.nodeValue==='[yes')gzip_decode_with_callback(g.encoded.value,out,err);
		else out(urlsafeb64decode(g.encoded.value));
	}catch(error){
		err(error);
	}
}

function string_editor_toggle_gzip(){
	var z=current_gui().use_gzip;
	z.nodeValue=z.nodeValue==='[yes'?'[no ':'[yes';
}

function string_editor_open_sel(){
	var i=current_gui()[this.dataset.prop],sd=i.selectionDirection,ss=i.selectionStart,se=i.selectionEnd,v=i.value,b=v.substring(0,ss),a=v.substring(se);
	string_editor(function(n){
		i.value=b+n+a;
		try{
			i.setSelectionRange(ss,ss+n.length,sd);
		}catch(err){
			console.warn('setSelectionRange error:',err);
		}
	},function(){
		setTimeout(focus_element,0,i);
	},v.substring(ss,se));
}

function string_editor_open_obj(){
	try{
		var i=current_gui()[this.dataset.prop];
		new ObjEditor(i.value,function(new_val){
			i.value=new_val;
		});
	}catch(error){
		say_error('object editor',error);
	}
}

function string_editor(do_after,do_after2,start_text){
	var g=cre('pre'),el=g.appendChild(cre('a'));
	el.draggable=false;
	g.dataset.isModal='line-height:20px;';
	g.dataset.guiType='stringeditor';
	g.do_after=do_after;
	g.do_after2=do_after2;
	if(do_after){
		el.className='btn';
		el.textContent='back';
		el.href='javascript:;';
		el.onclick=string_editor_back;
		g.appendChild(document.createTextNode(' '));
		el=g.appendChild(cre('a'));
		el.draggable=false;
	}
	el.className='btn';
	el.textContent='back (no write)\n';
	el.href='javascript:;';
	el.onclick=string_editor_back_no_write;
	g.appendChild(g.encoded=cre('textarea')).value=start_text;
	set_toggler(g.encoded_toggler=add_toggler(g.encoded),start_text.length<=10000);
	g.appendChild(document.createTextNode('\n'));
	el=g.appendChild(cre('a'));
	el.draggable=false;
	el.className='btn';
	el.textContent='[\u2193]';
	el.href='javascript:;';
	el.onclick=string_editor_decode;
	g.appendChild(document.createTextNode(' '));
	el=g.appendChild(cre('a'));
	el.draggable=false;
	el.className='btn';
	el.textContent='[\u2191]';
	el.href='javascript:;';
	el.onclick=string_editor_encode;
	g.appendChild(document.createTextNode(' '));
	el=g.appendChild(cre('a'));
	el.draggable=false;
	el.className='btn';
	el.appendChild(g.use_gzip=document.createTextNode('[no '));
	el.appendChild(document.createTextNode('] use gzip'));
	el.href='javascript:;';
	el.onclick=string_editor_toggle_gzip;
	g.appendChild(g.status=document.createTextNode(' none\n'));
	g.decoded_toggler=add_toggler(g.appendChild(g.decoded=cre('textarea')));
	g.appendChild(document.createTextNode('\n'));
	el=g.appendChild(cre('a'));
	el.draggable=false;
	el.className='btn';
	el.textContent='open top selection\n';
	el.href='javascript:;';
	el.dataset.prop='encoded';
	el.onclick=string_editor_open_sel;
	el=g.appendChild(cre('a'));
	el.draggable=false;
	el.className='btn';
	el.textContent='open bottom selection\n';
	el.href='javascript:;';
	el.dataset.prop='decoded';
	el.onclick=string_editor_open_sel;
	el=g.appendChild(cre('a'));
	el.draggable=false;
	el.className='btn';
	el.textContent='open top in object editor\n';
	el.href='javascript:;';
	el.dataset.prop='encoded';
	el.onclick=string_editor_open_obj;
	el=g.appendChild(cre('a'));
	el.draggable=false;
	el.className='btn';
	el.textContent='open bottom in object editor\n';
	el.href='javascript:;';
	el.dataset.prop='decoded';
	el.onclick=string_editor_open_obj;
	g.appendChild(document.createTextNode('use in JS console:\n  sd - decoded (bottom value)\n  se - encoded (top value)'));
	push_gui(g);
}