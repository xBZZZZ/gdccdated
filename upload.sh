#!/bin/bash
set -o errexit -o pipefail
export LC_ALL=C
function err { printf '\e[1;31m[ERR]\e[22m %s\e[39m\n' "$1" >&2;exit 1;}
function log { printf '\e[1;35m[LOG]\e[22m %s\e[39m\n' "$1" >&2;}
function upcmd { local 'd=42["input","'"$1"'\r"]';echo -n "${#d}:$d";}

d=$(dirname -- "$0")
cd -- "$d/out"

log "generating shell commands for upload"
{
upcmd "exec 2>/dev/null" #mute stderr so bash doesn't send everything back
upcmd "unset HISTFILE;alias 'W=echo -n';exec>/tmp/u"
find -type f | cut -b3- | #remove './' from beginning of all lines
cpio --create --format=ustar --owner=+1000:+1000 |
xz --compress --stdout --extreme -9 |
base64 -w512 | while read b64chunk
do b64chunk='42["input","W '"$b64chunk"'\r"]'
echo -n "${#b64chunk}:$b64chunk"
done
upcmd "exec setsid dash -c 'find -maxdepth 1 -mindepth 1 -exec rm -Rf {} +;base64 -d /tmp/u|tar JxH ustar -f-;exec rm /tmp/u'</dev/null>&2"
} > ../upload_data

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

log "uploading shell commands"
response=$(wget2 --post-file=../upload_data --header=content-type:text/plain)
printf '\e[1;32m[END]\e[22m server response: %s\e[39m\n' "$response" >&2