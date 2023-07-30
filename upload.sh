#!/bin/bash
set -o errexit -o pipefail
export LC_ALL=C
function err { printf '\e[1;31m[ERR]\e[22m %s\e[39m\n' "$1";exit 1;}
function log { printf '\e[1;35m[LOG]\e[22m %s\e[39m\n' "$1";}

d=$(dirname -- "$0")
cd -- "$d"

rm -Rf upload_tmp
mkdir upload_tmp

nonsense=$(xxd -p -l8 /dev/random)
log "generated nonsense: $nonsense"

cd out
7zz a ../upload_tmp/a.tar '*'

cd ../upload_tmp
#z to make 7zz store znonsense.txt last
echo -n "$nonsense" > znonsense.txt
7zz u a.tar znonsense.txt
7zz a -m0=lzma2:x9:fb273:mc1024 -mmt=off -ms=on a.xz a.tar

log "uploading to termbin.com"
termbinurl=$(exec 3<>/dev/tcp/termbin.com/9999;base64 -w0 a.xz>&3;tr -d '\n\0'<&3)
log "termbin url: $termbinurl"

log "asking for console uuid"
url="https://api.glitch.com/console/$(zenity --entry '--text=input console uuid from https://api.glitch.com/console/*/
console uuid looks like xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx
(replace x with one of 0123456789abcdef)')/socket.io/?EIO=3&transport=polling"
function wget2 { wget --tries=1 --output-document=- "$@" -- "$url";}
log "downloading sid"
sid=$(wget2)
[[ $sid =~ \"sid\"[[:space:]]*:[[:space:]]*\"([^\"]*)\" ]] || err "can't find sid in this: $sid"
sid=${BASH_REMATCH[1]//%/%25}
sid=${sid//&/%26}
sid=${sid//#/%23}
[[ $sid =~ \\ ]] && err "can't parse json escapes in sid (url escaped): $sid"
log "sid (url escaped): $sid"
url+="&sid=$sid"

log "downloading until server shell is ready"
until wget2 | grep -zqF $
do [ "${PIPESTATUS[0]}" != 0 ] && err "download failed"
log "server shell is not ready"
done
log "server shell is ready"

log "uploading shell commands"
cmd='42["input","'"exec setsid dash -c 'find -maxdepth 1 -mindepth 1 -exec rm -Rf {} +;curl $termbinurl|base64 -d|tar Jx;exec sync'<>/dev/null 1>&0 2>&0"'\r"]'
response=$(wget2 "--post-data=${#cmd}:$cmd" --header=content-type:text/plain)
log "server response: $response"

log "done, /znonsense.txt on server should contain: $nonsense"