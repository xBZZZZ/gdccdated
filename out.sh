#!/bin/bash
set -o errexit -o pipefail
export LC_ALL=C
rootfiles=(s js big_favicon.png favicon.ico css.css tiles.png help.png index.html index_multifile.xhtml)
jsfiles=(cc.js utf8to16.js dict_editor.js structures.js obj_editor.js cselect.js guimgr.js main_gui.js console_helpers.js)

d=$(dirname -- "$0")
cd -- "$d"

./clean.sh
mkdir out out_tmp

function lstart { echo "[ ] $1";}
function lend { echo -e '\e[1A[x';}

lstart "copy files into out/"
[ -f LICENSE.md ] && cp -tout LICENSE.md
cd src
cp -Rt../out "${rootfiles[@]}"
lend

lstart "put git commit into out/js/main_gui.js"
cd ../out/js
if commit=$(git rev-parse HEAD)
then echo "last git commit: $commit"
sed -i "s-git_commit=''-git_commit='$commit'-" main_gui.js
else echo "warning: can't figure out last git commit"
fi
echo -e '\e[2A[x\n'

lstart "generate out_tmp/js_sed_script"
{
sed -E 's-//.*$--
/^$/d
/^var [0-9A-Z_a-z]+=[^=;\]+;$/{
s/^var ([^=]+)=([^;]+);$/s=\\b\1\\b=\2=g/
t
}
s/^/invalid line in inlineables.js: /
w/dev/stderr
Q1' inlineables.js
echo -n '
s-\\\n--g
s-http://-http:/\t/-g
s-https://-https:/\t/-g
s-//[^\n]*\n--g
s-[\t\n]--g'
} > ../../out_tmp/js_sed_script
lend

lstart "generate out_tmp/after_css"
{
echo "</style>\
</head>\
<body>\
<div class='onlylast' id='guis' role='none' aria-hidden='false'></div>\
<div class='onlylast' id='modals' role='none' style='display:none;'></div>\
<div id='drag_cover' role='none' aria-hidden='true' style='display:none;'><div id='drag_arrow' role='none' aria-hidden='true'></div></div>\
<script>'use strict'"';//<![CDATA['
grep -Evh "^('use strict';)?$" "${jsfiles[@]}" | sed -Ezf../../out_tmp/js_sed_script
echo -n '//]]></script></body></html>'
} > ../../out_tmp/after_css
lend

lstart "generate out_tmp/css"
cd ..
sed -Ez 's-[\t\n]|/\*[^*]*\*/--g' css.css > ../out_tmp/css
lend

lstart "generate out_tmp/b64_sed_script"
{
echo -n 's-tiles\.png-data:image/png;base64,'
base64 -w0 tiles.png
echo -n '-;s-help\.png-data:image/jpeg;base64,'
base64 -w0 help.png
echo -n -
} > ../out_tmp/b64_sed_script
lend

lstart "generate out/index.xhtml"
{
echo "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\
<html xml:lang='en' lang='en' xmlns='http://www.w3.org/1999/xhtml'>\
<head><!--"
echo 'unminified: https://gdccdated.glitch.me/index_multifile.xhtml'
echo -n "--><title>geometry dash CC*.dat editor</title>\
<meta name='referrer' content='no-referrer'/>\
<meta name='application-name' content='gdccdated'/>\
<meta name='author' content='BZZZZ'/>\
<meta name='description' content='CCGameManager.dat or CCLocalLevels.dat editor'/>\
<meta name='theme-color' content='hsl(120,10%,17%)'/>\
<meta property='og:title' content='geometry dash CC*.dat editor'/>\
<meta property='og:type' content='website'/>\
<meta property='og:url' content='https://gdccdated.glitch.me/index.xhtml'/>\
<meta property='og:image' content='https://gdccdated.glitch.me/big_favicon.png'/>\
<meta property='og:site_name' content='gdccdated'/>\
<meta property='og:description' content='CCGameManager.dat or CCLocalLevels.dat editor'/>\
<link rel='canonical' href='https://gdccdated.glitch.me/index.xhtml'/>\
<style>"
cat ../out_tmp/css ../out_tmp/after_css
} > index.xhtml
lend

lstart "generate out/gdccdated_standalone.xhtml"
{
echo "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\
<html xml:lang='en' lang='en' xmlns='http://www.w3.org/1999/xhtml'>\
<head>\
<title>geometry dash CC*.dat editor</title>\
<meta name='referrer' content='no-referrer'/>\
<meta name='application-name' content='gdccdated'/>\
<meta name='author' content='BZZZZ'/>\
<meta name='description' content='CCGameManager.dat or CCLocalLevels.dat editor'/>\
<meta name='theme-color' content='hsl(120,10%,17%)'/>\
<meta property='og:title' content='geometry dash CC*.dat editor'/>\
<meta property='og:type' content='website'/>\
<meta property='og:url' content='https://gdccdated.glitch.me/index.xhtml'/>\
<meta property='og:image' content='https://gdccdated.glitch.me/big_favicon.png'/>\
<meta property='og:site_name' content='gdccdated'/>\
<meta property='og:description' content='CCGameManager.dat or CCLocalLevels.dat editor'/>\
<link rel='canonical' href='https://gdccdated.glitch.me/index.xhtml'/>\
<style>"
sed -f../out_tmp/b64_sed_script ../out_tmp/css
cat ../out_tmp/after_css
} > gdccdated_standalone.xhtml
lend

echo done