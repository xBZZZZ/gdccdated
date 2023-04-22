#!/bin/bash
set -o errexit -o pipefail
export LC_ALL=C
function err { printf '\e[1;31m[ERR]\e[22m %s\e[39m\n' "$1" >&2;exit 1;}
function log { printf '\e[1;35m[LOG]\e[22m %s\e[39m\n' "$1" >&2;}
function upcmd { local 'd=42["input","'"$1"'\r"]';echo -n "${#d}:$d";}

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
7zz a -m0=lzma2:x9:fb273:mc1024 a.xz a.tar

log "generating shell commands for upload"
{
upcmd "exec 2>/dev/null" #mute stderr so bash doesn't send everything back
upcmd "unset HISTFILE;alias 'W=echo -n';exec>/tmp/u"
base64 -w256 a.xz | while read b64chunk
do b64chunk='42["input","W '"$b64chunk"'\r"]'
echo -n "${#b64chunk}:$b64chunk"
done
upcmd "exec setsid dash -c 'find -maxdepth 1 -mindepth 1 -exec rm -Rf {} +;base64 -d /tmp/u|tar Jx;exec rm /tmp/u'</dev/null>&2"
} > upload_data

log "asking for console uuid"
url="https://api.glitch.com/console/$(zenity --entry '--text=input console uuid from https://api.glitch.com/console/*/
console uuid looks like xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx
(replace x with one of 0123456789abcdef)')/socket.io/?transport=polling"
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
response=$(wget2 --post-file=upload_data --header=content-type:text/plain)
log "server response: $response"

log "done, /znonsense.txt on server should contain: $nonsense"