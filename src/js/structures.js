'use strict';

function structure_finder_dict_onclick(){
	pop_gui();
	var p=this.dict_relative_path,l=p.length;
	if(l){
		var i=0,f=document.createDocumentFragment(),b;
		while(l>i){
			b=cre('input');
			b.type='button';
			b.value=p[i].key;
			b.cc_dict=p[i++].value;
			f.appendChild(b);
		}
		b.disabled=true;
		b=current_gui();
		b.cc_dict=p[i-1].value;
		b=b.path_list;
		b.lastChild.disabled=false;
		b.appendChild(f);
		dict_editor_add_lis();
	}
}

function dict_editor_recursive_find_structures_onclick(){
	var path=[],g=cre('div'),b=g.appendChild(cre('input'));
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
	push_gui(g,true);
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
	push_gui(g,true);
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
		this.disabled=true;
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
	var l=cre('input');
	l.type=this.inptype;
	l.id=this.labelfor;
	l.oninput=this.changed.bind(this);
	this.fs.appendChild(this.inp=l);
	if(this.extratxt){
		l=cre('label');
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

function AdvChanger(name,itemkey){
	this.name=name+' ('+itemkey+')';
	this.itemkey=itemkey;
}
AdvChanger.prototype.__proto__=changerproto;
AdvChanger.prototype.is_dict_wrong=function(dict){
	return is_wrong_type(this.itemkey,'s',dict);
};
AdvChanger.prototype.makehtml=function(){
	this.fs.className='vbox';
	(this.adv=new AdvTextArea(this.fs)).onchange=this.changed.bind(this);
	this.adv.textarea.id=this.labelfor;
	this.tbd.push(this.adv.select);
};
AdvChanger.prototype.inithtml=function(){
	this.adv.setval(lookup(this.itemkey,this.d,'s').value);
};
AdvChanger.prototype.write=function(){
	lookup(this.itemkey,this.d,'s',true).value=this.adv.getval();
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

function BoolChanger(name,itemkey,extratxt){
	this.name=name+' ('+itemkey+')';
	this.itemkey=itemkey;
	this.extratxt=extratxt||'';
}
BoolChanger.prototype.__proto__=changerproto;
BoolChanger.prototype.is_dict_wrong=function(dict){
	return is_wrong_type(this.itemkey,'t',dict);
};
BoolChanger.prototype.makehtml=function(){
	var l=this.inp=cre('input');
	l.type='checkbox';
	l.id=this.labelfor;
	l.onchange=this.changed.bind(this);
	this.fs.appendChild(l);
	if(this.extratxt){
		l=cre('label');
		l.style.marginLeft='5px';
		l.htmlFor=this.labelfor;
		l.textContent=this.extratxt;
		this.fs.appendChild(l);
	}
};
BoolChanger.prototype.inithtml=function(){
	this.inp.checked=lookup(this.itemkey,this.d)!==null;
};
BoolChanger.prototype.write=function(){
	set_bool(this.itemkey,this.d,this.inp.checked);
};

function CoinTableChanger(name,itemkey){
	this.name=name+' ('+itemkey+')';
	this.itemkey=itemkey;
}
CoinTableChanger.prototype.__proto__=changerproto;
CoinTableChanger.prototype.is_dict_wrong=function(d){
	if(!(d=lookup(this.itemkey,d))||'d'!==d.type)return true;
	var i=(d=d.value).length,m,l,k;
	while(i)if(
		's'!==(m=d[--i]).type||
		'1'!==m.value||
		(l=(k=m.key).length)<3||
		95!==k.charCodeAt(l-=2)||
		(m=k.charCodeAt(l+1))<49||m>51||
		(k=k.substring(0,l))!==(k>>0).toString()
	)return true;
	return false;
};
CoinTableChanger.prototype.makehtml=function(){
	this.darr=lookup(this.itemkey,this.d).value;
	this.fs.insertAdjacentHTML('beforeend','<div class="resizebox" tabindex="0" style="width:400px;height:400px;"></div><input type="checkbox" title="coin 1"/><input type="checkbox" title="coin 2"/><input type="checkbox" title="coin 3"/><input type="number" title="level id" min="-2147483648" max="2147483647" id="'+this.labelfor+'"/>');
	this.idinp=this.fs.lastChild;
	this.c3=this.idinp.previousSibling;
	this.c2=this.c3.previousSibling;
	this.c1=this.c2.previousSibling;
	this.c1.onchange=this.c2.onchange=this.c3.onchange=CoinTableChanger.cchange;
	this.idinp.oninput=CoinTableChanger.idinpchange;
	this.sel=new CSelect(this.c1.previousSibling,[],CoinTableChanger.itemstr,null,CoinTableChanger.selchange,null);
	this.c1.chobj=this.c2.chobj=this.c3.chobj=this.idinp.chobj=this.sel.chobj=this;
	//https://bugs.webkit.org/show_bug.cgi?id=266846
	new MutationObserver(this.sel.updateh.bind(this.sel)).observe(this.sel.p,CoinTableChanger.obsopts);
	this.lvlid=this.inspos=-1;
	this.selupdated=false;
	setTimeout(CoinTableChanger.updatefull,0,this);
};
CoinTableChanger.prototype.inithtml=function(){
	(arr3=this.sel.items).length=0;
	if(l=(arr=this.darr).length){
		i=0;
		arr2=new Float64Array(l);
		do arr2[i]=parseInt(str=arr[i].key,10)*8+(1<<str.charCodeAt(str.length-1)-49);
		while(++i<l);
		arr2.sort();
		var i=0,id=Math.floor(arr2[0]/8),coins=arr2[0]-id*8,id2,arr,arr2,arr3,l,str;
		while(++i<l)if(id===(id2=Math.floor(arr2[i]/8)))coins|=arr2[i]-id*8;
		else{
			arr3.push(id*8+coins);
			coins=arr2[i]-(id=id2)*8;
		}
		arr3.push(id*8+coins);
	}
	this.sel.sel=-1;
	if(this.selupdated)this.sel.updatelen();
	this.disc();
	this.idinp.value='';
};
CoinTableChanger.prototype.write=function(){
	var arr=this.sel.items,l=arr.length,i=0,arr2=this.darr;
	arr2.length=0;
	while(i<l){
		var coins=arr[i++],id=Math.floor(coins/8);
		coins-=id*8;
		id+='_';
		if(coins&1)arr2.push({'key':id+'1','type':'s','value':'1'});
		if(coins&2)arr2.push({'key':id+'2','type':'s','value':'1'});
		if(coins&4)arr2.push({'key':id+'3','type':'s','value':'1'});
	}
};
CoinTableChanger.prototype.setc=function(coins){
	this.c1.checked=coins&1;this.c1.disabled=false;
	this.c2.checked=coins&2;this.c2.disabled=false;
	this.c3.checked=coins&4;this.c3.disabled=false;
};
CoinTableChanger.prototype.disc=function(){
	this.c1.checked=false;this.c1.disabled=true;
	this.c2.checked=false;this.c2.disabled=true;
	this.c3.checked=false;this.c3.disabled=true;
};
CoinTableChanger.obsopts={
	'attributeFilter':['style'],
	'attributes':true
};
CoinTableChanger.coinstrs=['\u25CF\u25CC\u25CC','\u25CC\u25CF\u25CC','\u25CF\u25CF\u25CC','\u25CC\u25CC\u25CF','\u25CF\u25CC\u25CF','\u25CC\u25CF\u25CF','\u25CF\u25CF\u25CF'];
CoinTableChanger.itemstr=function(i){
	var id=Math.floor(i/8);
	return CoinTableChanger.coinstrs[i-id*8-1]+id;
};
CoinTableChanger.updatefull=function(chobj){
	chobj.sel.updatefull();
	chobj.selupdated=true;
};
CoinTableChanger.selchange=function(s){
	if(s&CS_SEL){
		var item=this.items[this.sel],c=this.chobj;
		c.inspos=-1;
		c.setc(item-(c.idinp.valueAsNumber=c.lvlid=Math.floor(item/8))*8);
	}
};
CoinTableChanger.cchange=function(){
	var c=this.chobj,coins=c.c1.checked|(c.c2.checked<<1)|(c.c3.checked<<2);
	if(c.inspos>=0){
		c.sel.items.splice(c.sel.sel=c.inspos,0,c.lvlid*8+coins);
		c.sel.selinview2();
		c.inspos=-1;
	}else if(coins){
		c.sel.items[c.sel.sel]=c.lvlid*8+coins;
		c.sel.updateitemdivs();
	}else{
		c.sel.items.splice(c.inspos=c.sel.sel,1);
		c.sel.sel=-1;
		c.sel.updatelen();
	}
	c.changed();
};
CoinTableChanger.idinpchange=function(){
	var id=this.valueAsNumber,c=this.chobj,sel=c.sel;
	if(id!==id>>0){
		sel.unsel();
		c.disc();
		return;
	}
	c.lvlid=id;
	id*=8;
	var items=sel.items,max=items.length,min=0;
	if(max){
		--max;
		while(min<max){
			var mid=(max-min>>1)+min;
			if(items[mid]<id)min=mid+1;else max=mid;
		}
		//min = index of item or future neighbour
		if(items[min]<id)++min;
		else if((id=items[min]-id)<8){
			//min = index of item
			//id variable is coins here
			sel.sel=min;
			sel.selinview();
			c.inspos=-1;
			c.setc(id);
			return;
		}
	}
	sel.unsel();
	c.inspos=min;
	c.setc(0);
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
	'__proto__':null,
	'local level':{
		'is_dict_wrong':is_wrong_all.bind(null,'kCEK','i','4'),
		'get_name':function(d){
			var name_item=lookup('k2',d);
			return name_item?'local level '+JSON.stringify(name_item.value)+(lookup('k4',d)?' (yes level data)':' (no level data)'):null;
		},
		'changers':[
			'<a href="https://wyliemaster.github.io/gddocs/#/resources/client/level" rel="noreferrer" target="_blank">level documentation</a>',
			new AdvChanger('level name','k2'),
			{
				'__proto__':changerproto,
				'name':'level description (k3)',
				'makehtml':AdvChanger.prototype.makehtml,
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
					this.adv.setval(urlsafeb64decode(lookup('k3',this.d,'s').value));
				},
				'geterror':function(){
					try{
						this.new_desc=urlsafeb64encode(this.adv.getval());
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
					var b=this.chobj,ld=b.changes===null?b.level_data_item.value:b.changes;
					if(!ld||ld.charAt(ld.length-1)===';')try{
						new ObjEditor(ld,function(n){
							b.changes=n;
							b.changed();
						});
					}catch(error){
						say_error('object editor',error);
					}else{
						set_loading(true);
						gzip_decode_with_callback(ld,function(ld){
							set_loading(false);
							try{
								new ObjEditor(ld,function(n){
									set_loading(true);
									gzip_encode_with_callback(n,function(n){
										set_loading(false);
										b.changes=n;
										b.changed();
									},say_error.bind(null,'encode level data'));
								});
							}catch(error){
								say_error('object editor',error);
							}
						},say_error.bind(null,'decode level data'));
					}
				}
			},
			new BoolChanger('verified','k14'),
			new BoolChanger('last completion auto','k33','completing level sets this only if k21 (level type) = 2 (editor level) and not testmode (start pos)'),
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
	},
	'CCGameManager.dat root':{
		'is_dict_wrong':changerproto.geterror,
		'get_name':function(){
			return 'CCGameManager.dat root';
		},
		'changers':[
			new CoinTableChanger('gray coins','GS_3'),
			new CoinTableChanger('brown coins','GS_4')
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
	if(g.do_after)g.do_after(g.encoded.getval());
	pop_gui();
}

function gzip_encode_with_callback(text,onsuccess,onerror){
	try{
		var c=new CompressionStream('gzip'),s=c.writable.getWriter(),out='',chr=String.fromCharCode;
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
		text=new DecompressionStream('gzip');
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
	set_loading(true);
	g.status.data='encoding';
	function err(error){
		g.status.data='encode error';
		say_error('encode',error);
	}
	function out(dec){
		set_loading(false);
		g.encoded.setval(dec);
		g.status.data='encoded,len='+dec.length;
	}
	try{
		if(g.use_gzip.checked)gzip_encode_with_callback(g.decoded.getval(),out,err);
		else out(urlsafeb64encode(g.decoded.getval()));
	}catch(error){
		err(error);
	}
}

function string_editor_decode(){
	var g=current_gui();
	set_loading(true);
	g.status.data='decoding';
	function err(error){
		g.status.data='decode error';
		say_error('decode',error);
	}
	function out(dec){
		set_loading(false);
		g.decoded.setval(dec);
		g.status.data='decoded,len='+dec.length;
	}
	try{
		if(g.use_gzip.checked)gzip_decode_with_callback(g.encoded.getval(),out,err);
		else out(urlsafeb64decode(g.encoded.getval()));
	}catch(error){
		err(error);
	}
}

function string_editor(do_after,start_text){
	var g=hopen('div'),tbd=g.tbd=[];
	g.dataset.guiType='stringeditor';
	g.className='vbox';
	if(g.do_after=do_after){
		hopen('div').className='hbox growc';
			tbd.push(hbutton('back',string_editor_back,onceel));hclose();
			tbd.push(hbutton('back (no write)',pop_gui,onceel));hclose();
	}else tbd.push(hbutton('back (no write)',pop_gui,onceel));
	hclose();
	hfieldset('encoded','use in JS console:\n  se - encoded (top value)').className='vbox';
		(g.encoded=new AdvTextArea(hcurr())).setval(start_text);
	tbd.push(hclose('fieldset'));
	hopen('div').className='hbox';
		tbd.push(hbutton('[\u2193]',string_editor_decode));hclose();
		tbd.push(hbutton('[\u2191]',string_editor_encode));hclose();
		hopen('label').className='hbox btn';
			hopen('input').type='checkbox';
			hstyle('margin','auto 0');
			tbd.push(g.use_gzip=hclose('input'));
			hopen('span').textContent='use gzip';
			hstyle('margin','auto 0');
			hclose('span');
		hclose('label');
		hopen('span').style.margin='auto 0';
			g.status=htext('none');
		hclose('span');
	hclose('div');
	hfieldset('decoded','use in JS console:\n  sd - decoded (bottom value)').className='vbox';
		g.decoded=new AdvTextArea(hcurr(),true);
	tbd.push(hclose('fieldset'));
	push_gui(hclose('div'),true);
}