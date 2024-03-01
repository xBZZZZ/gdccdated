'use strict';

function save_modal_back_onclick(){
	URL.revokeObjectURL(this.dataset.bloburl);
	pop_gui();
}

function save_modal(buffers,name,blobopts){
	set_loading(false);
	var g=div_with_html('<a rel="noreferrer" class="btn thiccb">save <strong></strong></a><input class="thiccb" type="button" value="back"/>'),a=g.firstChild,b=a.href=URL.createObjectURL(new Blob(buffers,blobopts));
	a.lastChild.textContent=a.download=name;
	a=g.lastChild;
	a.dataset.bloburl=b;
	a.addEventListener('click',save_modal_back_onclick,onceel);
	g.className='vbox';
	push_gui(g,true);
}

function reload_onclick(){
	location.reload();
}

function push_loading_modal(file_name){
	var g=div_with_html('<h2 style="white-space:pre-wrap;margin:0 0 5px;"><span class="loading"></span> loading</h2><input class="thiccb" type="button" value="reload"/>');
	g.dataset.ccFileName=file_name;
	g.error_tag=g.firstChild;
	g.lastChild.addEventListener('click',reload_onclick,onceel);
	g.className='vbox';
	push_gui(g,true);
	set_loading(true);
}

var valid_type_re=RegExp('^[a-z]$','');

function cc_parse_dict(chl){
	var i=0,len=chl.length,k,v,out=[],vt;
	if(len&1){
		console.error('children:',chl);
		throw Error('odd number of children: '+len);
	}
	while(len>i){
		k=chl[i++];
		if(k.tagName!=='k'){
			console.error('not <k>:',k);
			throw Error('tag name is not <k> but <'+k.tagName+'>');
		}
		if(k.firstElementChild){
			console.error('<k>:',k);
			throw Error('<k> contains elements');
		}
		if(k.attributes.length){
			console.error('<k>:',k);
			throw Error('<k> has attributes');
		}
		vt=(v=chl[i++]).tagName;
		if(v.attributes.length){
			console.error('<'+vt+'>:',v);
			throw Error('<'+vt+'> has attributes');
		}
		if(vt==='d'){
			out.push({
				'key':k.textContent,
				'type':'d',
				'value':cc_parse_dict(v.children)
			});
			continue;
		}
		if(!valid_type_re.test(vt)){
			console.error('<'+vt+'>:',v);
			throw Error('invalid value type: '+vt);
		}
		if(v.firstElementChild){
			console.error('<'+vt+'>:',v);
			throw Error('<'+vt+'> contains elements (expected only text)');
		}
		out.push({
			'key':k.textContent,
			'type':vt,
			'value':v.textContent
		});
	}
	return out;
}

function cc_load_xml_string(plist){
	try{
		plist=new DOMParser().parseFromString(plist,'application/xml').documentElement;
		if(plist.tagName!=='plist'){
			console.error('root:',plist);
			throw Error('root tag name isn\'t <plist> but <'+plist.tagName+'>');
		}
		var domattrs=plist.attributes,a=plist.children;
		if(a.length!==1){
			console.error('<plist>:',plist);
			throw Error('number of children in <plist> is not 1 but '+a.length);
		}
		a=a[0];
		if(a.tagName!=='dict'){
			console.error('<plist>:',plist);
			throw Error('<plist>\'s child is not <dict> but <'+a.tagName+'>');
		}
		if(a.attributes.length){
			console.error('<dict>:',a);
			throw Error('<dict> has attributes');
		}
		var i=0,len=domattrs.length,attrs=[];
		while(len>i){
			plist=domattrs[i++];
			attrs.push(plist.name,plist.value);
		}
		load_cc_data({
			'attrs':attrs,
			'dict':cc_parse_dict(a.children)
		});
	}catch(error){
		say_error('xml parse',error);
		return;
	}
}

function open_in_dict_editor_onclick(){
	var g=current_gui(),e=g.dict_editor;
	if(e)push_gui(e);else{
		push_dict_editor(g.cc_data.dict,g.dataset.ccFileName);
		(g.dict_editor=current_gui()).dataset.reusable='';
	}
}

function save_gzip_onclick(){
	set_loading(true);
	var g=current_gui();
	cc_save_gzip(g.cc_data,g.dataset.ccFileName);
}

function save_aes_onclick(){
	set_loading(true);
	var g=current_gui();
	cc_save_aes(g.cc_data,g.dataset.ccFileName,g.progbar);
}

function save_xml_onclick(){
	set_loading(true);
	try{
		var a=[],m=new CcXmlMaker(a.push.bind(a),2),g=current_gui();
		m.r(g.cc_data);
		m.f();
		save_modal(a,g.dataset.ccFileName,xmlblobopts);
	}catch(error){
		say_error('save xml',error);
	}
}

function load_cc_data(cc_data){
	set_loading(false);
	hstack.push(document.createDocumentFragment());
	hbutton('back',pop_gui,onceel).className='thiccb';var g=current_gui(),tbd=g.tbd=[hclose()];
	hopen('h2').style.margin='5px 0';hcurr().textContent='done';hclose();
	hbutton('open in dict editor',open_in_dict_editor_onclick).className='thiccb';tbd.push(hclose());
	hopen('input').type='button';
	hcurr().value='save encrypted (windows and android)';
	if('function'===typeof CompressionStream){
		hcurr().addEventListener('click',save_gzip_onclick,passiveel);
		tbd.push(hcurr());
	}else{
		hcurr().title='your browser doesn\'t support CompressionStream';
		hcurr().disabled=true;
	}
	hcurr().className='thiccb';
	hclose('input');
	hopen('input').type='button';
	hcurr().value='save encrypted (mac os and ios) (slow)';
	hcurr().className='thiccb';
	if('object'===typeof subtlecrypto){
		hcurr().addEventListener('click',save_aes_onclick,passiveel);
		tbd.push(hclose('input'));
		(g.progbar=hopen('progress')).title='encrypting (mac os and ios) (slow)';
		hcurr().max=64;
		hcurr().value=0;
		hstyle('display','none');
	}else{
		hcurr().title=subtlecrypto;
		hcurr().disabled=true;
	}
	hclose();
	hbutton('save xml',save_xml_onclick).className='thiccb';tbd.push(hclose());
	hbutton('open copy in new tab',copy_to_new_tab).className='thiccb';hclose();
	g.error_tag=null;
	g.cc_data=cc_data;
	if(g.replaceChildren)g.replaceChildren(hclose());
	else{
		g.textContent='';
		g.appendChild(hclose());
	}
}

function copy_to_new_tab(){
	try{
		var win=window.open(location.href,'_blank','');
		if(!win){
			alert('window.open returned not object\n\nmaybe because popup blocker');
			return;
		}
		try{
			win.opener=null;
		}catch(error){}
		var g=current_gui(),name=g.dataset.ccFileName,json=JSON.stringify(g.cc_data);
		win.addEventListener('DOMContentLoaded',function ld(){
			try{
				if(no_support_once)win.removeEventListener('DOMContentLoaded',ld,onceel);
				var g=win.cre('div');
				g.dataset.ccFileName=name;
				g.className='vbox';
				win.push_gui(g,true);
				win.load_cc_data(win.JSON.parse(json));
			}catch(error){
				say_error('open copy in new tab (ld)',error);
			}
		},onceel);
	}catch(error){
		say_error('open copy in new tab',error);
	}
}

function file_reader_onerror(){
	say_error('FileReader',this.error);
}

var xor2chr,chr2xor;
(function(){
	var i=new ArrayBuffer(512),chr;
	xor2chr=new Uint8Array(i,0,256);
	chr2xor=new Uint8Array(i,256,256);
	i=63;
	xor2chr[chr2xor['+'.charCodeAt(0)]='-'.charCodeAt(0)^11]='+'.charCodeAt(0);
	xor2chr[chr2xor['/'.charCodeAt(0)]='_'.charCodeAt(0)^11]='/'.charCodeAt(0);
	while(i){
		chr='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789='.charCodeAt(--i);
		xor2chr[chr2xor[chr]=0x0B^chr]=chr;
	}
})();

function cc_load_gzip_file_reader_onload(){
	try{
		var str,pos=0,ch=String.fromCharCode,cc=this.result,len=cc.byteLength;
		//force len to be mulple of 4 because sometimes there is junk at the end
		len-=len&3;
		cc=new Uint8Array(cc,0,len);
		while(len>pos)cc[pos]=xor2chr[cc[pos++]];
		if(len>8192){
			str=ch.apply(null,cc.subarray(0,pos=8192));
			while(len>pos)str+=ch.apply(null,cc.subarray(pos,pos+=8192));
		}else str=ch.apply(null,cc);
		cc=cc.subarray(pos=0,(str=atob(str)).length);
		while(len>pos)cc[pos]=str.charCodeAt(pos++);
	}catch(error){
		say_error('xor 11+base64 decode',error);
		return;
	}
	try{
		str=new DecompressionStream('gzip');
		ch=str.writable.getWriter();
		ch.write(cc);
		ch.close();
		new Response(str.readable).text().then(cc_load_xml_string,say_error.bind(null,'ungzip (text)'));
	}catch(error){
		say_error('ungzip',error);
	}
}

function cc_load_xml_file_reader_onload(){
	cc_load_xml_string(this.result);
}

function cc_load_gzip(file){
	try{
		push_loading_modal(file.name);
		var fr=new FileReader();
		fr.addEventListener('error',file_reader_onerror,onceel);
		fr.addEventListener('load',cc_load_gzip_file_reader_onload,onceel);
		fr.readAsArrayBuffer(file);
	}catch(error){
		say_error('FileReader',error);
	}
}

function cc_load_aes(file){
	try{
		push_loading_modal(file.name);
		if((fr=file.size)<16)throw Error('file size < 16');
		if(fr&15)throw Error('file size not divisible by 16');
		var fr=new FileReader();
		fr.addEventListener('error',file_reader_onerror,onceel);
		fr.addEventListener('load',cc_load_aes_file_reader_onload,onceel);
		fr.readAsArrayBuffer(new Blob([file,'\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10\x10'],binblobopts));
	}catch(error){
		say_error('FileReader',error);
	}
}

try{
	var aeskey,subtlecrypto=window.crypto.subtle;
}catch(error){
	console.warn('can\'t get window.crypto.subtle:\n\n',error);
}
if(!subtlecrypto||'object'!==typeof subtlecrypto){
	subtlecrypto='can\'t use window.crypto.subtle';
	if('https:'!==location.protocol)subtlecrypto+='\n\ntry using https:';
}

function ensure_aeskey(callback,onerror){
	//key from https://github.com/Wyliemaster/GD-Save-Decryptor/blob/main/saves.py
	return aeskey?callback():subtlecrypto.importKey('raw',string_to_uint8array('ipu9TUv54yv]isFMh5@;t.5w34E2Ry@{').buffer,{'name':'AES-CBC'},false,['encrypt','decrypt']).then(function(k){
		aeskey=k;
		return callback();
	},onerror);
}

function cc_load_aes_file_reader_onload(){
	try{
		//this code is weird because javascript doesn't support AES-ECB
		//so it uses AES-CBC mode and fixes output (first 16 bytes are already correct)
		//see https://www.highgo.ca/2019/08/08/the-difference-in-five-modes-in-the-aes-encryption-algorithm/
		var encryptedi32=new Int32Array(this.result),aesalg={'iv':encryptedi32.subarray(-8,-4),'name':'AES-CBC'},d=encryptedi32.subarray(-4);
		ensure_aeskey(function(){
			//add fake padding:
			//encrypt 16 16s with iv=last 16 bytes of files
			return subtlecrypto.encrypt(aesalg,aeskey,d);
		}).then(function(pad){
			//put first 16 bytes result at end file
			pad=new Int32Array(pad);
			d[0]=pad[0];
			d[1]=pad[1];
			d[2]=pad[2];
			d[3]=pad[3];
			//decrypt with fake padding:
			aesalg.iv=new ArrayBuffer(16);
			return subtlecrypto.decrypt(aesalg,aeskey,encryptedi32);
		}).then(function(decryptedbuf){
			var decrypted=new Int32Array(decryptedbuf),i=decrypted.length;
			//fix output
			while(i>4)decrypted[--i]^=encryptedi32[i-4];
			i=(decrypted=new Uint8Array(decryptedbuf)).length;
			if((decryptedbuf=decrypted[i-1])>16)throw Error('padding > 16');
			if(!decryptedbuf)throw Error('padding = 0');
			var m=i---decryptedbuf;
			while(i>m)if(decryptedbuf!==decrypted[--i])throw Error('padding bytes not all equal');
			cc_load_xml_string(new TextDecoder('utf-8',{
				'fatal':true,
				'ignoreBOM':false
			}).decode(decrypted.subarray(0,m)));
		}).catch(say_error.bind(null,'AES-ECB 256 decrypt'));
	}catch(error){
		say_error('AES-ECB 256 decrypt',error);
	}
}

function cc_save_aes(data,name,prog){
	function onerror(error){
		o=1;
		say_error('AES-ECB 256 encrypt',error);
	}
	try{
		var chunks=[],o=0,i,done=0,pdone=prog.value=0,x=new CcXmlMaker(function(chunk){
			o+=chunk.length;
			chunks.push(chunk);
		},2);
		x.r(data);
		if(!o&&(data=x.a).length>=(i=x.i-(x.i&15)+16))data.fill(i-x.i,x.i,i);
		else{
			x.f();
			i=chunks.length;
			data=new Uint8Array(o-(o&15)+16);
			data.fill(data.length-o,o);
			while(i)data.set(chunks[--i],o-=chunks[i].length);
			i=data.length;
		}
		data=new Int32Array(data.buffer,0,i/=4);
		chunks={'iv':new ArrayBuffer(16),'name':'AES-CBC'};
		prog.setAttribute('style','width:100%;');
		//javascript doesn't support AES-ECB
		//so AES-CBC encrypt each 16 byte chunk individually
		function write_encrypted(e){
			try{
				e=new Int32Array(e);
				var f=this[1];
				data[f]=e[0];
				data[1+f]=e[1];
				data[2+f]=e[2];
				data[3+f]=e[3];
				if(o!==1){
					if(pdone!==(f=Math.floor((done+=4)/i*64)))pdone=prog.value=f;
					if(i===done){
						o=1;
						prog.setAttribute('style','display:none;');
						save_modal([data],name,binblobopts);
					}else if(o<i)encrypt(this);
				}
			}catch(error){
				onerror(error);
			}
		}
		function encrypt(oa){
			subtlecrypto.encrypt(chunks,aeskey,data.subarray(oa[1]=o,o+=4)).then(oa[0],onerror);
		}
		ensure_aeskey(function(){
			try{
				var a,c=0;
				while(c<8&&o<i){
					++c;
					a=[null,0];
					a[0]=write_encrypted.bind(a);
					encrypt(a);
				}
			}catch(error){
				onerror(error);
			}
		},onerror);
	}catch(error){
		onerror(error);
	}
}

function cc_load_xml(file){
	try{
		push_loading_modal(file.name);
		var fr=new FileReader();
		fr.addEventListener('error',file_reader_onerror,onceel);
		fr.addEventListener('load',cc_load_xml_file_reader_onload,onceel);
		fr.readAsText(file);
	}catch(error){
		say_error('FileReader',error);
	}
}

function string_to_uint8array(string){
	if(has_unicode_re.test(string))throw Error('string has characters > U+00FF');
	var len=string.length,i=0,u=new Uint8Array(len);
	while(len>i)u[i]=string.charCodeAt(i++);
	return u;
}

var xmlblobopts={'type':'application/xml;charset=UTF-8'},binblobopts={'type':'application/octet-stream'},xml_escape_re=RegExp('[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[^ !#-%(-;=?-~]','g'),has_unicode_re=RegExp('[\\u0100-\\uFFFF]','');

function xml_escape_replacer(chr){
	switch(chr){
		case '"':return '&quot;';
		case '\'':return '&apos;';
		case '<':return '&lt;';
		case '>':return '&gt;';
		case '&':return '&amp;';
		default:return '&#'+chr.codePointAt(0)+';';
	}
}

function escape_xml(string){
	return string.replace(xml_escape_re,xml_escape_replacer);
}

function CcXmlMaker(w,l){
	this.w=w;
	this.l=l;
	this.i=0;
	this.a=new Uint8Array(131072);
}

CcXmlMaker.prototype.s=function(s){
	var j=0,i=this.i,a=this.a,al=a.length,l=s.length;
	if(al-i<=l){
		while(al>i)a[i++]=s.charCodeAt(j++);
		i=0;
		this.w(a);
		al=l-j;
		this.a=a=new Uint8Array(al-(al&131071)+131072);
	}
	while(l>j)a[i++]=s.charCodeAt(j++);
	this.i=i;
};

CcXmlMaker.prototype.t=function(){
	var i=this.i,l=this.l,a=this.a,s=a.length-i;
	if(s<=l){
		a.fill(9,i);
		i=0;
		l-=s;
		this.w(a);
		this.a=a=new Uint8Array(l-(l&131071)+131072);
	}
	a.fill(9,i,this.i=i+l);
};

CcXmlMaker.prototype.c=function(c){
	this.a[this.i]=c;
	if(this.a.length>++this.i)return;
	this.w(this.a);
	this.a=new Uint8Array(131072);
	this.i=0;
};

CcXmlMaker.prototype.d=function(dict){
	//dict should not be empty
	for(var i=0,l=dict.length,item,tc;;){
		this.t();
		item=dict[i];
		if(item.key){
			this.s('<k>');
			this.s(escape_xml(item.key));
			this.s('</k>\n');
		}else this.s('<k/>\n');
		this.t();
		this.c(60);
		this.c(tc=item.type.charCodeAt(0));
		if(item.value.length){
			this.c(62);
			if('d'===item.type){
				this.c(10);
				++this.l;
				this.d(item.value,true);
				--this.l;
				this.c(10);
				this.t();
				this.s('</d>');
			}else{
				this.s(escape_xml(item.value));
				this.s('</');
				this.c(tc);
				this.c(62);
			}
		}else this.s('/>');
		if(l===++i)return;
		this.c(10);
	}
};

CcXmlMaker.prototype.r=function(cc_data){
	this.s('<?xml version=\'1.0\' encoding=\'UTF-8\' standalone=\'yes\'?>\n<plist');
	var attrs=cc_data.attrs,i=0,l=attrs.length;
	while(l>i){
		this.c(32);
		this.s(attrs[i++]);
		if(attrs[i]){
			this.s('=\'');
			this.s(escape_xml(attrs[i]));
			this.c(39);
		}else this.s('=\'\'');
		++i;
	}
	if(cc_data.dict.length){
		this.s('>\n\t<dict>\n');
		this.d(cc_data.dict);
		this.s('\n\t</dict>\n</plist>');
	}else this.s('>\n\t<dict/>\n</plist>');
};

CcXmlMaker.prototype.f=function(){
	var i=this.i,a=this.a;
	if(i)this.w(a.length>i?a.subarray(0,i):a);
};

function cc_save_gzip(cc_data,name){
	try{
		var c=new CompressionStream('gzip'),s=c.writable.getWriter(),out='',chr=String.fromCharCode,x=new CcXmlMaker(s.write.bind(s),2);
		x.r(cc_data);
		x.f();
		s.close();
		s=c.readable.getReader();
		s.read().then(function ondata(u){
			try{
				var len,i=0;
				if(u.done){
					out=btoa(out);
					u=new Uint8Array(len=out.length);
					while(len>i)u[i]=chr2xor[out.charCodeAt(i++)];
					save_modal([u],name,binblobopts);
					return;
				}
				u=u.value;
				len=u.length;
				if(len>8192)while(len>i)out+=chr.apply(null,u.subarray(i,i+=8192));
				else out+=chr.apply(null,u);
				s.read().then(ondata,cc_gzip_error);
			}catch(error){
				say_error('base64 encode+xor 11',error);
			}
		},cc_gzip_error);
	}catch(error){
		cc_gzip_error(error);
	}
}