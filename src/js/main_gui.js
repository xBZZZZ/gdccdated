'use strict';

var git_commit='';//modified by out.sh

function ccarticle_back_onclick(){
	pop_gui();
	location.hash='';
}

function push_ccatricle(){
	var g=cre('article');
	g.innerHTML='<input type="button" value="back"/>\
<details open="" class="bigd">\
<summary>how to decode CC*.dat file (windows and android)?</summary><ol>\
<li>read <strong class="wp">floor(<var>file size in bytes</var> / 4) * 4</strong> bytes from file<ul><li>\
don&apos;t read entire file because there can be 1 or 2 bytes of garbage because <a href="https://github.com/gd-programming/gd.docs/pull/107#issuecomment-1380542961" rel="noreferrer" target="_blank">robtop messed up base64 length calculation</a>\
</li></ul></li>\
<li>xor all bytes with <code class="wpb">0x0B</code></li>\
<li><a href="https://docs.python.org/3/library/base64.html#base64.urlsafe_b64decode" rel="noreferrer" target="_blank">url safe base64 decode</a></li>\
<li>decompress as gzip</li>\
</ol>\
</details>\
<details open="" class="bigd">\
<summary>how to decode CC*.dat file (mac os and ios)?</summary>\
<ol>\
<li><strong><a href="https://www.highgo.ca/2019/08/08/the-difference-in-five-modes-in-the-aes-encryption-algorithm/" rel="noreferrer" target="_blank">AES-ECB</a> 256</strong> decrypt with key=<wbr/><q class="wpb" style="quotes:none;" cite="https://github.com/Wyliemaster/GD-Save-Decryptor/blob/main/saves.py#L43">ipu9TUv54yv]isFMh5@;t.5w34E2Ry@{</q></li>\
<li>remove padding (last <var style="font-weight:bold;">value of last byte</var> bytes are equal and in range [1;16] and are padding)</li>\
</ol></details>\
<details open="" class="bigd">\
<summary>geometry dash can load non-encoded XML files (windows and android)</summary><ul>\
<li>file name ends with <strong class="wp">.dat</strong>, not <strong class="wp">.xml</strong>!</li>\
<li>doesn&apos;t work with mac os version</li>\
</ul></details>\
<details style="background-color:#272822;" open="" class="bigd">\
<summary>linux shell command to decode CC*.dat file (windows and android)</summary>\
<code style="white-space:pre-wrap;"><span style="color:#959077;"># replace $CCFILE with input file path&#10;# replace $DECODEDCCFILE with output file path</span><span style="color:#f8f8f2;">&#10;xxd -p -c4 </span><span style="color:#e6db74;">&quot;</span><span style="color:#f8f8f2;">$CCFILE</span><span style="color:#e6db74;">&quot; </span><span style="color:#f8f8f2;">| gawk </span><span style="color:#e6db74;">&apos;length($0)==8{printf&quot;%08x&quot;,xor(0xb0b0b0b,strtonum(&quot;0x&quot;$0))}&apos; </span><span style="color:#f8f8f2;">| xxd -p -r | tr </span><span style="color:#e6db74;">&apos;_-&apos; &apos;/+&apos; </span><span style="color:#f8f8f2;">| base64 -d | gzip -cd &gt; </span><span style="color:#e6db74;">&quot;</span><span style="color:#f8f8f2;">$DECODEDCCFILE</span><span style="color:#e6db74;">&quot;</span></code>\
</details>\
<details style="background-color:#272822;" open="" class="bigd">\
<summary>mac os and linux shell command to decode CC*.dat file (mac os and ios)</summary>\
<code style="white-space:pre-wrap;"><span style="color:#959077;"># replace $CCFILE with input file path&#10;# replace $DECODEDCCFILE with output file path</span><span style="color:#f8f8f2;">&#10;openssl aes-256-ecb -in </span><span style="color:#e6db74;">&quot;</span><span style="color:#f8f8f2;">$CCFILE</span><span style="color:#e6db74;">&quot; </span><span style="color:#f8f8f2;">-out </span><span style="color:#e6db74;">&quot;</span><span style="color:#f8f8f2;">$DECODEDCCFILE</span><span style="color:#e6db74;">&quot; </span><span style="color:#f8f8f2;">-d -K 69707539545576353479765D6973464D6835403B742E3577333445325279407B</span></code>\
</details>\
<details open="" class="bigd">\
<summary>other CC*.dat file tools</summary><strong>WARNING (doesn&apos;t apply to mac os and ios saves):</strong> some of these sometimes don&apos;t work because they read entire file instead of just <strong class="wp">floor(<var>file size in bytes</var> / 4) * 4</strong> bytes<ul>\
<li>'+linkf('https://www.youtube.com/watch?v=OA4918DQxG0')+'</li>\
<li>'+linkf('https://gdcolon.com/gdsave/')+'</li>\
<li>'+linkf('https://github.com/WEGFan/Geometry-Dash-Savefile-Editor')+'</li>\
<li>'+linkf('https://github.com/Wyliemaster/GD-Save-Tools')+'</li>\
<li>'+linkf('https://github.com/Wyliemaster/GD-Save-Decryptor')+' (can decrypt mac os and ios saves, doesn&apos;t remove padding when padding=16)</li>\
<li>'+linkf('https://github.com/GDColon/GD-Save-Decoder')+'</li>\
<li>'+linkf('https://geometry-dash.fandom.com/wiki/User:XBZZZZALT#backup_of_useful_stuff_from_Save_Files_page')+'</li>\
<li>'+linkf('https://wyliemaster.github.io/gddocs/#/topics/localfiles_encrypt_decrypt')+'</li>\
</ul></details>';
	g.firstChild.addEventListener('click',ccarticle_back_onclick,onceel);
	push_gui(g);
	location.hash='#ccarticle';
}

hopen('div').className='vbox';
hcurr().innerHTML='<h1><a href="https://gdccdated.glitch.me/index.xhtml" rel="noreferrer" style="text-decoration:none;" title="link to myself">CCGameManager.dat or CCLocalLevels.dat editor</a></h1>\
<hr style="margin:0;"/>\
<h2>make a backup of CCGameManager.dat and CCLocalLevels.dat to be able to unbreak geometry dash</h2>';
(hcurr().drop_file_input=hopen('input')).type='file';hcurr().className='thiccb';hclose();
hopen('input').type='button';
hcurr().value='load encrypted (windows and android)';
if('function'===typeof DecompressionStream)hcurr().addEventListener('click',function(){
	var f=current_gui().drop_file_input.files[0];
	if(f)cc_load_gzip(f);else alert('no file');
},passiveel);else{
	hcurr().title='your browser doesn\'t support DecompressionStream';
	hcurr().disabled=true;
}
hcurr().className='thiccb';
hclose('input');
hopen('input').type='button';
hcurr().value='load encrypted (mac os and ios)';
if('object'===typeof subtlecrypto)hcurr().addEventListener('click',function(){
	var f=current_gui().drop_file_input.files[0];
	if(f)cc_load_aes(f);else alert('no file');
},passiveel);else{
	hcurr().title=subtlecrypto;
	hcurr().disabled=true;
}
hcurr().className='thiccb';
hclose('input');
hbutton('load xml',function(){
	var f=current_gui().drop_file_input.files[0];
	if(f)cc_load_xml(f);else alert('no file');
}).className='thiccb';hclose();
hcurr().appendChild(cre('hr'));
hbutton('open encoded string editor',string_editor.bind(null,null,'')).className='thiccb';hclose();
hbutton('open empty dict editor',function(){
	push_dict_editor([],'fake root');
}).className='thiccb';hclose();
hcurr().appendChild(cre('hr'));
hbutton('about CC*.dat files',push_ccatricle).className='thiccb';hclose().insertAdjacentHTML('afterend','<a class="btn thiccb" href="https://wyliemaster.github.io/gddocs/#/resources/client/gamesave" rel="noreferrer" target="_blank"><q cite="https://wyliemaster.github.io/gddocs/#/resources/client/gamesave">Client Gamesave Resource</q> on wyliemaster.github.io/gddocs</a>\
<a class="btn thiccb" href="https://github.com/Wyliemaster/gddocs/tree/master" rel="noreferrer" target="_blank">gddocs (wyliemaster fork) github</a>\
<a class="btn thiccb" href="https://github.com/gd-programming/gd.docs/tree/docs" rel="noreferrer" target="_blank">gddocs (<em>docs</em> branch, original) github</a>\
<a class="btn thiccb" href="https://github.com/xBZZZZ/gdccdated/issues" rel="noreferrer" target="_blank">report bug or suggestion on github</a>\
<div class="git_commit">'+(
	git_commit?'<a href="https://github.com/xBZZZZ/gdccdated/commit/'+git_commit+'" rel="noreferrer" target="_blank">git commit '+git_commit+'</a>'
	:'git commit unknown'
)+' | <a href="https://gdccdated.glitch.me/gdccdated_standalone.xhtml" rel="noreferrer" download="gdccdated_standalone.xhtml" title="save link as if clicking doesn&apos;t work">download latest standalone xhtml</a></div>');
push_gui(hclose('div'));

if(location.hash==='#ccarticle')push_ccatricle();