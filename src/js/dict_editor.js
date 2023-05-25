'use strict';

function short_json_str(s){
	s=JSON.stringify(s);
	if(s.length>51)return s.substring(0,50)+'\u2026';
	return s;
}

function dict_item_display_string(p){
	var s=short_json_str(p.key)+' <'+p.type+'> ';
	if(p.type==='d')return s+'(dict with '+p.value.length+' items)';
	return s+short_json_str(p.value);
}

function dict_editor_add_lis(){
	var b=current_gui(),ul=b.items_list,d=b.cc_dict,i=0,item,len=d.length,div,frag=document.createDocumentFragment();
	while(len>i){
		item=d[i++];
		b=cre('input');
		div=cre('div');
		div.draggable=true;
		div.ondragstart=dict_item_div_ondragstart;
		div.ondragend=dict_item_div_ondragend;
		div.ondragover=dict_item_div_ondragover;
		div.ondragenter=dict_item_div_ondragenter;
		div.ondragleave=dict_item_div_ondragleave;
		div.ondrop=dict_item_div_ondrop;
		div.setAttribute('role','listitem');
		b.type='button';
		b.cc_dict=d;
		b.cc_dict_item=item;
		b.value=dict_item_display_string(item);
		b.onclick=dict_item_onclick;
		b.oncontextmenu=dict_item_oncontextmenu;
		div.appendChild(b);
		frag.appendChild(div);
	}
	if(ul.replaceChildren)ul.replaceChildren(frag);
	else{
		ul.textContent='';
		ul.appendChild(frag);
	}
}

function dict_editor_update_inputs(){
	var g=current_gui(),divs=g.items_list.childNodes,items=g.cc_dict,len=items.length,i=0,inp;
	while(len>i){
		inp=divs[i].firstChild;
		inp.value=dict_item_display_string(inp.cc_dict_item=items[i++]);
	}
}

function dict_editor_select_mode_on(){
	var g=current_gui();
	g.dropb.disabled=true;
	g.dataset.selectMode='1';
}

function dict_editor_clear_selection(){
	var divs=current_gui().items_list.childNodes,len=divs.length,i=0;
	while(len>i)delete divs[i++].firstChild.dataset.stuckActive;
}

function dict_editor_select_mode_off(){
	dict_editor_clear_selection();
	var g=current_gui();
	g.dropb.disabled=false;
	g.dataset.selectMode='0';
}

function dict_editor_invert_selection(){
	var divs=current_gui().items_list.childNodes,len=divs.length,i=0,d;
	while(len>i){
		d=divs[i++].firstChild.dataset;
		if(d.stuckActive==null)d.stuckActive='';
		else delete d.stuckActive;
	}
}

function dict_editor_delete_selected(){
	var tbd=[],items_list=current_gui().items_list,divs=items_list.childNodes,i=divs.length,div;
	while(i){
		div=divs[--i];
		if(div.firstChild.dataset.stuckActive!=null)tbd.push(div);
	}
	i=tbd.length;
	if(!(i&&confirm('delete '+i+' selected items?')))return;
	tbd.forEach(items_list.removeChild,items_list);
	dict_editor_update_from_dom();
}

function dict_editor_do_before_hide(){
	var a=this.items_list.childNodes,i=a.length;
	while(i)delete a[--i].dataset.itemDivAnim;
}

function dict_editor_update_from_dom(){
	var g=current_gui(),dict=g.cc_dict,divs=g.items_list.childNodes,i=divs.length;
	if(dict.length>i)dict.length=i;
	while(i)dict[--i]=divs[i].firstChild.cc_dict_item;
}

function dict_editor_do_menu(){
	var v=this.value;
	this.selectedIndex=0;
	if(v)window[v]();
}

function push_dict_editor(dict,root_name){
	var g=gui_div_with_html(false,
'<select class="dropb" title="menu" aria-label="menu">\
<option value="">menu</option>\
<option value="pop_gui">exit dict editor</option>\
<option value="dict_editor_add_d_item">add &lt;d&gt; item</option>\
<option value="dict_editor_add_s_item">add &lt;s&gt; item</option>\
<option value="dict_editor_recursive_find_structures_onclick">recursive find structures</option>\
<option value="dict_editor_edit_as_structure_onclick">edit as structure</option>\
<option value="push_xml_ie">XML (im|ex)port dict contects</option>\
<option value="dict_editor_sort_keys">sort items by key</option>\
<option value="push_search">recursive RegExp search</option>\
<option value="push_rename_helper">rename helper</option>\
<option value="dict_editor_select_mode_on">select mode on</option>\
</select>\
<div class="pathcontainer">\
<div class="path"></div>\
<div class="sopts">\
<input type="button" value="select mode off"/>\
<input type="button" value="invert selection"/>\
<input type="button" value="clear selection"/>\
<input type="button" value="delete selected"/>\
</div>\
</div>\
<div class="dict_items_list_container">\
<div class="dict_items_list" role="list"></div>\
</div>'),sopts=g.querySelector('.sopts').childNodes;
	sopts[0].addEventListener('click',dict_editor_select_mode_off,passiveel);
	sopts[1].addEventListener('click',dict_editor_invert_selection,passiveel);
	sopts[2].addEventListener('click',dict_editor_clear_selection,passiveel);
	sopts[3].addEventListener('click',dict_editor_delete_selected,passiveel);
	(sopts=g.dropb=g.querySelector('.dropb')).selectedIndex=0;
	sopts.addEventListener('change',dict_editor_do_menu,passiveel);
	g.dataset.selectMode='0';
	g.items_list=g.querySelector('.dict_items_list');
	g.path_list=g.querySelector('.path');
	g.do_before_hide=dict_editor_do_before_hide;
	g.dragging_item=null;
	push_gui(g);
	g=dict_editor_add_path_link(dict,root_name);
	g.setAttribute('style','font-weight:bold;');
	g.click();
}

var ints_re=RegExp('(-?[0-9]+)','');

function cc_dict_compare_items(item1,item2){
	if((item1=item1.key)===(item2=item2.key))return true;
	item1=item1.split(ints_re);
	item2=item2.split(ints_re);
	var l=Math.min(item1.push(Number.NEGATIVE_INFINITY),item2.push(Number.NEGATIVE_INFINITY)),i=0;
	while(l>i){
		if(i&1){
			item1[i]-=0;
			item2[i]-=0;
		}
		if(item1[i]!==item2[i])return item1[i]<item2[i];
		++i;
	}
	return true;
}

function dict_editor_sort_keys(){
	var dict=current_gui().cc_dict,l=dict.length;
	if(l<2)return;
	mergesort(dict,0,l,cc_dict_compare_items);
	dict_editor_update_inputs();
}

function mergesort(array,start,end,comparitor){
	//comparitor(a,b) returns a<=b
	if((len=end-start)<2)return;
	var len,mid=Math.floor(len/2),i2=mid,i1=i2+start;
	mergesort(array,i1,end,comparitor);
	mergesort(array,start,i1,comparitor);
	var arrayslice=array.slice(start,end);
	i1=0;
	do array[start++]=arrayslice[comparitor(arrayslice[i1],arrayslice[i2])?i1++:i2++];while(i1<mid&&i2<len);
	if(i1<mid)do array[start++]=arrayslice[i1];while(++i1<mid);
	else do array[start++]=arrayslice[i2];while(++i2<len);
}

function push_xml_ie(){
	var g=hopen('div'),tbd=g.tbd=[];
	g.last_blob_url='';
	g.new_items=null;
	hattr('data-is-modal','display:grid;grid-template-columns:auto auto;grid-template-rows:30px 30px 30px auto;');
	hbutton('back',xml_ie_back,onceel).className='npnb';tbd.push(hclose());
	hbutton('back (no write)',xml_ie_back_no_write,onceel).className='npnb';tbd.push(hclose());
	g.drop_file_input=hopen('input');hcurr().className='npnb';hcurr().type='file';hstyle('grid-column','1/3');tbd.push(hclose());
	hbutton('import',xml_ie_import).className='npnb';tbd.push(hclose());
	hbutton('export',xml_ie_export).className='npnb';tbd.push(hclose());
	hfieldset('status');
	hstyle('grid-column','1/3');
		(g.status=hopen('ul')).className='linside';
		hclose('ul');
	hclose('fieldset');
	push_gui(hclose('div'));
}

function xml_ie_back_no_write(){
	var b=current_gui().last_blob_url;
	if(b)URL.revokeObjectURL(b);
	pop_gui();
}

function xml_ie_back(){
	var new_items=current_gui().new_items;
	xml_ie_back_no_write();
	if(!new_items)return;
	var old_items=current_gui().cc_dict,i=new_items.length;
	if(old_items.length>i)old_items.length=i;
	while(i)old_items[--i]=new_items[i];
	dict_editor_add_lis();
}

function xml_ie_show_error(e){
	console.error(e);
	var li=cre('li'),g=current_gui();
	li.setAttribute('style','background-color:#F00;');
	li.textContent=e;
	g.status.appendChild(li);
	tbd_set_disabled(false);
}

function xml_ie_filereader_onerror(){
	xml_ie_show_error(this.error);
}

function xml_ie_filereader_onload(){
	try{
		var d=document.implementation.createDocument(null,'d',null).documentElement;
		d.innerHTML=this.result;
		var g=current_gui();
		g.new_items=cc_parse_dict(d.children);
		d=cre('li');
		d.setAttribute('style','background-color:#0F0;');
		d.textContent='imported';
		g.status.appendChild(d);
		tbd_set_disabled(false);
	}catch(error){
		xml_ie_show_error(error);
	}
}

function xml_ie_import(){
	var g=current_gui(),f=g.last_blob_url;
	if(f){
		URL.revokeObjectURL(f);
		g.last_blob_url='';
	}
	f=g.drop_file_input.files[0];
	g.status.innerHTML='<li>importing</li>';
	if(!f){
		f=cre('li');
		f.setAttribute('style','background-color:#F00;');
		f.textContent='no file';
		g.status.appendChild(f);
		return;
	}
	tbd_set_disabled(true);
	try{
		var fr=new FileReader();
		fr.addEventListener('error',xml_ie_filereader_onerror,onceel);
		fr.addEventListener('load',xml_ie_filereader_onload,onceel);
		fr.readAsText(f);
	}catch(error){
		xml_ie_show_error(error);
	}
}

function xml_ie_export(){
	var l=guis.length,g=guis[l-1],blob=g.last_blob_url,x;
	if(blob){
		URL.revokeObjectURL(blob);
		g.last_blob_url='';
	}
	g.status.innerHTML='<li>exporting</li>';
	try{
		blob=[];
		if((l=guis[l-2].cc_dict).length){
			(x=new CcXmlMaker(blob.push.bind(blob),0)).d(l);
			x.f();
		}
		l=cre('a');
		l.href=g.last_blob_url=URL.createObjectURL(new Blob(blob,xmlblobopts));
		l.rel='noreferrer';
		l.download='dict.xml';
		l.textContent='exported, click me to save';
		blob=cre('li');
		blob.setAttribute('style','background-color:#0F0;');
		blob.appendChild(l);
		g.status.appendChild(blob);
	}catch(error){
		xml_ie_show_error(error);
	}
}

function path_link_onclick(){
	var g=current_gui(),ul=g.items_list;
	g.cc_dict=this.cc_dict;
	dict_editor_add_lis();
	this.disabled=true;
	g=this.parentNode;
	while(this!==(ul=g.lastChild))g.removeChild(ul);
}

function dict_editor_add_path_link(dict,name){
	var p=current_gui().path_list,b=cre('input'),l=p.lastChild;
	b.type='button';
	b.value=JSON.stringify(name).slice(1,-1);
	b.cc_dict=dict;
	b.onclick=path_link_onclick;
	if(l)l.disabled=false;
	return p.appendChild(b);
}

function dict_editor_add_item(item,index){
	var g=current_gui(),b=cre('input'),d=cre('div'),dict=b.cc_dict=g.cc_dict,il=g.items_list;
	d.draggable=true;
	d.ondragstart=dict_item_div_ondragstart;
	d.ondragend=dict_item_div_ondragend;
	d.ondragover=dict_item_div_ondragover;
	d.ondragenter=dict_item_div_ondragenter;
	d.ondragleave=dict_item_div_ondragleave;
	d.ondrop=dict_item_div_ondrop;
	d.setAttribute('role','listitem');
	d.dataset.itemDivAnim='';
	b.cc_dict_item=item;
	b.type='button';
	b.value=dict_item_display_string(item);
	b.onclick=dict_item_onclick;
	b.oncontextmenu=dict_item_oncontextmenu;
	d.appendChild(b);
	if('number'===typeof index&&index<dict.length){
		il.insertBefore(d,il.childNodes[index]);
		dict.splice(index,0,item);
	}else{
		il.appendChild(d);
		dict.push(item);
	}
	return b;
}

function dict_editor_add_d_item(){
	dict_editor_add_item({'key':'key','type':'d','value':[]}).click();
}

function dict_editor_add_s_item(){
	dict_editor_add_item({'key':'key','type':'s','value':'value'}).click();
}

function dict_item_oncontextmenu(event){
	event.preventDefault();
	if(current_gui().dataset.selectMode==='1')return;
	var item=this.cc_dict_item;
	if(item.type==='d')dict_editor_add_path_link(item.value,item.key).click();
}

function dict_item_div_ondragstart(dt){
	var g=current_gui();
	g.dragging_item=this;
	g.items_list.classList.add('dragging_item');
	dt=dt.dataTransfer;
	dt.clearData();
	dt.setData('text/plain',this.firstChild.value);
	dt.effectAllowed='move';
}

function dict_item_div_ondragend(){
	var g=current_gui();
	g.dragging_item=null;
	g.items_list.classList.remove('dragging_item');
}

function dict_item_div_ondragover(event){
	if(current_gui().dragging_item)event.preventDefault();
}

function dict_item_div_ondragenter(event){
	if(current_gui().dragging_item){
		event.preventDefault();
		this.dataset.draggingOver='';
	}
}

function dict_item_div_ondragleave(event){
	delete this.dataset.draggingOver;
}

function dict_item_div_ondrop(event){
	var g=current_gui(),d=g.dragging_item;
	if(d){
		event.preventDefault();
		delete this.dataset.draggingOver;
		d.dataset.itemDivAnim='';
		g.items_list.insertBefore(d,this);
		dict_editor_update_from_dom();
	}
}

function open_value_in_dict_editor_onclick(){
	var i=current_gui().edit_button.cc_dict_item;
	item_editor_back_button_onclick();
	dict_editor_add_path_link(i.value,i.key).click();
}

function open_value_in_encoded_string_editor_onclick(){
	var g=current_gui(),i=current_gui().value_input;
	string_editor(function(n){
		set_toggler(g.value_toggler,n.length<=10000,true);
		i.value=n;
	},null,i.value);
}

function open_value_in_object_editor_onclick(){
	var g=current_gui(),i=g.value_input;
	try{
		new ObjEditor(i.value,function(n){
			set_toggler(g.value_toggler,n.length<=10000,true);
			i.value=n;
		});
	}catch(error){
		say_error('object editor',error);
	}
}

function dict_item_onclick(){
	if(current_gui().dataset.selectMode==='1'){
		if(this.dataset.stuckActive==null)this.dataset.stuckActive='';
		else delete this.dataset.stuckActive;
		return;
	}
	this.dataset.stuckActive='';
	var g=hopen('div'),f,item=this.cc_dict_item;
	g.dataset.isModal='display:grid;grid-template-columns:auto auto;';
	g.edit_button=this;
		hbutton('back',item_editor_back_button_onclick);hclose();
		hbutton('back (no write)',item_editor_back_no_write_button_onclick,onceel);hclose();
		hopen('h2');
		hstyle('line-height','32px');
		hstyle('grid-column','1/3');
		hstyle('white-space','pre');
			htext('editing item #');
			g.item_num_tn=htext(1+this.cc_dict.indexOf(item));
		hclose('h2');
		(f=g.key_input=textarea_in_fieldset(g,'key','display:flex;flex-direction:row;grid-column-end:3;grid-column-start:1;')).value=item.key;
		f.style.setProperty('flex-grow','1');
		(f=g.type_input=input_in_fieldset(g,'type','text','display:flex;flex-direction:row;grid-column-end:3;grid-column-start:1;')).value=item.type;
		f.style.setProperty('flex-grow','1');
		f.minLength=f.maxLength=1;
		f.pattern='[a-z]';
		if(item.type==='d'){
			f.disabled=true;
			hbutton('open value in dict editor',open_value_in_dict_editor_onclick);
			hstyle('grid-column','1/3');
			hclose();
		}else{
			hfieldset('value');
			hstyle('display','flex');
			hstyle('flex-direction','column');
			hstyle('grid-column','1/3');
				f=g.value_input=cre('textarea');
				f.value=item.value;
				f.style.setProperty('flex-grow','1');
				set_toggler(g.value_toggler=add_toggler(hopen('div').appendChild(f)),item.value.length<=10000).setAttribute('style','margin:auto 0;');
				hstyle('display','flex');
				hstyle('flex-direction','row');
				hclose('div');
				hbutton('open in encoded string editor',open_value_in_encoded_string_editor_onclick);hclose();
				hbutton('open in object editor',open_value_in_object_editor_onclick);hclose();
			hclose('fieldset');
		}
		hbutton('duplicate item',item_editor_duplicate);hclose();
		hbutton('delete item',item_editor_delete_button_onclick);hclose();
	push_gui(hclose('div'));
}

function item_editor_duplicate(){
	var g=current_gui(),eb=g.edit_button,i=eb.cc_dict_item;
	if(i.type==='d')i={'key':g.key_input.value,'type':'d','value':JSON.parse(JSON.stringify(i.value))};
	else{
		var t=g.type_input.value;
		if(!t){
			alert('empty type');
			return;
		}
		if(t==='d'){
			alert('can\'t set type to <d> because not dict');
			return;
		}
		if(!valid_type_re.test(t)){
			alert('invalid type '+t);
			return;
		}
		i={'key':g.key_input.value,'type':t,'value':g.value_input.value};
	}
	delete eb.dataset.stuckActive;
	(g.edit_button=do_under_current_gui(dict_editor_add_item,[i,(g.item_num_tn.nodeValue=2+eb.cc_dict.indexOf(eb.cc_dict_item))-1])).dataset.stuckActive='';
}

function item_editor_back_no_write_button_onclick(){
	delete current_gui().edit_button.dataset.stuckActive;
	pop_gui();
}

function item_editor_back_button_onclick(){
	var g=current_gui(),b=g.edit_button,i=b.cc_dict_item;
	if(i.type!=='d'){
		var t=g.type_input.value;
		if(!t){
			alert('empty type');
			return;
		}
		if(t==='d'){
			alert('can\'t set type to <d> because not dict');
			return;
		}
		if(!valid_type_re.test(t)){
			alert('invalid type '+t);
			return;
		}
		i.type=g.type_input.value;
		i.value=g.value_input.value;
	}
	i.key=g.key_input.value;
	b.value=dict_item_display_string(i);
	delete b.dataset.stuckActive;
	pop_gui();
}

function item_editor_delete_button_onclick(){
	var g=current_gui(),b=g.edit_button,d=b.cc_dict,i=b.cc_dict_item;
	if(!confirm('are you sure you want to delete '+g.item_num_tn.nodeValue+'. '+b.value+'?'))return;
	d.splice(d.indexOf(i),1);
	g=b.parentNode;
	g.parentNode.removeChild(g);
	pop_gui();
}

function push_search(){
	var g=gui_div_with_html('display:flex;flex-direction:column;',
'<div style="display:flex;flex-direction:row;">\
<input onclick="pop_gui();" style="flex-grow:1;margin:0 1px;height:25px;padding:0;" type="button" value="back"/>\
<label class="btn" style="flex-grow:1;margin:0;display:flex;height:25px;padding:0;">\
<input style="margin:auto 0 auto auto;width:18px;height:18px;" checked="" onchange="var g=current_gui();g[this.checked?&quot;appendChild&quot;:&quot;removeChild&quot;](g.ul_container);" type="checkbox"/>\
<span style="margin:auto auto auto 0;">\
 <strong>0</strong> results\
</span>\
</label>\
<input onclick="try{search_result();}catch(error){say_error(&quot;search&quot;,error);}" style="flex-grow:1;margin:0 1px;height:25px;padding:0;" type="button" value="search"/>\
</div>\
<table style="border-spacing:1px;width:100%;">\
<thead>\
<tr>\
<th class="tdf"><input onclick="var g=current_gui();g.tbody.appendChild(g.tr_template.cloneNode(true));" style="font-weight:bold;" type="button" value="+"/></th>\
<th class="bor1" style="width:25px;">xor</th>\
<th class="bor1">regexp</th>\
<th class="bor1">regexp flags</th>\
<th class="bor1">target</th>\
</tr>\
</thead>\
<tbody onclick="if(event.target.matches(&quot;input[type=button]&quot;))this.removeChild(event.target.parentNode.parentNode);">\
<tr>\
<td class="tdf"><input type="button" value="-"/></td>\
<td class="tdi"><input type="checkbox"/></td>\
<td class="tdi"><input type="text"/></td>\
<td class="tdi"><input type="text"/></td>\
<td class="tdi"><select>\
<option>key</option>\
<option>type</option>\
<option>value</option>\
</select></td>\
</tr>\
</tbody>\
</table>\
<div style="height:200px;flex-shrink:0;" class="resizebox">\
<ul style="white-space:pre;margin:2px 0;"></ul>\
</div>');
	g.tr_template=(g.tbody=g.querySelector('tbody')).firstChild.cloneNode(true);
	g.results_count=g.firstChild.querySelector('strong');
	g.cc_dict=current_gui().cc_dict;
	g.ul=(g.ul_container=g.lastChild).firstChild;
	push_gui(g);
}

function search_result(){
	var g=current_gui(),querys=Array.prototype.map.call(g.tbody.childNodes,search_tr_to_obj),path=[],results_count=0,frag=document.createDocumentFragment(),results_ul=g.ul;
	(function f(dict){
		var ol,inp,i=0,i2,p,dict_len=dict.length,item,path_len=path.push(null)-1;
		while(dict_len>i){
			if(search_test_querys(item=dict[i++],querys)){
				if(!ol){
					ol=frag.appendChild(cre('li'));
					inp=ol.appendChild(cre('input'));
					inp.type='button';
					inp.onclick=structure_finder_dict_onclick;
					inp.dict_relative_path=path.slice(0,path_len);
					p='./';
					i2=0;
					while(path_len>i2)p+=path[i2++].key+'/';
					inp.value=p;
					ol=ol.appendChild(cre('ol'));
				}
				inp=ol.appendChild(cre('li'));
				inp.value=i;
				inp.textContent=dict_item_display_string(item);
				++results_count;
			}
			if(item.type==='d'){
				path[path_len]=item;
				f(item.value);
			}
		}
		path.pop();
	})(g.cc_dict);
	if(results_ul.replaceChildren)results_ul.replaceChildren(frag);
	else{
		results_ul.textContent='';
		results_ul.appendChild(frag);
	}
	g.results_count.textContent=results_count;
}

function search_tr_to_obj(tr){
	tr=tr.childNodes;
	return {
		'xor':tr[1].firstChild.checked,
		'regexp':RegExp(tr[2].firstChild.value,tr[3].firstChild.value),
		'target':tr[4].firstChild.value
	};
}

function search_test_querys(item,querys){
	var i=0,l=querys.length,obj,is_dict=item.type==='d';
	while(l>i){
		obj=querys[i++];
		if(obj.xor===(!(is_dict&&obj.target==='value')&&obj.regexp.test(item[obj.target])))return false;
	}
	return true;
}

function push_rename_helper(){
	var g=gui_div_with_html('display:flex;flex-direction:column;',sof(
'<input type="button" value="back"/>\
<details>\
<summary>help</summary>\
syntax: <span class="w"><em>text</em>{<wbr/><em>increment=0;<wbr/>min=$MIN_SAFE_INTEGER;<wbr/>max=$MAX_SAFE_INTEGER</em><wbr/>}</span>\
<ul style="margin:0;">\
<li>&quot;{{&quot; is &quot;{&quot; escape</li>\
<li>&quot;{}&quot; = &quot;{;;}&quot; = &quot;{;}&quot; = &quot;{0;$MIN_SAFE_INTEGER;$MAX_SAFE_INTEGER}&quot;</li>\
<li>&quot;{;2}&quot; = &quot;{0;2;$MAX_SAFE_INTEGER}&quot;</li>\
<li>&quot;{+69}&quot; = &quot;{69}&quot;</li>\
</ul>\
examples:\
<ul style="margin:0;">\
<li><span class="wp">aaa{1}bbb{-1}ccc</span> renames &quot;aaa10bbb20ccc&quot; to &quot;aaa11bbb19ccc&quot;</li>\
<li><span class="wp">{1}420</span> doesn&apos;t rename &quot;69420&quot;</li>\
<li><span class="wp">x{}x</span> doesn&apos;t rename &quot;potato&quot;</li>\
<li><span class="wp">{1;;1}</span> renames &quot;1&quot; to &quot;2&quot;</li>\
<li><span class="wp">{1;;1}</span> doesn&apos;t rename &quot;2&quot;</li>\
</ul>\
</details>\
<textarea></textarea>\
<input type="button" value="rename"/>',Number));
	g.cc_dict=current_gui().cc_dict;
	g.command_input=g.querySelector('textarea');
	g.firstChild.addEventListener('click',pop_gui,onceel);
	g.lastChild.addEventListener('click',rename_onclick,passiveel);
	push_gui(g);
}

function rename_onclick(){
	try{
		var g=current_gui(),c=string_to_rename_command(g.command_input.value),d=g.cc_dict,i=d.length;
		while(i--)d[i].key=apply_rename_command(c,d[i].key);
		do_under_current_gui(dict_editor_update_inputs);
	}catch(error){
		say_error('rename',error);
	}
}

function str_to_int(str){
	var int=str-0;
	if(Number.isSafeInteger(int))return int;
	throw Error('can\'t understand '+JSON.stringify(str)+' as integer');
}

function string_to_rename_command(str){
	var prev_i,i=0,tokens=[],nend,join=false,nstr;
	function add_token(t){
		if(join)tokens[tokens.length-1]+=t;
		else{
			join=true;
			tokens.push(t);
		}
	}
	while(-1!==(i=str.indexOf('{',prev_i=i))){
		if(i>prev_i)add_token(str.substring(prev_i,i));
		if(str.charAt(++i)==='{'){
			++i;
			add_token('{');
			continue;
		}
		nend=str.indexOf('}',i);
		if(nend===-1){
			add_token(str.substring(i-1));
			return tokens;
		}
		nstr=str.substring(i,nend).split(';',3);
		nstr[0]=nstr[0]?str_to_int(nstr[0]):0;
		nstr[1]=nstr[1]?str_to_int(nstr[1]):Number.MIN_SAFE_INTEGER;
		nstr[2]=nstr[2]?str_to_int(nstr[2]):Number.MAX_SAFE_INTEGER;
		tokens.push(nstr);
		join=false;
		i=nend+1;
	}
	if(str.length>prev_i)add_token(str.substring(prev_i));
	return tokens;
}

var sticky_int_re=RegExp('-?[0-9]+','y');

function apply_rename_command(tokens,str){
	var ti=0,si=0,tl=tokens.length,token,res,out='';
	while(tl>ti){
		token=tokens[ti++];
		if(typeof token==='string'){
			if(token!==str.substring(si,si+=token.length))return str;
			out+=token;
			continue;
		}
		sticky_int_re.lastIndex=si;
		res=sticky_int_re.exec(str);
		if(res===null)return str;
		res=res[0];
		si+=res.length;
		if(!Number.isSafeInteger(res-=0)||res<token[1]||res>token[2]||!Number.isSafeInteger(res+=token[0]))return str;
		out+=res;
	}
	if(str.length>si)return str;
	return out;
}